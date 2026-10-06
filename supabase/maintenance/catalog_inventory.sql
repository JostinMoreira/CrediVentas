-- Ejecutar con una conexión de operador (SQL Editor o psql), nunca desde el cliente.
-- Inventario de lectura: no cambia productos, imágenes ni auditoría.
with image_inventory as (
  select name, created_at, public.product_image_is_referenced(name) as referenced
  from storage.objects
  where bucket_id = 'productos'
)
select count(*) as total_objects,
       count(*) filter (where referenced) as referenced_objects,
       count(*) filter (where not referenced) as orphan_candidates,
       count(*) filter (where not referenced and created_at < now() - interval '48 hours')
         as older_orphan_candidates
from image_inventory;

-- Candidatos para investigación manual. La antigüedad evita incluir cargas en curso.
-- Revisar referencias y copias antes de cualquier borrado mediante Storage API.
select name, created_at
from storage.objects
where bucket_id = 'productos'
  and created_at < now() - interval '48 hours'
  and not public.product_image_is_referenced(name)
order by created_at, name
limit 100;

select count(*) as audit_events,
       min(occurred_at) as oldest_event,
       max(occurred_at) as newest_event
from private.catalog_audit;
