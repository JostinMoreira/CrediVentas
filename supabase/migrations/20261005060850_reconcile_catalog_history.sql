-- Reconcile the baseline and gallery previously created outside migration tracking.
-- Both scripts are reapplied idempotently before recording their exact contents.
-- Baseline captured from the existing catalog; no rows are modified.
create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null, categoria text not null, precio numeric not null,
  estado text not null default 'Activo', "imagenUrl" text,
  created_at timestamptz default now()
);
insert into storage.buckets (id,name,public) values ('productos','productos',true)
on conflict (id) do nothing;

alter table public.productos
  add column if not exists descripcion text not null default '',
  add column if not exists especificaciones jsonb not null default '{}'::jsonb,
  add column if not exists imagenes text[] not null default array[]::text[];
do $$ begin
  if not exists (select 1 from pg_constraint where conrelid='public.productos'::regclass and conname='productos_especificaciones_object_check') then
    alter table public.productos add constraint productos_especificaciones_object_check check (jsonb_typeof(especificaciones)='object');
  end if;
end $$;

insert into supabase_migrations.schema_migrations(version,name,statements)
values ('20260922000000','bootstrap_catalog',array[$baseline$-- Baseline captured from the existing catalog; no rows are modified.
create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null, categoria text not null, precio numeric not null,
  estado text not null default 'Activo', "imagenUrl" text,
  created_at timestamptz default now()
);
insert into storage.buckets (id,name,public) values ('productos','productos',true)
on conflict (id) do nothing;
$baseline$]),
       ('20260929011836','add_product_details_gallery',array[$gallery$alter table public.productos
  add column if not exists descripcion text not null default '',
  add column if not exists especificaciones jsonb not null default '{}'::jsonb,
  add column if not exists imagenes text[] not null default array[]::text[];
do $$ begin
  if not exists (select 1 from pg_constraint where conrelid='public.productos'::regclass and conname='productos_especificaciones_object_check') then
    alter table public.productos add constraint productos_especificaciones_object_check check (jsonb_typeof(especificaciones)='object');
  end if;
end $$;
$gallery$])
on conflict(version) do nothing;
