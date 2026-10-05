-- Application changes are additive. Existing product rows and images are preserved.
alter table public.productos add column if not exists destacado boolean not null default false;
alter table public.productos alter column nombre set not null, alter column categoria set not null,
  alter column precio set not null, alter column estado set not null;

create or replace function public.normalize_catalog_text(value text)
returns text language sql immutable strict parallel safe set search_path = ''
as $$ select lower(translate(value, 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN')); $$;

create or replace function public.valid_product_specifications(value jsonb)
returns boolean language sql immutable parallel safe set search_path = ''
as $$
  select case when jsonb_typeof(value) = 'object' then
    (select count(*) <= 40 and coalesce(bool_and(
      length(btrim(key)) between 1 and 80 and jsonb_typeof(val) = 'string'
      and length(btrim(val #>> '{}')) between 1 and 500
    ), true) from jsonb_each(value) as entry(key, val))
  else false end;
$$;

alter table public.productos
  add constraint productos_content_limits check (
    length(btrim(nombre)) between 1 and 160 and length(btrim(categoria)) between 1 and 80
    and precio > 0 and precio <= 999999999.99 and precio = round(precio, 2)
    and length(descripcion) <= 5000 and cardinality(imagenes) <= 10
    and public.valid_product_specifications(especificaciones)
  );

alter table public.productos add column if not exists search_text text
  generated always as (public.normalize_catalog_text(nombre || ' ' || categoria || ' ' || descripcion)) stored;
create extension if not exists pg_trgm with schema extensions;
create index if not exists productos_search_idx on public.productos using gin (search_text extensions.gin_trgm_ops);
create index if not exists productos_catalog_order_idx on public.productos (nombre, id) where estado = 'Activo';
create index if not exists productos_category_order_idx on public.productos (categoria, nombre, id) where estado = 'Activo';
create index if not exists productos_featured_idx on public.productos (nombre, id) where estado = 'Activo' and destacado;

-- Remove residual privileges such as anonymous TRUNCATE, retaining RLS on every operation.
revoke all on table public.productos from public, anon, authenticated;
grant select on table public.productos to anon;
grant select, insert, update, delete on table public.productos to authenticated;
alter table public.productos enable row level security;

create or replace function public.catalog_products(
  search_term text default '', category_name text default null,
  active_only boolean default true, featured_only boolean default false
) returns setof public.productos language sql stable security invoker set search_path = ''
as $$
  select p.* from public.productos p
  where (not active_only or p.estado = 'Activo')
    and (category_name is null or p.categoria = category_name)
    and (not featured_only or p.destacado)
    and (coalesce(btrim(search_term), '') = '' or p.search_text like
      '%' || replace(replace(replace(public.normalize_catalog_text(left(search_term, 120)),
        chr(92), chr(92)||chr(92)), '%', chr(92)||'%'), '_', chr(92)||'_') || '%');
$$;
create or replace function public.catalog_categories()
returns table(categoria text) language sql stable security invoker set search_path = ''
as $$ select distinct p.categoria from public.productos p where p.estado = 'Activo' order by p.categoria; $$;

revoke all on function public.normalize_catalog_text(text), public.valid_product_specifications(jsonb),
  public.catalog_products(text,text,boolean,boolean), public.catalog_categories() from public;
grant execute on function public.normalize_catalog_text(text), public.valid_product_specifications(jsonb),
  public.catalog_products(text,text,boolean,boolean), public.catalog_categories() to anon, authenticated, service_role;

-- Check references inside Storage RLS as well as in the client, including gallery thumbnails.
create or replace function public.product_image_is_referenced(object_name text)
returns boolean language sql stable security invoker set search_path = ''
as $$
  select exists (
    select 1 from public.productos p
    cross join lateral unnest(array_prepend(p."imagenUrl", p.imagenes)) as image(url)
    where split_part(image.url, '/storage/v1/object/public/productos/', 2) =
      case when object_name ~ '^images/v2-[0-9a-f-]+-thumb[.]webp$'
        then regexp_replace(object_name, '-thumb[.]webp$', '.webp')
        else object_name end
  );
$$;
revoke all on function public.product_image_is_referenced(text) from public, anon;
grant execute on function public.product_image_is_referenced(text) to authenticated, service_role;

drop policy if exists "Authenticated admins can delete product images" on storage.objects;
create policy "Authenticated admins can delete product images"
on storage.objects for delete to authenticated using (
  bucket_id = 'productos'
  and (select coalesce((auth.jwt()->'app_metadata'->>'is_admin')::boolean, false))
  and not public.product_image_is_referenced(name)
);

-- Public images remain publicly retrievable by URL; only administrators need object listing.
drop policy if exists "Public can read product images" on storage.objects;
create policy "Admins can list product images" on storage.objects for select to authenticated
using (bucket_id = 'productos' and (select coalesce((auth.jwt()->'app_metadata'->>'is_admin')::boolean, false)));

-- Minimal audit trail. Payloads, prices, tokens and user contact data are never copied into it.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.catalog_audit (
  id bigint generated always as identity primary key,
  product_id uuid not null,
  actor_id uuid not null,
  operation text not null check (operation in ('INSERT','UPDATE','DELETE')),
  occurred_at timestamptz not null default now()
);
alter table private.catalog_audit enable row level security;
revoke all on private.catalog_audit from public, anon, authenticated;
create or replace function private.record_catalog_change()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is not null then
    insert into private.catalog_audit(product_id, actor_id, operation)
    values (coalesce(new.id, old.id), auth.uid(), tg_op);
  end if;
  return coalesce(new, old);
end;
$$;
revoke all on function private.record_catalog_change() from public, anon, authenticated;
drop trigger if exists record_catalog_change on public.productos;
create trigger record_catalog_change after insert or update or delete on public.productos
for each row execute function private.record_catalog_change();

notify pgrst, 'reload schema';

