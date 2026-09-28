-- Apply once from Supabase SQL Editor after checking the existing productos schema.
-- Add only trusted administrator UUIDs to app_metadata.is_admin via Admin API.
-- Never use user_metadata for authorization; users can edit it themselves.

alter table public.productos enable row level security;
grant select on public.productos to anon, authenticated;
grant insert, update, delete on public.productos to authenticated;

-- Product catalog shape. Run after verifying existing types and nullability.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'productos_nombre_not_blank') then
    alter table public.productos add constraint productos_nombre_not_blank check (length(btrim(nombre)) > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'productos_categoria_not_blank') then
    alter table public.productos add constraint productos_categoria_not_blank check (length(btrim(categoria)) > 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'productos_precio_nonnegative') then
    alter table public.productos add constraint productos_precio_nonnegative check (precio >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'productos_estado_valid') then
    alter table public.productos add constraint productos_estado_valid check (estado in ('Activo', 'Oculto'));
  end if;
end $$;

create index if not exists productos_activos_id_idx
  on public.productos (id desc)
  where estado = 'Activo';

-- Configure bucket-level upload limits and MIME allowlist as well.
update storage.buckets
set public = true,
    file_size_limit = 20971520,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
where id = 'productos';

drop policy if exists "Public can read active products" on public.productos;
drop policy if exists "Authenticated users can insert products" on public.productos;
drop policy if exists "Authenticated users can update products" on public.productos;
drop policy if exists "Authenticated users can delete products" on public.productos;
create policy "Public can read active products"
  on public.productos for select
  to anon, authenticated
  using (
    estado = 'Activo'
    or (select coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'is_admin')::boolean, false))
  );

drop policy if exists "Authenticated admins can insert products" on public.productos;
create policy "Authenticated admins can insert products"
  on public.productos for insert to authenticated
  with check ((select coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'is_admin')::boolean, false)));

drop policy if exists "Authenticated admins can update products" on public.productos;
create policy "Authenticated admins can update products"
  on public.productos for update to authenticated
  using ((select coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'is_admin')::boolean, false)))
  with check ((select coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'is_admin')::boolean, false)));

drop policy if exists "Authenticated admins can delete products" on public.productos;
create policy "Authenticated admins can delete products"
  on public.productos for delete to authenticated
  using ((select coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'is_admin')::boolean, false)));

drop policy if exists "Public can read product images" on storage.objects;
drop policy if exists "Authenticated users can upload product images" on storage.objects;
drop policy if exists "Authenticated users can update product images" on storage.objects;
drop policy if exists "Authenticated users can delete product images" on storage.objects;
drop policy if exists "Authenticated users can read product images" on storage.objects;
create policy "Public can read product images"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'productos');

drop policy if exists "Authenticated admins can upload product images" on storage.objects;
create policy "Authenticated admins can upload product images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'productos'
    and (select coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'is_admin')::boolean, false))
  );

drop policy if exists "Authenticated admins can update product images" on storage.objects;
create policy "Authenticated admins can update product images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'productos'
    and (select coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'is_admin')::boolean, false))
  )
  with check (
    bucket_id = 'productos'
    and (select coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'is_admin')::boolean, false))
  );

drop policy if exists "Authenticated admins can delete product images" on storage.objects;
create policy "Authenticated admins can delete product images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'productos'
    and (select coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'is_admin')::boolean, false))
  );
