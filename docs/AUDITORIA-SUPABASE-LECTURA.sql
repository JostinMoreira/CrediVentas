-- Inspección administrativa de solo lectura. No es una migración.
-- Preparada en la auditoría del 2026-10-05; no ejecutada en remoto.
-- No consulta usuarios, tokens, contraseñas ni contenido de productos.
begin read only;

-- RLS y propietario de las tablas de interés.
select n.nspname as schema_name, c.relname as table_name,
       c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced,
       pg_get_userbyid(c.relowner) as owner
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where (n.nspname = 'public' and c.relname = 'productos')
   or (n.nspname = 'storage' and c.relname = 'objects');

-- Todas las políticas, incluidas las no declaradas en las migraciones.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where (schemaname = 'public' and tablename = 'productos')
   or (schemaname = 'storage' and tablename = 'objects')
order by schemaname, tablename, cmd, policyname;

-- Grants explícitos visibles para el rol que ejecute esta inspección.
select table_schema, table_name, grantee, privilege_type
from information_schema.table_privileges
where ((table_schema = 'public' and table_name = 'productos')
    or (table_schema = 'storage' and table_name = 'objects'))
  and grantee in ('anon', 'authenticated', 'PUBLIC')
order by table_schema, table_name, grantee, privilege_type;

-- Tipos, nulabilidad y valores predeterminados efectivos.
select column_name, data_type, udt_name, is_nullable, column_default,
       character_maximum_length, numeric_precision, numeric_scale
from information_schema.columns
where table_schema = 'public' and table_name = 'productos'
order by ordinal_position;

-- Claves y restricciones efectivas, incluidos estados válidos.
select conname, contype, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = to_regclass('public.productos')
order by conname;

-- Configuración del bucket, sin listar nombres de archivos.
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'productos';

rollback;
