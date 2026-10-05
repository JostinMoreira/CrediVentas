alter table public.productos
  add column if not exists descripcion text not null default '',
  add column if not exists especificaciones jsonb not null default '{}'::jsonb,
  add column if not exists imagenes text[] not null default array[]::text[];
do $$ begin
  if not exists (select 1 from pg_constraint where conrelid='public.productos'::regclass and conname='productos_especificaciones_object_check') then
    alter table public.productos add constraint productos_especificaciones_object_check check (jsonb_typeof(especificaciones)='object');
  end if;
end $$;
