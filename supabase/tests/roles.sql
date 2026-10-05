begin;
insert into public.productos(id,nombre,categoria,precio,estado,"imagenUrl",imagenes,especificaciones)
values
 ('a5d190f1-f888-4ab8-9786-0a78a46c1001','Verificación café','Pruebas aisladas',10,'Activo','https://gmzukzkyrburvhtjgfvb.supabase.co/storage/v1/object/public/productos/images/v2-a5d190f1-f888-4ab8-9786-0a78a46c1001.webp',array['https://gmzukzkyrburvhtjgfvb.supabase.co/storage/v1/object/public/productos/images/v2-a5d190f1-f888-4ab8-9786-0a78a46c1001.webp'],'{}'),
 ('a5d190f1-f888-4ab8-9786-0a78a46c1002','Verificación oculta','Pruebas aisladas',20,'Oculto',null,'{}','{}');
do $test$
declare n integer;
begin
  perform set_config('request.jwt.claims','{"role":"anon","app_metadata":{}}',true);
  execute 'set local role anon';
  select count(*) into n from public.productos where id in ('a5d190f1-f888-4ab8-9786-0a78a46c1001','a5d190f1-f888-4ab8-9786-0a78a46c1002');
  if n <> 1 then raise exception 'FAIL: anon can read hidden data'; end if;
  select count(*) into n from public.catalog_products('VERIFICACION CAFE',null,false,false) where id='a5d190f1-f888-4ab8-9786-0a78a46c1001';
  if n <> 1 then raise exception 'FAIL: normalized search'; end if;
  select count(*) into n from public.catalog_products('verificacion',null,false,false) where categoria='Pruebas aisladas';
  if n <> 1 then raise exception 'FAIL: RPC bypasses RLS'; end if;
  begin
    insert into public.productos(nombre,categoria,precio,estado) values('Unauthorized','Pruebas aisladas',10,'Activo');
    raise exception 'FAIL: anon insert permitted';
  exception when insufficient_privilege then null; end;
  if has_table_privilege(current_user,'public.productos','TRUNCATE') then raise exception 'FAIL: anon truncate'; end if;
  execute 'reset role';
  perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a5d190f1-f888-4ab8-9786-0a78a46c1999","app_metadata":{},"user_metadata":{"is_admin":true}}',true);
  execute 'set local role authenticated';
  select count(*) into n from public.productos where categoria='Pruebas aisladas';
  if n <> 1 then raise exception 'FAIL: user_metadata grants hidden-product access'; end if;
  update public.productos set precio=11 where id='a5d190f1-f888-4ab8-9786-0a78a46c1001';
  get diagnostics n = row_count; if n <> 0 then raise exception 'FAIL: nonadmin update'; end if;
  delete from public.productos where id='a5d190f1-f888-4ab8-9786-0a78a46c1001';
  get diagnostics n = row_count; if n <> 0 then raise exception 'FAIL: nonadmin delete'; end if;
  begin
    insert into public.productos(nombre,categoria,precio,estado) values('Unauthorized','Pruebas aisladas',10,'Activo');
    raise exception 'FAIL: nonadmin insert';
  exception when insufficient_privilege then null; end;
  if has_table_privilege(current_user,'public.productos','TRUNCATE') then raise exception 'FAIL: authenticated truncate'; end if;
  execute 'reset role';
  perform set_config('request.jwt.claims','{"role":"authenticated","sub":"a5d190f1-f888-4ab8-9786-0a78a46c1999","app_metadata":{"is_admin":true}}',true);
  execute 'set local role authenticated';
  select count(*) into n from public.productos where categoria='Pruebas aisladas';
  if n <> 2 then raise exception 'FAIL: admin cannot read hidden'; end if;
  update public.productos set precio=11 where id='a5d190f1-f888-4ab8-9786-0a78a46c1001';
  get diagnostics n = row_count; if n <> 1 then raise exception 'FAIL: admin update'; end if;
  insert into public.productos(id,nombre,categoria,precio,estado) values('a5d190f1-f888-4ab8-9786-0a78a46c1003','Temporary','Pruebas aisladas',10,'Activo');
  delete from public.productos where id='a5d190f1-f888-4ab8-9786-0a78a46c1003';
  get diagnostics n = row_count; if n <> 1 then raise exception 'FAIL: admin delete'; end if;
  begin
    update public.productos set precio=-1 where id='a5d190f1-f888-4ab8-9786-0a78a46c1001';
    raise exception 'FAIL: invalid price accepted';
  exception when check_violation then null; end;
  begin
    update public.productos set especificaciones='{"Marca":12}' where id='a5d190f1-f888-4ab8-9786-0a78a46c1001';
    raise exception 'FAIL: invalid specs accepted';
  exception when check_violation then null; end;
  if not public.product_image_is_referenced('images/v2-a5d190f1-f888-4ab8-9786-0a78a46c1001.webp') then raise exception 'FAIL: image reference'; end if;
  if not public.product_image_is_referenced('images/v2-a5d190f1-f888-4ab8-9786-0a78a46c1001-thumb.webp') then raise exception 'FAIL: thumbnail reference'; end if;
  execute 'reset role';
  select count(*) into n from private.catalog_audit where actor_id='a5d190f1-f888-4ab8-9786-0a78a46c1999';
  if n <> 3 then raise exception 'FAIL: audit trail'; end if;
end $test$;
rollback;
select 'PASS: anonymous, nonadmin, spoofed user_metadata, administrator CRUD, constraints, search, image references and audit; all fixture changes rolled back' as result;
