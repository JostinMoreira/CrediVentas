# CrediVentas Caminante

Catálogo de productos para el hogar y el campo. Los clientes exploran artículos y consultan por WhatsApp; los administradores gestionan productos e imágenes.

## Estado al 5 de octubre de 2026

- Compilación de producción correcta y **61 pruebas aprobadas en 16 archivos**.
- **Seis migraciones aplicadas desde cero con Docker**; permisos, sesiones reales de Auth y cargas/borrados de imágenes comprobados en Supabase local.
- `npm audit`: **0 vulnerabilidades conocidas** en la última consulta de esa fecha.
- Catálogo y ficha revisados en tamaños de móvil; correcciones de seguridad aplicadas al esquema remoto.

Quedan ajustes de Auth en producción, MFA, publicación, copias y verificaciones adicionales. Consulta la [lista priorizada de pendientes](docs/PENDIENTES.md) y los [resultados con su alcance](docs/CORRECCIONES-2026-10-05.md).

## Funciones

- Catálogo paginado, categorías y búsqueda en servidor que ignora tildes y mayúsculas.
- Selección editorial mediante `destacado`; si no hay destacados, se muestran productos disponibles. No se presenta como una clasificación de popularidad.
- Ficha por ID, descripción, especificaciones, galería, ampliación y enlace de WhatsApp.
- Panel con acceso administrativo, creación/edición/borrado, estados **Activo** y **Oculto**, validación y reintentos.
- Fotos completas y centradas; nuevas cargas WebP con miniaturas y compresor servido desde la aplicación.
- Limpieza de imágenes desvinculadas, con comprobación de referencias y cola local de reintentos.
- Interfaz adaptable a móvil, controles accesibles y respeto por movimiento reducido.

## Tecnología

Angular 22.2, TypeScript estricto, SCSS, Supabase Auth/PostgreSQL/Storage y Vitest. La aplicación usa renderizado en el navegador (SPA).

## Desarrollo

Requiere una versión de Node compatible con `package.json` (por ejemplo **24.15.0**), npm y un proyecto Supabase configurado.

1. Instala dependencias: `npm ci`.
2. Copia `.env.example` a `.env` y completa los tres valores.
3. Ejecuta `npm start`.
4. Abre [el catálogo local](http://127.0.0.1:4200/).

| Variable | Contenido |
| --- | --- |
| `SUPABASE_URL` | Origen HTTPS del proyecto; para Supabase local se admite HTTP en localhost. |
| `SUPABASE_PUBLISHABLE_KEY` | Clave **publishable** o JWT **anon**. |
| `WHATSAPP_PHONE` | Número internacional completo, con código de país y sin cero local inicial. |

Estos valores son públicos y se incluyen en el navegador. **Nunca** uses `service_role`, `sb_secret`, contraseñas de base de datos o tokens administrativos. El generador rechaza claves privadas.

Los comandos npm generan `src/environments/environment.generated.ts`, ignorado por Git. Las variables del proceso tienen prioridad sobre `.env`. Si usas directamente `ng` desde otro editor, ejecuta antes `npm run config:generate`. `npm run watch` también genera la configuración automáticamente.

## Comandos

| Comando | Resultado |
| --- | --- |
| `npm start` | Configura e inicia desarrollo. |
| `npm run build` | Genera configuración y compila producción. |
| `npm run test:ci` | Ejecuta las pruebas sin modo continuo. |
| `npm run test:db` | Prueba Auth, permisos e imágenes en Supabase local ya iniciado. Rechaza proyectos remotos. |
| `npm run check` | Compilación y pruebas. |
| `npm audit` | Auditoría actual de dependencias. |
| `npm run config:generate` | Regenera solo la configuración pública. |

La salida para publicar está en `dist/crediventas-app/browser`.

## Base de datos

El esquema está en `supabase/migrations`. Incluye tabla inicial, galería, restricciones, políticas, búsqueda, índices y registro administrativo. Los tipos de `src/app/core/models/database.ts` se generaron del proyecto remoto.

### Entorno local aislado

Requiere Docker en ejecución y su CLI disponible en PATH. Este es el arranque usado en las pruebas, con los servicios necesarios para base de datos, Auth y Storage:

```sh
npx --yes supabase@2.119.0 start --exclude realtime,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor
```

La primera ejecución descarga imágenes de contenedores. La configuración local deshabilita nuevos registros; las cuentas de prueba se crean por la API administrativa **local**, nunca con claves privadas dentro del frontend.

Después de iniciar, configura `.env` con la URL y la clave pública locales si quieres usar esa base. Conserva la configuración remota por separado.

Las comprobaciones de permisos se ejecutan dentro de una transacción que termina en `ROLLBACK`:

```powershell
Get-Content supabase/tests/roles.sql | docker exec -i supabase_db_CrediVentas psql -U postgres -d postgres -v ON_ERROR_STOP=1
```

Los datos de prueba están dentro de ese SQL; no se añaden productos ficticios permanentes al catálogo. El workflow de GitHub Actions está configurado para levantar una base limpia y ejecutar estas comprobaciones; su ejecución remota aún está pendiente.

Ejecuta también `npm run test:db` para comprobar sesiones reales de Auth, permisos y cargas/borrados de Storage. Crea cuentas y artículos temporales, los limpia al terminar y conserva sus eventos en la auditoría privada local. Requiere la CLI y Docker disponibles en PATH. Las claves locales se leen internamente; no se guardan en archivos ni se imprimen. El script rechaza servidores remotos.

Para detener los servicios locales conservando su almacenamiento:

```sh
npx --yes supabase@2.119.0 stop --project-id CrediVentas
```

### Cambios de esquema

1. Crea un archivo con `supabase migration new nombre_del_cambio`.
2. Revisa el SQL y los efectos sobre datos existentes.
3. Comprueba la migración en la base local y ejecuta las pruebas.
4. Aplica al proyecto correcto mediante el conector o CLI autorizado.
5. Conserva en el repositorio la versión exacta registrada en el historial remoto y regenera los tipos.

El 5 de octubre de 2026 se alinearon los archivos con el proyecto `gmzukzkyrburvhtjgfvb`. La migración `reconcile_catalog_history` vuelve a aplicar de forma idempotente y registra el esquema inicial y la galería, que existían fuera del historial. No modifica productos existentes.

## Autorización

| Actor | Productos | Archivos del bucket productos |
| --- | --- | --- |
| Visitante | Lee solo Activo | Recupera imágenes públicas por URL |
| Cuenta sin rol | Lee solo Activo | No puede administrar archivos |
| Administrador | Lee y gestiona Activo/Oculto | Lista, carga y gestiona imágenes; no puede borrar una todavía referenciada |

El rol procede de **`app_metadata.is_admin === true`**, gestionado únicamente por un operador autorizado mediante la API administrativa de Supabase. `user_metadata` no concede permisos. El guard valida el usuario en Auth, y RLS aplica la autorización en el servidor.

Las imágenes del bucket son públicas. Ocultar un producto retira su ficha pública, pero **no vuelve privada una URL de imagen ya conocida**. Si necesitas borradores confidenciales, requiere un flujo de almacenamiento privado/publicación separado.

El registro `private.catalog_audit` conserva identificador de producto, actor, operación y fecha. No está expuesto a clientes y no copia los contenidos del producto.

Consulta [operación y seguridad](docs/OPERACION.md) para registro público, contraseñas, MFA y copias.

## Validación e imágenes

- Nombre: 1–160 caracteres; categoría: 1–80; descripción: hasta 5000.
- Precio: desde 0,01 hasta 999.999.999,99 USD, dos decimales.
- Hasta 40 especificaciones con formato `Nombre: Valor`; se rechazan líneas inválidas y claves duplicadas.
- La interfaz exige de 1 a 10 imágenes. Se aceptan JPEG, PNG, WebP y AVIF hasta 20 MB por archivo.
- Las cargas nuevas generan una imagen de hasta 1200 px y una miniatura de 180 px; el tamaño final depende de la compresión.
- Los reintentos conservan el ID del producto para evitar duplicados tras perder una respuesta.
- La limpieza verifica referencias antes de borrar. Si falla, el panel ofrece reintentar. La cola vive en ese navegador; no es una tarea programada del servidor.
- No se borraron masivamente imágenes históricas. Su limpieza debe realizarse con un inventario y una copia previos.

## Diseño y navegación

Los tokens vigentes están en `src/styles/_variables.scss`: rojo `#DC2626`, azul `#0369A1`, WhatsApp `#147D3F` y fondo `#F8FAFC`. Se usa Montserrat con alternativas del sistema.

El catálogo restaura posición y desplaza a anclas dejando espacio para la cabecera. Las fichas añaden título, descripción, Open Graph y datos estructurados reales. Al ser una SPA, las vistas previas de redes que no ejecutan JavaScript pueden seguir mostrando metadatos genéricos; prerender/SSR debe planificarse con el dominio de publicación.

## Publicación

En Vercel:

- Configura las tres variables públicas en el entorno de build.
- Usa `npm run build` y `dist/crediventas-app/browser`.
- `vercel.json` incluye reescritura SPA, protección contra marcos, MIME sniffing, política de referencia, permisos del navegador y una CSP completa **en observación**.
- La política completa `Content-Security-Policy-Report-Only` informa infracciones en la consola; no las bloquea ni las envía a un recolector. La política mínima de marcos/objetos/base sí se aplica.
- Comprueba las cabeceras, enlaces directos y Auth contra el dominio real antes de ampliar la CSP.
- Netlify u otro alojamiento requieren reglas equivalentes específicas del proveedor.

No se publica automáticamente desde el trabajo local.

## Qué falta por hacer

1. Cerrar el registro público y revisar contraseñas en **Auth alojado**. La configuración local ya está probada; no cambia esos ajustes remotos.
2. Incorporar enrolamiento y desafío MFA para el administrador antes de exigir AAL2.
3. Ejecutar el workflow en GitHub y verificar el despliegue en el dominio real, incluyendo HTTPS, cabeceras y CSP.
4. Confirmar copias de datos e imágenes y ensayar su restauración en un entorno aislado.
5. Completar la revisión del panel con sesión real, accesibilidad, galería con varias fotos y dispositivos reales.
6. Preparar vistas previas de redes, monitorización remota y mantenimiento de imágenes/auditoría.

Los requisitos para dar por terminado cada punto están en [PENDIENTES.md](docs/PENDIENTES.md).

## Calidad y estado

- [Pendientes priorizados](docs/PENDIENTES.md).
- [Auditoría inicial](docs/AUDITORIA-2026-10-05.md).
- [Correcciones y comprobaciones](docs/CORRECCIONES-2026-10-05.md).
- [Operación, copias y límites](docs/OPERACION.md).

La auditoría es una revisión puntual; cero avisos en npm no garantiza ausencia de vulnerabilidades.
