-- Public reads only active catalog items. Admin authorization comes from app_metadata, never user-editable user_metadata.
alter table public.productos enable row level security;
grant select on public.productos to anon, authenticated;
grant insert, update, delete on public.productos to authenticated;

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

create index if not exists productos_activos_id_idx on public.productos (id desc) where estado = 'Activo';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('productos', 'productos', true, 20971520, array['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Permitir lectura pública de productos" on public.productos;
drop policy if exists "Permitir inserción pública temporal" on public.productos;
drop policy if exists "Public can read active products" on public.productos;
drop policy if exists "Authenticated users can insert products" on public.productos;
drop policy if exists "Authenticated users can update products" on public.productos;
drop policy if exists "Authenticated users can delete products" on public.productos;
drop policy if exists "Authenticated admins can insert products" on public.productos;
drop policy if exists "Authenticated admins can update products" on public.productos;
drop policy if exists "Authenticated admins can delete products" on public.productos;

create policy "Public can read active products"
on public.productos for select to anon, authenticated
using (estado = 'Activo' or (select coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)));

create policy "Authenticated admins can insert products"
on public.productos for insert to authenticated
with check ((select coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)));

create policy "Authenticated admins can update products"
on public.productos for update to authenticated
using ((select coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)))
with check ((select coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)));

create policy "Authenticated admins can delete products"
on public.productos for delete to authenticated
using ((select coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)));

create policy "Public can read product images"
on storage.objects for select to anon, authenticated
using (bucket_id = 'productos');

create policy "Authenticated admins can upload product images"
on storage.objects for insert to authenticated
with check (bucket_id = 'productos' and (select coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)));

create policy "Authenticated admins can update product images"
on storage.objects for update to authenticated
using (bucket_id = 'productos' and (select coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)))
with check (bucket_id = 'productos' and (select coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)));

create policy "Authenticated admins can delete product images"
on storage.objects for delete to authenticated
using (bucket_id = 'productos' and (select coalesce((auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean, false)));
