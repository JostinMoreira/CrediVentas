drop policy if exists "Public can read active products" on public.productos;
create policy "Public can read active products"
on public.productos for select to anon, authenticated
using (estado = 'Activo' or (select coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'is_admin')::boolean, false)));

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

drop policy if exists "Authenticated admins can upload product images" on storage.objects;
create policy "Authenticated admins can upload product images"
on storage.objects for insert to authenticated
with check (bucket_id = 'productos' and (select coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'is_admin')::boolean, false)));

drop policy if exists "Authenticated admins can update product images" on storage.objects;
create policy "Authenticated admins can update product images"
on storage.objects for update to authenticated
using (bucket_id = 'productos' and (select coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'is_admin')::boolean, false)))
with check (bucket_id = 'productos' and (select coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'is_admin')::boolean, false)));

drop policy if exists "Authenticated admins can delete product images" on storage.objects;
create policy "Authenticated admins can delete product images"
on storage.objects for delete to authenticated
using (bucket_id = 'productos' and (select coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'is_admin')::boolean, false)));
