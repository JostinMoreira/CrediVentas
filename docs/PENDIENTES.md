# Trabajo pendiente — CrediVentas

Estado revisado el **5 de octubre de 2026**. Esta lista concentra el trabajo restante; la [auditoría inicial](AUDITORIA-2026-10-05.md) conserva los hallazgos históricos y el [informe de correcciones](CORRECCIONES-2026-10-05.md) detalla las comprobaciones realizadas.

## Completado y comprobado

- [x] Correcciones de catálogo, panel, imágenes, permisos y validación.
- [x] Compilación de producción y 61 pruebas de aplicación aprobadas.
- [x] Auditoría de dependencias: 0 vulnerabilidades conocidas en la consulta indicada.
- [x] Historial remoto alineado con las seis migraciones del repositorio.
- [x] Instalación desde cero con Docker, pruebas SQL por roles y sesiones/cargas reales en Supabase local.
- [x] Limpieza de cuentas, productos e imágenes temporales locales; pruebas remotas revertidas.
- [x] Revisión del catálogo móvil y de la ficha en los tamaños documentados.

## Prioridad 1: preparación para producción

### 1. Ajustes de Auth alojado

- [ ] Cerrar el registro público, manteniendo disponible el acceso por correo de administradores existentes.
- [ ] Revisar requisitos de contraseña y reautenticación.
- [ ] Activar la protección contra contraseñas filtradas si el plan lo permite; documentar la decisión si no está disponible.

**Terminado cuando:** un administrador puede entrar, un registro público es rechazado y los ajustes quedan comprobados en el proyecto remoto. Falta acceso al panel autenticado: el conector disponible no modifica esta configuración. Los valores de `supabase/config.toml` solo afectan al entorno local. Pasos en [OPERACION.md](OPERACION.md#ajustes-pendientes-en-el-panel-de-supabase).

### 2. MFA del administrador

- [ ] Activar MFA de la cuenta del propietario en el panel de Supabase.
- [ ] Implementar enrolamiento, desafío y recuperación de MFA para el administrador de la aplicación.
- [ ] Comprobar el flujo completo antes de exigir AAL2 en los permisos administrativos.

**Terminado cuando:** el administrador puede entrar con segundo factor, recuperarse de una pérdida de acceso y las operaciones protegidas requieren el nivel previsto. En la inspección no había factores verificados para el administrador de la aplicación.

### 3. Ejecutar CI en GitHub

- [ ] Ejecutar el workflow versionado en el repositorio remoto.
- [ ] Confirmar compilación, pruebas de aplicación, auditoría, migraciones desde cero y pruebas de Auth/Storage.

**Terminado cuando:** existe una ejecución correcta vinculada al commit revisado. Docker local ya pasó; no se ha comprobado una ejecución de GitHub Actions.

### 4. Publicación y dominio

- [ ] Definir alojamiento y dominio; configurar las variables públicas y URLs de Auth.
- [ ] Comprobar HTTPS, cabeceras, rutas directas, catálogo, acceso administrativo y enlace de WhatsApp.
- [ ] Revisar las infracciones de la CSP completa en observación y ajustar sus orígenes antes de pasarla a bloqueo.

**Terminado cuando:** el despliegue real supera la [revisión de publicación](OPERACION.md#revisión-de-publicación). Falta el dominio y el despliegue; las cabeceras versionadas aún no se verificaron por HTTPS.

### 5. Copias y recuperación

- [ ] Confirmar plan, retención y disponibilidad de copias/PITR.
- [ ] Definir pérdida de datos y tiempo de recuperación tolerables.
- [ ] Cubrir tanto base de datos como archivos de Storage y proteger las copias fuera del repositorio.
- [ ] Restaurar una copia real en un entorno aislado y registrar resultados.

**Terminado cuando:** se recuperan datos e imágenes y se comprueban conteos, búsqueda, permisos y tiempo de restauración. Crear el esquema vacío con Docker no demuestra la recuperación de una copia. Procedimiento en [OPERACION.md](OPERACION.md#copias-y-recuperación).

## Prioridad 2: completar la verificación de uso

- [ ] Revisar el formulario y las operaciones del panel en navegador con sesión administrativa autorizada, incluidos errores y reintentos.
- [ ] Comprobar una galería con varias fotografías reales; las pruebas de cliente actuales incluyen imágenes simuladas.
- [ ] Revisar dispositivos reales, teclado, lector de pantalla y zoom del navegador.
- [ ] Medir rendimiento con Lighthouse y registrar condiciones y resultados.

**Terminado cuando:** quedan evidencias de los recorridos y se corrigen los problemas encontrados. Los tamaños de los archivos de compilación no equivalen a tiempos de carga medidos.

## Prioridad 3: visibilidad y mantenimiento

- [ ] Evaluar prerender/SSR con el dominio definitivo y comprobar vistas previas de redes y metadatos de fichas sin JavaScript.
- [ ] Elegir un recolector de errores remoto, definir anonimización/retención y verificar recepción de eventos. El diagnóstico actual es local.
- [ ] Definir inventario periódico y limpieza segura de imágenes huérfanas; evaluar una cola persistente en servidor. La cola actual depende del navegador.
- [ ] Definir retención y revisión de la auditoría privada, además de una rutina de actualización de dependencias y revisión de asesores.

**Terminado cuando:** cada medida elegida tiene responsable, configuración y comprobación documentadas. No borrar imágenes históricas ni eventos de auditoría sin verificar referencias, copias y retención.

## Decisiones de producto futuras

La portada utiliza destacados editoriales. Una clasificación de “más elegidos” requeriría decidir qué interacción se mide e implementar esa medición. No existe todavía un ranking de popularidad. Un carrito, cobro en línea o flujo de financiación requieren alcance adicional; el pedido actual se solicita por WhatsApp.
