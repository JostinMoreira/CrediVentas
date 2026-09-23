# Crediventas Caminante

Catálogo digital para el negocio Crediventas Caminante. Clientes consultan productos activos y solicitan información por WhatsApp. El administrador gestiona inventario desde un panel protegido.

## Tecnología

- Angular y SCSS.
- Supabase Auth, PostgreSQL y Storage.
- `browser-image-compression` para comprimir imágenes en el navegador.
- Vercel o Netlify para publicar la aplicación.

## Funciones

- Catálogo público responsivo con productos activos.
- Enlace de WhatsApp por producto y consulta con nombre y precio.
- Inicio y cierre de sesión con correo y contraseña.
- Rutas administrativas protegidas.
- Alta, edición y eliminación de productos.
- Compresión de imágenes a un máximo objetivo de 200 KB.
- Políticas RLS y Storage en `supabase/migrations/202609230001_security_policies.sql`.

## Preparación

1. Instala Node.js compatible con Angular CLI y ejecuta `npm install`.
2. Crea un proyecto Supabase. Crea la tabla `productos` con `id`, `nombre`, `categoria`, `precio`, `estado` e `imagenUrl`. Crea un bucket público llamado `productos`.
3. Crea un usuario administrador en Supabase Auth. No habilites registro público.
4. Copia `.env.example` a `.env` como referencia. Angular sirve credenciales al navegador: usa solo URL del proyecto y publishable/anon key; nunca uses `sb_secret` o `service_role` en el cliente.
5. Actualiza `src/environments/environment.ts` con la URL, publishable key y número de WhatsApp internacional sin `+` ni espacios. Para Ecuador, empieza con `593`.
6. Revisa y ejecuta la migración SQL en el editor de Supabase. Ajusta los nombres si la tabla o bucket de tu proyecto son distintos.

La migración permite lectura pública únicamente para productos activos. Los usuarios autenticados pueden gestionar el inventario y archivos. Como solo el administrador debe autenticarse, crea sus credenciales directamente en Supabase Auth y desactiva el registro abierto.

## Desarrollo

```bash
npm install
npm start
```

La aplicación queda disponible en `http://localhost:4200`.

## Verificación y compilación

```bash
npm run build
npm test
```

La compilación de producción se genera en `dist/crediventas-app/browser`.

## Despliegue

1. Publica el repositorio en GitHub.
2. Importa el repositorio en Vercel o Netlify.
3. Configura el comando de compilación `npm run build` y la carpeta de salida `dist/crediventas-app/browser`.
4. Configura la reescritura SPA. Vercel usa `vercel.json`; para Netlify configura una regla equivalente de `/*` a `/index.html`.
5. Configura variables de Supabase en el entorno de compilación si generas `environment.ts` desde tu plataforma. Las credenciales del navegador son públicas por diseño y RLS debe permanecer habilitado.
6. Añade el dominio de producción a las URL permitidas de Supabase Auth y verifica inicio de sesión, imágenes, catálogo y pedidos de WhatsApp.

## Revisión móvil y entrega

Checklist para revisión manual antes de producción:

- Revisa catálogo, detalle de producto, login, formulario y panel en anchos de 360, 768 y 1280 píxeles.
- Confirma que la tabla administrativa permite desplazamiento horizontal en móvil.
- Prueba imágenes de más de 5 MB y confirma que la carga termina cerca del objetivo de 200 KB.
- Comprueba que usuarios anónimos no puedan abrir `/admin` ni `/admin/nuevo-producto`.
- Comprueba que una sesión válida pueda crear y eliminar un producto.
- Completa un pedido de prueba desde catálogo hasta WhatsApp. Confirma número, moneda y texto del mensaje.
- Prueba sesión expirada, falta de conexión y errores de Supabase.

Para capacitar a Don Edison: muestra cómo iniciar y cerrar sesión, revisar inventario, publicar productos con foto y ocultar o eliminar registros. Entrega credenciales por un canal seguro y realiza una operación de prueba junto con él.

Antes de entregar al administrador, crea su cuenta, comparte acceso por un canal seguro, explica inicio/cierre de sesión, alta y eliminación de productos, y confirma quién administrará el teléfono de WhatsApp, Supabase y el dominio.

## Estado operativo y pendientes externos

La compilación local está lista. Antes de operar, configura URL y publishable key reales de Supabase, número de WhatsApp, tabla y bucket, usuario administrador, y aplica las políticas RLS. Ejecuta el checklist móvil y de flujo con el servicio real.

La aplicación no se publicó: requiere cuenta y acceso al proveedor. Capacita a Don Edison con la guía anterior al recibir acceso. La clave secreta que existía en el environment del frontend fue retirada; rótala en Supabase si era válida y revisa el historial Git, pues eliminarla del archivo actual no la borra de commits anteriores.
