# CrediVentas Caminante

Catálogo de productos para el hogar y el campo. Los clientes exploran artículos y consultan por WhatsApp; los administradores gestionan productos e imágenes.

## Estado al 6 de octubre de 2026

- Compilación de producción correcta y **83 pruebas aprobadas en 18 archivos**.
- **Siete migraciones aplicadas desde cero con Docker**; permisos, sesiones reales de Auth, MFA y cargas/borrados de imágenes comprobados en Supabase local.
- `npm audit`: **0 vulnerabilidades conocidas** en la última consulta de esa fecha.
- Catálogo y ficha revisados en tamaños de móvil; correcciones de seguridad aplicadas al esquema remoto.
- Las dos imágenes PNG activas se optimizaron a WebP; las cuatro fotos activas ahora suman 264.288 bytes (117.657 bytes menos, aproximadamente 31 %), y las fichas públicas cargan correctamente.

La demostración está publicada en [CrediVentas en Vercel](https://browser-wine-eta.vercel.app/). Quedan verificaciones visuales y decisiones para una futura puesta en producción. El propietario aplazó MFA y decidió continuar sin copias externas por ahora. Consulta la [lista priorizada de pendientes](docs/PENDIENTES.md) y los [resultados con su alcance](docs/CORRECCIONES-2026-10-05.md).

## Funciones

- Catálogo paginado, categorías y búsqueda en servidor que ignora tildes y mayúsculas.
- Selección editorial mediante `destacado`; si no hay destacados, se muestran productos disponibles. No se presenta como una clasificación de popularidad.
- Ficha por ID, descripción, especificaciones, galería, ampliación y enlace de WhatsApp.
- Panel en [una dirección separada](https://crediventas-admin.vercel.app/admin), protegido además por Vercel Authentication; creación/edición/borrado, estados **Activo** y **Oculto**, validación y reintentos.
- Inventario adaptable: tarjetas con imagen y acciones visibles en móvil, dos columnas en tablet y tabla en escritorio.
- Especificaciones técnicas con campos fijos para Marca, Modelo, Color y Garantía, más características adicionales.
- Fotos completas y centradas; nuevas cargas WebP con miniaturas y compresor servido desde la aplicación.
- Limpieza de imágenes desvinculadas, con comprobación de referencias y cola local de reintentos.
- Modo oscuro con preferencia del sistema y selección guardada en el navegador.
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

Los datos de prueba están dentro de ese SQL; no se añaden productos ficticios permanentes al catálogo. El workflow de GitHub Actions ejecuta compilación, pruebas, auditoría de dependencias y verificaciones contra una instancia Supabase local desechable. Usa valores ficticios para la configuración pública y no necesita secretos de GitHub ni accede al proyecto remoto. Se activa al subir cambios o abrir un pull request; no publica a Vercel. La ejecución [#7](https://github.com/JostinMoreira/CrediVentas/actions/runs/37535852581) pasó con los dos jobs correctos y sin los avisos de plataforma de la ejecución anterior.

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
- Hasta 40 especificaciones. Los campos generales tienen etiquetas fijas y solo requieren el valor; las adicionales usan `Nombre: Valor`. Se rechazan líneas inválidas y claves duplicadas.
- La interfaz exige de 1 a 10 imágenes. Se aceptan JPEG, PNG, WebP y AVIF hasta 20 MB por archivo.
- Las cargas nuevas generan una imagen de hasta 1200 px y una miniatura de 180 px; el tamaño final depende de la compresión.
- Los reintentos conservan el ID del producto para evitar duplicados tras perder una respuesta.
- La limpieza verifica referencias antes de borrar. Si falla, el panel ofrece reintentar. La cola vive en ese navegador; no es una tarea programada del servidor.
- No se borraron masivamente imágenes históricas. Su limpieza debe realizarse con un inventario y una copia previos.

## Diseño y navegación

Los tokens vigentes están en `src/styles/_variables.scss`: rojo `#DC2626`, azul `#0369A1`, WhatsApp `#147D3F` y fondo `#F8FAFC`. Se usa Montserrat con alternativas del sistema.

El catálogo restaura posición y desplaza a anclas dejando espacio para la cabecera. Las fichas añaden título, descripción, Open Graph y datos estructurados reales. Al ser una SPA, las vistas previas de redes que no ejecutan JavaScript pueden seguir mostrando metadatos genéricos; prerender/SSR debe planificarse con el dominio de publicación.

## Publicación

La demostración pública está en [browser-wine-eta.vercel.app](https://browser-wine-eta.vercel.app/). El panel está en [crediventas-admin.vercel.app/admin](https://crediventas-admin.vercel.app/admin); requiere primero pertenecer al proyecto en Vercel y después entrar con la cuenta administrativa de la aplicación. En el dominio público, `/login` y `/admin` responden 403, incluso con una sesión de la aplicación. Esta separación se comprobó en los dominios publicados el 6 de octubre de 2026. HTTPS, la reescritura de rutas y las cabeceras configuradas respondieron correctamente.

Para futuras publicaciones en Vercel:

- Configura las tres variables públicas en el entorno de build.
- Usa `npm run build` y `dist/crediventas-app/browser`. Después prepara la configuración de cada proyecto con `node scripts/prepare-vercel.mjs admin` o `node scripts/prepare-vercel.mjs public` antes de desplegar esa carpeta. Publica primero el panel protegido y comprueba su acceso; publica después el catálogo público.
- `vercel.json` incluye reescritura SPA, bloqueo del login y panel en el proyecto público, protección contra marcos, MIME sniffing, política de referencia, permisos del navegador y una CSP completa **en observación**. La preparación `admin` retira solo el bloqueo de rutas para el proyecto protegido.
- La política completa `Content-Security-Policy-Report-Only` informa infracciones en la consola; no las bloquea ni las envía a un recolector. La política mínima de marcos/objetos/base sí se aplica.
- Comprueba las cabeceras, enlaces directos y Auth contra el dominio elegido antes de ampliar la CSP.
- Netlify u otro alojamiento requieren reglas equivalentes específicas del proveedor.

No se publica automáticamente desde el trabajo local.

Publicación manual de ambos proyectos desde esta carpeta:

```powershell
npm run build
node scripts/prepare-vercel.mjs admin
npx vercel deploy dist/crediventas-app/browser --prod --yes --scope chostinmoreira-1369s-projects --project crediventas-admin
node scripts/prepare-vercel.mjs public
npx vercel deploy dist/crediventas-app/browser --prod --yes --scope chostinmoreira-1369s-projects --project browser
```

El proyecto `crediventas-admin` debe conservar Vercel Authentication con **All Deployments**. Si esa protección se desactiva, el panel pasa a ser visible en su dominio y en sus despliegues anteriores. No publicar la configuración `admin` en el proyecto `browser`.

## Qué falta por hacer

1. Revisar dispositivos físicos, lector de pantalla y zoom del navegador. El inventario publicado se comprobó con sesión administrativa a 390, 768 y 1280 px; la galería de dos fotos reales del Iphone 14 pro pasó.
2. Para una futura puesta en producción, decidir el dominio, revisar los requisitos de contraseña, las URLs de Auth y la política CSP observada.
3. Evaluar vistas previas de redes, monitorización remota y mantenimiento de imágenes/auditoría según el uso real.

MFA y las copias externas están aplazados por decisión del propietario. El plan Free de Supabase no incluye copias programadas: si se prescinde de una copia externa, una pérdida o borrado de datos puede ser irrecuperable.

Los requisitos para dar por terminado cada punto están en [PENDIENTES.md](docs/PENDIENTES.md).

## Calidad y estado

- [Pendientes priorizados](docs/PENDIENTES.md).
- [Auditoría inicial](docs/AUDITORIA-2026-10-05.md).
- [Correcciones y comprobaciones](docs/CORRECCIONES-2026-10-05.md).
- [Operación, copias y límites](docs/OPERACION.md).

La auditoría es una revisión puntual; cero avisos en npm no garantiza ausencia de vulnerabilidades.
