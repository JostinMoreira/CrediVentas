# CrediVentas

Catálogo digital e-commerce para el negocio CrediVentas Caminante. Clientes consultan productos activos y solicitan información por WhatsApp. El administrador gestiona inventario desde un panel protegido.

## Tecnología

| Capa | Stack |
|------|-------|
| **Frontend** | Angular 22, TypeScript, SCSS |
| **Backend / Servicios** | Supabase Auth, PostgreSQL, Storage |
| **Imágenes** | `browser-image-compression` (compresión en navegador) |
| **Deploy** | Vercel o Netlify |

## Sistema de Diseño — Liquid Glass

El frontend utiliza un sistema de diseño premium basado en el estilo **Liquid Glass**, generado y persistido con la skill `ui-ux-pro-max`. El archivo maestro se encuentra en [`design-system/crediventas/MASTER.md`](design-system/crediventas/MASTER.md).

### Paleta de colores

| Token | Hex | Uso |
|-------|-----|-----|
| `--color-primary` | `#1C1917` | Textos principales, botones primarios |
| `--color-accent` | `#A16207` | CTA (llamadas a la acción), precios |
| `--color-background` | `#FAFAF9` | Fondo general de la app |
| `--color-card` | `rgba(255,255,255,0.7)` | Tarjetas con translucidez (glass) |
| `--color-success` | `#10B981` | Badges de estado activo |
| `--color-destructive` | `#DC2626` | Errores, botón de eliminar |

### Tipografía

- **Títulos:** [Cormorant](https://fonts.google.com/specimen/Cormorant) — serif elegante para encabezados premium.
- **Interfaz:** [Montserrat](https://fonts.google.com/specimen/Montserrat) — sans-serif geométrica para cuerpo de texto, formularios y navegación.

### Efectos clave

- Tarjetas con `backdrop-filter: blur(12px)` (efecto glassmorphism).
- Hover lift: elevación suave con sombra fluida (`translateY(-4px) scale(1.01)`).
- Skeleton loaders con animación shimmer `sine.inOut` para estados de carga.
- Animaciones de entrada `slideUpFade` en cascada (staggered).
- Transiciones fluidas: `400ms cubic-bezier(0.25, 1, 0.5, 1)`.

### Variables SCSS

Todas las variables de diseño están centralizadas en:

```
src/styles/
├── _variables.scss    # Colores, spacing, radius, shadows, z-index, transitions
├── _mixins.scss       # respond-to(), liquid-glass(), hover-lift(), focus-ring()
├── _typography.scss   # Google Fonts import, escalas h1-h6
├── _animations.scss   # shimmer, fadeIn, slideUpFade
└── _components.scss   # .container, .glass-card, resets globales
```

## Arquitectura del Proyecto

```
src/app/
├── core/
│   ├── guards/
│   │   └── auth.guard.ts            # Protección de rutas admin
│   └── services/
│       ├── supabase.ts              # Cliente Supabase (singleton)
│       ├── auth.ts                  # Login / logout con Supabase Auth
│       ├── product.ts               # CRUD de productos (PostgreSQL)
│       └── upload.ts                # Compresión + subida a Supabase Storage
│
├── features/
│   ├── admin/pages/
│   │   ├── login/                   # Inicio de sesión administrador
│   │   ├── dashboard/               # Panel de inventario con tabla interactiva
│   │   └── product-form/            # Formulario de alta de productos
│   └── public/pages/
│       ├── home/                    # Hero + grid de productos con skeletons
│       └── product-detail/          # Vista individual de producto
│
└── shared/
    ├── ui/                          # Componentes UI reutilizables
    │   ├── ui-button/               # Variantes: primary, accent, glass, ghost + loading
    │   └── ui-input/                # ControlValueAccessor, focus ring, error states
    └── components/
        ├── navbar/                  # Barra de navegación con glassmorphism
        ├── footer/                  # Pie de página
        └── product-card/            # Tarjeta de producto con hover lift + WhatsApp CTA
```

## Funciones

- Catálogo público responsivo con productos activos desde Supabase.
- Enlace de WhatsApp por producto con nombre y precio pre-cargados.
- Inicio y cierre de sesión con correo y contraseña (Supabase Auth).
- Rutas administrativas protegidas por guard.
- Alta y eliminación de productos desde el panel admin.
- Compresión de imágenes a un máximo objetivo de 200 KB antes de subir a Storage.
- Skeleton loaders animados mientras se obtienen datos del backend.
- Componentes UI reutilizables (`UiButtonComponent`, `UiInputComponent`) con múltiples variantes y estados.
- Formulario reactivo con validación inline y feedback visual de errores.
- Políticas RLS y Storage en `supabase/migrations/202609230001_security_policies.sql`.

## Preparación

1. Instala Node.js compatible con Angular CLI y ejecuta `npm install`.
2. Crea un proyecto Supabase. Crea la tabla `productos` con `id`, `nombre`, `categoria`, `precio`, `estado` e `imagenUrl`. Crea un bucket público llamado `productos`.
3. Crea un usuario en Supabase Auth. Asigna `app_metadata.is_admin = true` a la cuenta autorizada mediante Admin API o función Edge con `service_role`; nunca uses `user_metadata` para autorización. No habilites registro público.
4. Copia `.env.example` a `.env` como referencia. Angular sirve credenciales al navegador: usa solo URL del proyecto y publishable/anon key; nunca uses `sb_secret` o `service_role` en el cliente.
5. Actualiza `src/environments/environment.ts` con la URL, publishable key y número de WhatsApp internacional sin `+` ni espacios. Para Ecuador, empieza con `593`.
6. Revisa y ejecuta la migración SQL en el editor de Supabase. Ajusta los nombres si la tabla o bucket de tu proyecto son distintos.

La migración permite lectura pública únicamente para productos activos. Solo usuarios con `app_metadata.is_admin = true` pueden gestionar productos y archivos. La clave `service_role` solo se usa desde entorno seguro de administración, nunca en el frontend.

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

## Estado operativo y pendientes externos

La compilación local está lista. Antes de operar, configura URL y publishable key reales de Supabase, número de WhatsApp, tabla y bucket, usuario administrador, y aplica las políticas RLS. Ejecuta el checklist móvil y de flujo con el servicio real.
