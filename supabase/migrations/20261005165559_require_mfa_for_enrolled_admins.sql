-- Opt-in MFA: existing admins can enroll without being locked out. Once any
-- factor is verified, AAL1 tokens cannot administer products or Storage.
create or replace function private.catalog_admin_authorized()
returns boolean language sql stable security definer set search_path = ''
as $$
  select auth.uid() is not null
    and coalesce(auth.jwt() -> 'app_metadata' -> 'is_admin' = 'true'::jsonb, false)
    and (
      auth.jwt() ->> 'aal' = 'aal2'
      or not exists (
        select 1 from auth.mfa_factors f
        where f.user_id = auth.uid() and f.status = 'verified'
      )
    );
$$;
-- SECURITY DEFINER is limited to inspecting the caller's enrollment. No
-- parameters, account data, or auth schema access are exposed to clients.
revoke all on function private.catalog_admin_authorized() from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.catalog_admin_authorized() to anon, authenticated;

alter policy "Public can read active products" on public.productos
using (estado = 'Activo' or (select private.catalog_admin_authorized()));
alter policy "Authenticated admins can insert products" on public.productos
with check ((select private.catalog_admin_authorized()));
alter policy "Authenticated admins can update products" on public.productos
using ((select private.catalog_admin_authorized()))
with check ((select private.catalog_admin_authorized()));
alter policy "Authenticated admins can delete products" on public.productos
using ((select private.catalog_admin_authorized()));

alter policy "Admins can list product images" on storage.objects
using (bucket_id = 'productos' and (select private.catalog_admin_authorized()));
alter policy "Authenticated admins can upload product images" on storage.objects
with check (bucket_id = 'productos' and (select private.catalog_admin_authorized()));
alter policy "Authenticated admins can update product images" on storage.objects
using (bucket_id = 'productos' and (select private.catalog_admin_authorized()))
with check (bucket_id = 'productos' and (select private.catalog_admin_authorized()));
alter policy "Authenticated admins can delete product images" on storage.objects
using (bucket_id = 'productos' and (select private.catalog_admin_authorized())
  and not public.product_image_is_referenced(name));
