# Auditoría de CrediVentas

Fecha: 5 de octubre de 2026, America/Guayaquil. Revisión iniciada la noche del 4 de octubre. Se auditó el estado actual del directorio, incluidos sus cambios pendientes de guardar en Git.

## Resumen

El catálogo carga y el proyecto compila. Hay defectos confirmados en el acceso administrativo, la actualización del inventario y la navegación; también hay dependencias con avisos de seguridad y controles de Supabase que requieren completar su revisión.

No se ha demostrado una intrusión, exposición de credenciales privadas ni escritura no autorizada. Tampoco se puede certificar la seguridad completa del entorno remoto con el acceso disponible.

Prioridades: **P1** = corregir primero; **P2** = siguiente bloque de trabajo; **P3** = optimización o endurecimiento. Estas prioridades del proyecto son distintas de la gravedad que asigna cada aviso de seguridad.

## Qué se verificó

| Comprobación | Resultado |
| --- | --- |
| Compilación de producción, `npm run build` | Correcta. Paquete inicial: 510,93 kB; transferencia estimada: 124,32 kB. Supera en 10,93 kB el presupuesto de advertencia. |
| Pruebas existentes, `npm test -- --watch=false` | 12 archivos y 13 pruebas aprobadas. Son comprobaciones de creación de componentes/servicios y presencia del router. |
| Reproducciones adicionales sin red | 3 pruebas temporales con servicios simulados: fallos de actualización visual en login y eliminación; verificación de carga y actualizaciones del componente de input. Los archivos temporales se eliminaron al terminar. |
| `npm audit --json` | 3 entradas afectadas: 2 críticas y 1 alta, correspondientes a **2 avisos distintos**. Una entrada crítica es la propagación de Piscina a `@angular/build`. |
| `npm audit --omit=dev --json` | 1 entrada alta, Angular Router; el aviso requiere SSR y el proyecto actual es una SPA. |
| Búsqueda de secretos en archivos versionados de aplicación/configuración | No aparecieron claves privadas en los patrones revisados. La clave del cliente es un JWT con rol `anon`. No se hizo un escaneo exhaustivo de todo el historial Git. |
| Supabase, consultas públicas de solo lectura | Catálogo accesible; columnas `descripcion`, `especificaciones` e `imagenes` disponibles. Consulta anónima de estados distintos de Activo devolvió cero filas. |
| Configuración pública de Auth | `disable_signup=false`, proveedor email habilitado, confirmación de email requerida, usuarios anónimos deshabilitados. |
| Navegador local | Inicio a 320, 390 y 768 px; ficha a 320 y 768 px. Imágenes cargadas con `object-fit: contain`, sin desbordamiento horizontal de página en los escenarios comprobados. Búsqueda sin resultados funciona. |

Las pruebas del navegador utilizaron los productos públicos existentes. No se ejecutaron pedidos de WhatsApp, creación de cuentas ni escrituras de productos/archivos en Supabase.

## 1. Seguridad

### S1 — P1: actualizar la dependencia vulnerable de compilación

**Confirmado:** se instala `piscina@5.2.0` mediante `@angular/build@22.1.8`. El aviso GHSA-67c8-pqhq-4rmx describe ejecución de código cuando otra vulnerabilidad permite contaminar `Object.prototype` en el proceso Node que usa Piscina. La versión corregida de esta rama es 5.3.2.

**Alcance:** afecta a herramientas de desarrollo/compilación. No se identificó una cadena explotable desde el catálogo público. No equivale a ejecución remota de código demostrada en la tienda.

**Acción:** actualizar conjuntamente Angular, CLI y build a versiones compatibles corregidas, regenerar el lockfile y repetir auditoría, build y pruebas. El registro npm confirma que `@angular/build@22.2.0` depende de Piscina 5.3.2. Evitar correcciones forzadas sin revisar compatibilidad.

Evidencia: [lockfile de Piscina](C:/Users/Chostin/Desktop/Projects/CrediVentas/package-lock.json:6539), [lockfile de build](C:/Users/Chostin/Desktop/Projects/CrediVentas/package-lock.json:119). [Aviso del mantenedor de Piscina](https://github.com/piscinajs/piscina/security/advisories/GHSA-67c8-pqhq-4rmx).

### S2 — P2: Angular Router tiene un aviso que no aplica a la SPA actual

**Confirmado:** `@angular/router@22.1.7` está en el rango del aviso GHSA-ff3f-86qr-9cv3, corregido en 22.2.0. Se trata de agotamiento de memoria al procesar URLs en SSR sobre Node/V8. La configuración actual no utiliza SSR; el propio aviso excluye las aplicaciones puramente cliente.

**Acción:** incluir Router en la actualización coordinada anterior, especialmente antes de incorporar SSR para SEO.

Evidencia: [lockfile](C:/Users/Chostin/Desktop/Projects/CrediVentas/package-lock.json:385), [configuración Angular](C:/Users/Chostin/Desktop/Projects/CrediVentas/angular.json:22). [Aviso oficial de Angular](https://github.com/angular/angular/security/advisories/GHSA-ff3f-86qr-9cv3).

### S3 — P2: registro público habilitado y guard que solo exige una sesión

**Confirmado en remoto:** la consulta de solo lectura a `/auth/v1/settings` devolvió `disable_signup=false`. Esto contradice la decisión documentada de disponer únicamente de cuentas administrativas. La confirmación por email sí está habilitada. No se intentó registrar ninguna cuenta.

**Confirmado en código:** el guard admite cualquier sesión. El chequeo de `app_metadata.is_admin` existe en el formulario de acceso, pero una sesión obtenida por otra vía no pasa necesariamente por ese formulario.

**Impacto:** superficie de registro innecesaria y acceso de usuarios no administradores a la interfaz del panel. **Esto no demuestra permiso para modificar la base de datos:** las políticas SQL versionadas sí exigen administrador.

**Acción:** deshabilitar nuevos registros si el modelo sigue siendo administrativo; exigir rol en el guard y manejar pérdida/revocación de sesión. Mantener la autorización efectiva en RLS, probarla por rol y evaluar MFA para las cuentas administrativas.

Evidencia: [guard](C:/Users/Chostin/Desktop/Projects/CrediVentas/src/app/core/guards/auth.guard.ts:8), [autenticación](C:/Users/Chostin/Desktop/Projects/CrediVentas/src/app/core/services/auth.ts:23), [README](C:/Users/Chostin/Desktop/Projects/CrediVentas/README.md:104). [Configuración oficial de Supabase Auth](https://supabase.com/docs/guides/auth/general-configuration).

### S4 — P2: falta verificar la configuración efectiva de RLS

El SQL local activa RLS y usa `app_metadata`, que es apropiado para permisos. Sin embargo, solo elimina determinadas políticas por nombre y añade permisos sin eliminar todos los permisos anteriores. Una política permisiva adicional podría ampliar el acceso.

**Estado:** riesgo pendiente de comprobación, no bypass confirmado. Obtener cero productos ocultos mediante una consulta pública no prueba que RLS esté correcta: podrían no existir filas ocultas.

**Acción:** inspeccionar todas las políticas y grants efectivos; probar lectura y escritura para anónimo, usuario normal y administrador en un entorno aislado. También revisar funciones/vistas expuestas, no descritas por completo en este repositorio.

Evidencia: [migración de seguridad](C:/Users/Chostin/Desktop/Projects/CrediVentas/supabase/migrations/202609230001_security_policies.sql:37). Se adjunta [consulta de inspección de solo lectura](C:/Users/Chostin/Desktop/Projects/CrediVentas/docs/AUDITORIA-SUPABASE-LECTURA.sql), preparada pero no ejecutada. [Documentación de RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

### S5 — P3: endurecimiento de despliegue y dependencias externas

- `vercel.json` solo configura la reescritura SPA. No versiona CSP, protección contra inclusión en marcos ni otras cabeceras de seguridad. El hosting podría configurarlas fuera del repositorio; hace falta comprobar el dominio desplegado. Incorporar una CSP adaptada a Angular, Supabase y las fuentes, empezando con observación de infracciones, y revisar `frame-ancestors`, `X-Content-Type-Options` y `Referrer-Policy`.
- El compresor usa un Worker que carga código desde jsDelivr. La biblioteca está fijada a 2.0.2, pero sigue existiendo dependencia del CDN durante las subidas. Servir el recurso localmente y configurar `libURL` facilita disponibilidad y una CSP estricta. No se encontró una CVE de esta biblioteca en la auditoría npm ejecutada.
- Las fotos están en un bucket público. Ocultar un producto no hace privada su imagen. Si se necesita confidencialidad de borradores, diseñar almacenamiento privado/publicación explícita.

Evidencia: [Vercel](C:/Users/Chostin/Desktop/Projects/CrediVentas/vercel.json:1), [upload](C:/Users/Chostin/Desktop/Projects/CrediVentas/src/app/core/services/upload.ts:25), [bucket](C:/Users/Chostin/Desktop/Projects/CrediVentas/supabase/migrations/202609230001_security_policies.sql:31). [Guía de seguridad de Angular](https://angular.dev/best-practices/security).

**Clave pública:** la clave `anon` del frontend está diseñada para ser pública y debe estar protegida mediante RLS. No debe tratarse como una filtración de `service_role`. [Tipos de claves Supabase](https://supabase.com/docs/guides/getting-started/api-keys).

## 2. Funcionamiento y datos

### F1 — P1: el login puede quedar mostrando “Ingresando…” tras fallar

Después del `await`, se cambian campos normales sin notificar a Angular. Una reproducción controlada confirmó que el modelo ya contenía el error y `isSubmitting=false`, mientras el DOM no mostraba el error y mantenía el botón deshabilitado. Otra interacción puede refrescarlo.

**Solución:** señales para el estado o notificación explícita de cambios; prueba de credenciales rechazadas y fallo de conexión. [login.ts](C:/Users/Chostin/Desktop/Projects/CrediVentas/src/app/features/admin/pages/login/login.ts:33).

### F2 — P2: un producto eliminado permanece visible

La eliminación actualiza el array después del `await` sin notificar el cambio. La reproducción confirmó cero productos en memoria y una fila todavía presente en el DOM.

**Solución:** estado reactivo o `markForCheck`, indicador de eliminación y bloqueo de envíos repetidos. [dashboard.ts](C:/Users/Chostin/Desktop/Projects/CrediVentas/src/app/features/admin/pages/dashboard/dashboard.ts:66).

### F3 — P2: estados del formulario incompatibles con el SQL

El formulario ofrece `Inactivo` y `Agotado`, mientras la restricción versionada solo acepta `Activo` y `Oculto`. Si esa restricción está desplegada, guardar esas opciones falla. Se confirmó la contradicción local; no se verificó la restricción efectiva en producción.

**Solución:** decidir estados canónicos, tiparlos y alinear formulario, SQL, filtros y etiquetas. [formulario](C:/Users/Chostin/Desktop/Projects/CrediVentas/src/app/features/admin/pages/product-form/product-form.html:78), [restricción](C:/Users/Chostin/Desktop/Projects/CrediVentas/supabase/migrations/202609230001_security_policies.sql:22).

### F4 — P2: ficha y listados dependen de descargar el catálogo completo

El detalle llama a `getAll()` y busca el ID en memoria. Los listados no paginan. Un producto fuera del límite de respuesta de la API aparecería como inexistente, y catálogo/inventario resultarían incompletos. No ocurre con los pocos productos actuales. Supabase documenta un límite predeterminado de 1.000 filas, configurable; no se consultó el límite efectivo del proyecto.

**Solución:** consultar la ficha por ID; paginar listados y aplicar búsqueda/filtros en servidor. Ajustar `getById`, cuyo fallback también descarga todo y oculta errores. [detalle](C:/Users/Chostin/Desktop/Projects/CrediVentas/src/app/features/public/pages/product-detail/product-detail.ts:51), [servicio](C:/Users/Chostin/Desktop/Projects/CrediVentas/src/app/core/services/product.ts:29). [Referencia de select](https://supabase.com/docs/reference/javascript/select).

### F5 — P2: imágenes huérfanas y reintentos que duplican archivos

Se suben las imágenes antes de guardar el producto. Si falla una carga posterior o la escritura del registro, no se borran las anteriores. Quitar una foto del formulario o eliminar el producto tampoco elimina el objeto almacenado.

**Impacto:** gasto de almacenamiento, archivos duplicados y fotos retiradas aún accesibles por URL. No se cuantificaron archivos huérfanos remotos.

**Solución:** conservar paths, compensar subidas fallidas y limpiar objetos desvinculados tras confirmar cambios, verificando que ningún producto los utilice. [cargas](C:/Users/Chostin/Desktop/Projects/CrediVentas/src/app/core/services/upload.ts:73), [guardado](C:/Users/Chostin/Desktop/Projects/CrediVentas/src/app/features/admin/pages/product-form/product-form.ts:125), [borrado](C:/Users/Chostin/Desktop/Projects/CrediVentas/src/app/core/services/product.ts:123).

### F6 — P2: falta una base de datos reproducible

Las migraciones parten de una tabla y un bucket ya existentes; no los crean. El README los deja a configuración manual y no especifica totalmente tipos, defaults, claves y nulabilidad. Las restricciones `CHECK` no sustituyen a `NOT NULL`; es necesario comprobar el esquema real.

**Solución:** versionar esquema inicial, configuración local, índices y restricciones; añadir datos de prueba y pruebas de permisos en un entorno aislado. Verificar precisión de precios, límites de textos/imágenes y estructura de especificaciones. [primera migración](C:/Users/Chostin/Desktop/Projects/CrediVentas/supabase/migrations/202609230001_security_policies.sql:5), [README](C:/Users/Chostin/Desktop/Projects/CrediVentas/README.md:103).

### F7 — P3: errores, especificaciones y navegación entre IDs

- Diferenciar fallo de conexión, producto inexistente y falta de permisos. La ficha y `getById` convierten errores en ausencia; el inicio pide reintentar sin ofrecer un botón.
- Validar las líneas de especificaciones: las que no tienen `:` se descartan y las claves repetidas se sobrescriben sin aviso. Preferir filas separadas para nombre/valor. [parser](C:/Users/Chostin/Desktop/Projects/CrediVentas/src/app/features/admin/pages/product-form/product-form.ts:132).
- La ficha lee el ID una sola vez desde `snapshot`. Reaccionar a cambios de parámetros si Angular reutiliza el componente para otra ficha. [carga](C:/Users/Chostin/Desktop/Projects/CrediVentas/src/app/features/public/pages/product-detail/product-detail.ts:48).
- Crear las suscripciones del panel antes de operaciones asíncronas y vincularlas a su destrucción; actualmente puede suscribirse después de que se abandone la página. [dashboard](C:/Users/Chostin/Desktop/Projects/CrediVentas/src/app/features/admin/pages/dashboard/dashboard.ts:34).
- Mejorar `UiInput`: `writeValue()` y `setDisabledState()` no notifican cambios. Una reproducción confirmó que cambios programáticos posteriores al render pueden dejar el valor y estado deshabilitado anteriores en pantalla. **La apertura actual del formulario de edición sí se comprobó correcta**, porque los inputs se crean después de cargar el producto. Corregir el contrato del componente para otros usos y añadir regresión. [UiInput](C:/Users/Chostin/Desktop/Projects/CrediVentas/src/app/shared/ui/ui-input/ui-input.ts:31).

## 3. Interfaz, móvil y accesibilidad

| Prioridad | Hallazgo y evidencia | Mejora |
| --- | --- | --- |
| P2 | “Explorar catálogo” del encabezado cambia el fragmento pero no desplaza. Confirmado en navegador a 390 px: `scrollY=0` antes y después. [Router](C:/Users/Chostin/Desktop/Projects/CrediVentas/src/app/app.config.ts:8). | Habilitar desplazamiento a anclas y restauración del scroll, coordinados con la carga de productos. |
| P2 | “Carrito (0)” no tiene acción ni flujo. [Navbar](C:/Users/Chostin/Desktop/Projects/CrediVentas/src/app/shared/components/navbar/navbar.html:12). | Implementar un carrito real si el negocio lo necesita o retirar el control hasta entonces. |
| P2 | Blanco sobre el verde `#25D366` tiene contraste aproximado 1,98:1. [Botón](C:/Users/Chostin/Desktop/Projects/CrediVentas/src/app/shared/ui/ui-button/ui-button.scss:66). | Oscurecer el fondo o cambiar el texto; revisar también acento y etiquetas de estado. |
| P2 | Botones anidados dentro de enlaces, incluidos WhatsApp y Cancelar. [Tarjeta](C:/Users/Chostin/Desktop/Projects/CrediVentas/src/app/shared/components/product-card/product-card.html:18). | Un único elemento interactivo por acción, con estilo compartido. |
| P2 | El CTA fijo de WhatsApp tapa el copyright del pie a 320 px, incluso llegando al final del documento. Confirmado por captura y coordenadas. [Estilos](C:/Users/Chostin/Desktop/Projects/CrediVentas/src/app/features/public/pages/product-detail/product-detail.scss:29). | Reservar espacio al final de toda la página, incluido el footer y área segura. |
| P2 | Documento declarado en inglés con interfaz española. [index.html](C:/Users/Chostin/Desktop/Projects/CrediVentas/src/index.html:2). | Usar `lang="es"` o `es-EC`. |
| P2 | Errores visuales sin `aria-invalid`/`aria-describedby`. [UiInput](C:/Users/Chostin/Desktop/Projects/CrediVentas/src/app/shared/ui/ui-input/ui-input.html:4). | Asociar mensajes, anunciar fallos y enfocar el primer campo inválido. |
| P3 | Eliminar foto tiene área de 22×22 px. [Estilos](C:/Users/Chostin/Desktop/Projects/CrediVentas/src/app/features/admin/pages/product-form/product-form.scss:97). | Aumentar el área táctil hacia 44×44 px. |
| P3 | `scrollTo` de galería fuerza movimiento suave. [Detalle](C:/Users/Chostin/Desktop/Projects/CrediVentas/src/app/features/public/pages/product-detail/product-detail.ts:32). | Respetar `prefers-reduced-motion` también en JavaScript. |

Referencias: [desplazamiento de Angular Router](https://angular.dev/api/router/withInMemoryScrolling), [contraste WCAG](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

Pendiente de validación visual: formulario administrativo a 320–375 px, cuyo grupo Cancelar/Guardar no permite saltos de línea; galería con varias imágenes; teclado, lector de pantalla, zoom al 200 % y dispositivos reales. El producto abierto solo tenía una imagen. La cabecera sí permaneció visible durante el desplazamiento comprobado; no se confirma un fallo de sticky.

## 4. Rendimiento, descubrimiento y mantenimiento

- **P2 — Pruebas de comportamiento:** las 13 actuales pasan, pero no cubren autenticación, permisos, CRUD, errores, imágenes ni galería. Añadir regresiones de los fallos reproducidos, integración con Supabase aislado y comprobaciones de navegación/móvil. Incorporar estas comprobaciones y auditoría de dependencias al proceso automático del repositorio.
- **P2 — Tipado:** activar gradualmente `strict` y `strictTemplates`, tipar formularios/estados y generar tipos de base de datos. Las aserciones `as Product` no validan respuestas en tiempo de ejecución. [tsconfig](C:/Users/Chostin/Desktop/Projects/CrediVentas/tsconfig.json:5), [modelo](C:/Users/Chostin/Desktop/Projects/CrediVentas/src/app/core/services/product.ts:4).
- **P3 — Tamaño inicial:** reducir los 510,93 kB medidos mediante análisis de dependencias y carga diferida. El exceso es pequeño; paginación y gestión de imágenes tendrán mayor impacto cuando crezca el catálogo. No se midieron Lighthouse ni métricas reales de usuarios.
- **P3 — Galería:** las miniaturas usan imágenes originales sin lazy loading, así que solicitan todas las fotos aunque las diapositivas posteriores sean diferidas. Crear miniaturas y tamaños adecuados; añadir fallback en la ficha. [galería](C:/Users/Chostin/Desktop/Projects/CrediVentas/src/app/features/public/pages/product-detail/product-detail.html:24).
- **P3 — Destacados:** actualmente son los primeros cuatro por ID descendente; no representan popularidad. Elegir selección editorial o medir visitas/clics de interés con protección contra abuso. Los UUID ordenados no garantizan fecha de creación. [Home](C:/Users/Chostin/Desktop/Projects/CrediVentas/src/app/features/public/pages/home/home.ts:28).
- **P3 — SEO y compartir:** título de ficha genérico, sin metadatos específicos, Open Graph ni datos estructurados Product. Añadir datos reales y valorar prerender/SSR para vistas previas externas después de corregir dependencias. [rutas](C:/Users/Chostin/Desktop/Projects/CrediVentas/src/app/app.routes.ts:15).
- **P3 — Búsqueda:** añadir normalización de tildes, limpiar filtros y conteo accesible de resultados. Incorporar marca/modelo cuando existan esos campos.
- **P3 — Estilos:** consolidar reglas de Home actualmente repartidas entre componente y globales. Eliminar Cormorant si no se utiliza y cargar los pesos de Montserrat realmente usados. [globales](C:/Users/Chostin/Desktop/Projects/CrediVentas/src/styles.scss:61), [tipografía](C:/Users/Chostin/Desktop/Projects/CrediVentas/src/styles/_typography.scss:2).
- **P3 — Configuración y documentación:** falta `.env.example`, aunque README lo menciona. No hay generación/inyección desde `.env`; el código importa directamente `environment.ts`. Documentar el proceso real, separar configuración por entorno y actualizar diseño, funciones y estado de migraciones. Las columnas de galería sí existen en la API actual; no hay evidencia de que falte esa migración completa.
- **P3 — Operación:** definir copias de seguridad, restauración comprobada, registro de acciones administrativas y captura de errores sin datos sensibles. El repositorio no permite confirmar su configuración remota actual.

## 5. Límites y comprobaciones pendientes de Supabase

No hubo conector administrativo de Supabase disponible en esta revisión. Las consultas públicas permitieron comprobar catálogo y ciertos ajustes de Auth, pero no inspeccionar `pg_policies`, grants completos, restricciones, usuarios/MFA, backups ni registros internos. La consulta al esquema OpenAPI fue rechazada (401).

Antes de dar por validado el backend:

1. Ejecutar la inspección SQL adjunta con acceso administrativo de solo lectura y revisar políticas adicionales.
2. Reproducir permisos en un entorno aislado: anónimo lee activos; usuario común no escribe; administrador gestiona productos y archivos; ocultos no se muestran al público.
3. Verificar límites y tipos del esquema, configuración del bucket, políticas de contraseñas, MFA, sesiones y URLs de redirección.
4. Comprobar cabeceras y HTTPS en el dominio de producción.
5. Probar recuperación desde una copia de seguridad en un entorno separado.

## Orden de trabajo recomendado

1. **Dependencias y administración:** actualizar Angular/build; corregir reactividad del login y borrado; alinear estados del formulario; corregir guard y configuración de registro.
2. **Integridad y permisos:** inspeccionar RLS real, versionar esquema base, probar roles y gestionar limpieza de imágenes.
3. **Catálogo y móvil:** ficha por ID, paginación, errores recuperables, anclas, contraste y pie de página libre del CTA.
4. **Calidad continua:** ampliar pruebas, automatizar comprobaciones, reforzar tipos y documentar configuración.
5. **Crecimiento comercial:** destacados con criterio real, SEO, imágenes adaptadas y búsqueda más útil.

Se preservaron los cambios existentes. Esta entrega contiene documentación de auditoría; no aplica migraciones ni correcciones funcionales.
