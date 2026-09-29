alter table public.productos
  add column if not exists descripcion text not null default '',
  add column if not exists especificaciones jsonb not null default '{}'::jsonb,
  add column if not exists imagenes text[] not null default array[]::text[];

alter table public.productos
  add constraint productos_especificaciones_object_check
  check (jsonb_typeof(especificaciones) = 'object');
