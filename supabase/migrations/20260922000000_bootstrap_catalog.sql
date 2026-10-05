-- Baseline captured from the existing catalog; no rows are modified.
create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null, categoria text not null, precio numeric not null,
  estado text not null default 'Activo', "imagenUrl" text,
  created_at timestamptz default now()
);
insert into storage.buckets (id,name,public) values ('productos','productos',true)
on conflict (id) do nothing;
