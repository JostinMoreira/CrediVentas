-- Run in the Supabase SQL Editor after confirming table and bucket names.
-- Public can read products; only authenticated users can change inventory.
alter table public.productos enable row level security;

drop policy if exists "Public can read active products" on public.productos;
create policy "Public can read active products"
  on public.productos for select
  to anon, authenticated
  using (estado = 'Activo' or auth.role() = 'authenticated');

drop policy if exists "Authenticated users can insert products" on public.productos;
create policy "Authenticated users can insert products"
  on public.productos for insert to authenticated
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can update products" on public.productos;
create policy "Authenticated users can update products"
  on public.productos for update to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

drop policy if exists "Authenticated users can delete products" on public.productos;
create policy "Authenticated users can delete products"
  on public.productos for delete to authenticated
  using (auth.uid() is not null);

-- Public product images; uploads, updates, and deletes require a signed-in user.
drop policy if exists "Public can read product images" on storage.objects;
create policy "Public can read product images"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'productos');

drop policy if exists "Authenticated users can upload product images" on storage.objects;
create policy "Authenticated users can upload product images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'productos' and auth.uid() is not null);

drop policy if exists "Authenticated users can update product images" on storage.objects;
create policy "Authenticated users can update product images"
  on storage.objects for update to authenticated
  using (bucket_id = 'productos' and auth.uid() is not null)
  with check (bucket_id = 'productos' and auth.uid() is not null);

drop policy if exists "Authenticated users can delete product images" on storage.objects;
create policy "Authenticated users can delete product images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'productos' and auth.uid() is not null);

-- Keep the existing item editor usable from the same protected admin session.
drop policy if exists "Authenticated users can update products" on public.productos;
create policy "Authenticated users can update products"
  on public.productos for update to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);
