# Trabajo pendiente — CrediVentas

Estado revisado el **6 de octubre de 2026**. Esta lista concentra el trabajo restante; la [auditoría inicial](AUDITORIA-2026-10-05.md) conserva los hallazgos históricos y el [informe de correcciones](CORRECCIONES-2026-10-05.md) detalla las comprobaciones realizadas.

## Completado y comprobado

- [x] Correcciones de catálogo, panel, imágenes, permisos y validación.
- [x] Compilación de producción y 83 pruebas de aplicación aprobadas.
- [x] Especificaciones generales con etiquetas fijas y compatibilidad con datos existentes.
- [x] Crear, editar y borrar un producto oculto con imagen en el panel remoto; comprobar su ausencia del catálogo público y la limpieza del registro y del archivo. El inventario volvió a cinco productos.
- [x] Auditoría de dependencias: 0 vulnerabilidades conocidas en la consulta indicada.
- [x] Historial remoto alineado con las siete migraciones del repositorio.
- [x] Instalación desde cero con Docker, pruebas SQL por roles y sesiones/cargas reales en Supabase local.
- [x] Limpieza de cuentas, productos e imágenes temporales locales; pruebas remotas revertidas.
- [x] Revisión del catálogo móvil y de la ficha en los tamaños documentados.
- [x] Flujo TOTP y autorización condicional AAL2 para administradores con factor verificado, comprobados con Auth y RLS locales.
- [x] Formulario administrativo y páginas de seguridad revisados con sesión temporal local a 320 px.
- [x] Portada y ficha públicas recorridas con teclado a 320 px: foco visible, apertura con Enter, cierre de ampliación con Escape y retorno del foco; sin desbordamiento horizontal.
- [x] Registro público cerrado en Auth alojado; proveedor de correo activo y `disable_signup=true` confirmado por el endpoint público.
- [x] Cambio seguro de contraseña activado y TOTP habilitado, con límite de 15 minutos para sesiones AAL1.
- [x] Plan Free inspeccionado: el proyecto no dispone de copias programadas de Supabase.
- [x] Lighthouse móvil de la portada local: rendimiento 71, accesibilidad 100, SEO 100 y CLS 0,017 tras las correcciones.

## Prioridad 1: preparación para producción

### 1. Ajustes de Auth alojado

- [x] Cerrar el registro público, manteniendo disponible el acceso por correo de administradores existentes.
- [x] Activar la reautenticación para cambios de contraseña en sesiones antiguas.
- [ ] Revisar la longitud y complejidad mínimas de contraseña con la credencial del administrador real antes de endurecerlas.
- [x] Documentar que la protección contra contraseñas filtradas requiere Pro y no está disponible en el plan Free actual.
- [x] El login distingue el error `weak_password` y orienta a recuperar la cuenta sin revelar mensajes internos de Auth.

**Terminado cuando:** el administrador real confirma su acceso y una prueba controlada comprueba que el alta pública es rechazada. El administrador ya inició sesión y completó el recorrido del panel; el endpoint público confirma `disable_signup=true`. Supabase advierte que endurecer los requisitos puede devolver `WeakPasswordError` a usuarios existentes con contraseñas débiles, así que este cambio necesita revisar primero esa cuenta. Los valores de `supabase/config.toml` solo afectan al entorno local. Detalles en [OPERACION.md](OPERACION.md#ajustes-pendientes-en-el-panel-de-supabase).

### 2. MFA del administrador

**Aplazado por decisión del propietario.** No se realizará durante esta etapa; retomar cuando se complete el resto del proyecto.

- [ ] (Aplazado) Activar MFA de la cuenta del propietario en el panel de Supabase.
- [x] Implementar enrolamiento, desafío, segundo dispositivo de respaldo y retirada protegida de factores TOTP.
- [x] Comprobar en Docker la exigencia de AAL2 para administradores inscritos, incluidos accesos directos a la API con un token AAL1.
- [ ] Enrolar a la cuenta administrativa real, añadir un segundo dispositivo de respaldo y comprobar la recuperación con el titular.

**Terminado cuando se retome:** el administrador real puede entrar con segundo factor, dispone de un respaldo y se ha ensayado su recuperación. El código y las políticas ya están aplicados.

### 3. Dominio definitivo

La demostración pública está en `https://browser-wine-eta.vercel.app/` y el panel en `https://crediventas-admin.vercel.app/admin`. El dominio público bloquea `/login` y `/admin` con 403; el proyecto administrativo exige Vercel Authentication en todos los despliegues y luego el login de la aplicación. El catálogo, la ficha directa, HTTPS y las cabeceras configuradas se comprobaron el 6 de octubre. Un dominio propio para producción se decidirá más adelante.

- [x] Publicar la demostración en Vercel con variables públicas y verificar catálogo, ficha directa, HTTPS, cabeceras, rutas directas y enlace de WhatsApp.
- [x] Separar el panel en un proyecto Vercel protegido y bloquear las rutas administrativas del proyecto público. Comprobado en ambos dominios con y sin sesión de Vercel.
- [ ] Elegir el dominio definitivo y revisar las URLs de Auth para ese dominio.
- [x] Confirmar que el administrador real accede al inventario publicado y que los cinco productos aparecen; el recorrido de crear, editar y borrar ya se probó en el proyecto remoto antes de esta publicación.
- [ ] Revisar las infracciones de la CSP completa en observación y ajustar sus orígenes antes de pasarla a bloqueo.

**Terminado cuando:** el dominio definitivo supera la [revisión de publicación](OPERACION.md#revisión-de-publicación). La CSP completa sigue en observación.

### 4. Copias y recuperación (aplazadas)

**Decisión del propietario:** continuar sin copia externa por ahora. Esto acepta la posibilidad de perder de forma permanente los productos, imágenes y otros datos si ocurre un borrado o una falla sin recuperación disponible. Se retomará antes de depender del sitio para ventas reales.

- [x] Confirmar plan y disponibilidad: Free, sin backups programados de Supabase.
- [x] Preparar comandos de exportación de base de datos y archivos de Storage en [OPERACION.md](OPERACION.md#exportación-manual-en-windows-pendiente-de-definir-destino-seguro).
- [ ] (Aplazado) Definir y establecer una estrategia de copia externa para el plan actual o contratar un plan con backups y confirmar su retención/PITR.
- [ ] (Aplazado) Definir pérdida de datos y tiempo de recuperación tolerables.
- [ ] (Aplazado) Cubrir tanto base de datos como archivos de Storage y proteger las copias fuera del repositorio.
- [ ] (Aplazado) Restaurar una copia real en un entorno aislado y registrar resultados.

**Terminado cuando:** se recuperan datos e imágenes y se comprueban conteos, búsqueda, permisos y tiempo de restauración. El panel indica expresamente que Free no incluye copias del proyecto; es necesario establecer una estrategia antes de considerar cubierta la recuperación. Procedimiento en [OPERACION.md](OPERACION.md#copias-y-recuperación).

## Prioridad 2: completar la verificación de uso

- [x] Publicar el nuevo inventario móvil. Implementado y compilado; tres pruebas del panel aprobadas. El bloqueo de autorización quedó resuelto el 6 de octubre; Vercel confirmó el despliegue `dpl_GfLtv34sjBt9nvb6yqbrxFz2mqXw` como Ready y asignó `https://browser-wine-eta.vercel.app`.
- [x] Revisar el inventario publicado con sesión administrativa a 390, 768 y 1280 px: cinco productos; tarjetas en móvil y tablet, tabla en escritorio; sin desbordamiento horizontal en las tres anchuras.

- [x] Abrir el formulario y verificar errores de validación con una sesión administrativa temporal local a 320 px.
- [x] Completar creación, edición y borrado en navegador con sesión autorizada; los reintentos de error siguen cubiertos por pruebas automatizadas y requieren una falla real controlada para verificarlos manualmente.
- [x] Comprobar una galería con dos fotografías reales en la ficha del Iphone 14 pro: se muestran ambas, la miniatura cambia la imagen activa y el indicador actualiza “Imagen 2 de 2”.
- [x] Optimizar las dos imágenes PNG activas a WebP y comprobar las fichas publicadas; las cuatro imágenes activas suman 264.288 bytes, frente a 381.945 bytes antes del cambio (117.657 bytes menos, aproximadamente 31 %).
- [ ] Revisar dispositivos reales, lector de pantalla y zoom del navegador. El recorrido básico con teclado ya pasó a 320 px.
- [x] Medir la portada con Lighthouse móvil en compilación de producción servida localmente; resultados y límites en [CORRECCIONES-2026-10-05.md](CORRECCIONES-2026-10-05.md#rendimiento-móvil).
- [ ] Comprobar tiempos/caché en dispositivos reales y volver a medir LCP en el dominio publicado. La prueba local anterior estimó 186 KiB de ahorro en imágenes y un LCP de 6,4 s; el peso de las imágenes activas se redujo en producción, pero no se repitió una medición de rendimiento remota.

**Terminado cuando:** quedan evidencias de los recorridos y se corrigen los problemas encontrados. Los tamaños de los archivos de compilación no equivalen a tiempos de carga medidos.

La cuenta temporal local usada en la revisión anterior fue retirada. El 6 de octubre, con una sesión administrativa autorizada en el proyecto remoto, se creó un producto oculto con imagen de prueba, se editaron precio y especificaciones, se confirmó que no aparecía entre los cuatro productos públicos y se eliminó. La consulta posterior encontró cero registros y cero archivos de esa prueba; los cinco productos originales permanecieron.

## Prioridad 3: visibilidad y mantenimiento

- [ ] Publicar los cambios en la rama `test` y confirmar en GitHub Actions que compilen la app, pasen las pruebas y la auditoría, y terminen las pruebas con Supabase local. El workflow usa solo datos ficticios y no requiere secretos del repositorio ni modifica Vercel o Supabase remoto.
- [ ] Evaluar prerender/SSR con el dominio definitivo y comprobar vistas previas de redes y metadatos de fichas sin JavaScript.
- [ ] Elegir un recolector de errores remoto, definir anonimización/retención y verificar recepción de eventos. El diagnóstico actual es local.
- [x] Preparar y ejecutar un [inventario de solo lectura](../supabase/maintenance/catalog_inventory.sql): 2 objetos referenciados y 0 huérfanos en el proyecto remoto.
- [ ] Definir periodicidad, responsable y limpieza segura de imágenes huérfanas; evaluar una cola persistente en servidor. La cola actual depende del navegador.
- [x] Documentar la [rutina de mantenimiento](OPERACION.md#rutina-de-mantenimiento) para dependencias, asesores, imágenes y auditoría.
- [ ] Acordar la retención de la auditoría privada con el propietario y ejecutar la rutina periódica.

**Terminado cuando:** cada medida elegida tiene responsable, configuración y comprobación documentadas. No borrar imágenes históricas ni eventos de auditoría sin verificar referencias, copias y retención.

## Decisiones de producto futuras

La portada utiliza destacados editoriales. Una clasificación de “más elegidos” requeriría decidir qué interacción se mide e implementar esa medición. No existe todavía un ranking de popularidad. Un carrito, cobro en línea o flujo de financiación requieren alcance adicional; el pedido actual se solicita por WhatsApp.

## Fuera del alcance actual

La configuración del workflow está versionada en `.github/workflows/quality.yml`; falta publicar los cambios actuales y revisar una ejecución remota satisfactoria.
