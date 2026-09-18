# 🛒 Crediventas Caminante - Catálogo Web E-commerce

Este proyecto es una plataforma web de comercio electrónico tipo "Catálogo Digital" desarrollada a medida para el negocio unipersonal **Crediventas Caminante**. Está diseñado específicamente para usuarios con alfabetización digital básica, eliminando la fricción de los carritos de compras tradicionales y redirigiendo el cierre de ventas directamente a WhatsApp.

## 🎯 Objetivo del Proyecto (Prácticas Profesionales)
Desarrollar una solución tecnológica bajo el modelo **WaaS (Website as a Service)** que permita a la empresa digitalizar su inventario de línea blanca, electrodomésticos y maquinaria agropecuaria, con un panel de administración propio y autogestionable.

## 🛠️ Stack Tecnológico
* **Frontend:** Angular 17+ (Arquitectura moderna con *Standalone Components*).
* **Estilos:** SCSS (Sass) con diseño responsivo basado en Flexbox/Grid.
* **Base de Datos:** Firebase Cloud Firestore (NoSQL).
* **Autenticación:** Firebase Auth (Acceso seguro para el administrador).
* **Almacenamiento de Imágenes:** Cloudinary API (Subidas directas *unsigned* optimizadas para web).
* **Control de Versiones:** Git & GitHub (Flujo de trabajo con *Feature Branches* y *Conventional Commits*).

## 📂 Arquitectura del Proyecto
El código sigue el patrón de diseño por características (*Feature Modules*):
* `core/`: Servicios globales (Base de datos, Autenticación, Subida de imágenes).
* `shared/`: Componentes reutilizables (Navbar, Tarjetas de Producto, Footer).
* `features/public/`: Vistas del cliente (Catálogo principal, Detalles de producto).
* `features/admin/`: Panel de control privado (Dashboard, Formulario de inventario, Login).

---

## 🚀 Roadmap y Fases del Proyecto

### Fase 1: Arquitectura y Configuración Inicial
- [x] Inicialización del proyecto en Angular 17+ con enrutamiento y SCSS.
- [x] Estructuración modular (Core, Shared, Features).
- [x] Configuración de Cloudinary (Upload Preset `Unsigned`).
- [x] Inicialización de Git/GitHub con control de versiones profesional y resolución de historiales.

### Fase 2: Desarrollo de Interfaces (Frontend)
- [x] Barra de navegación (`Navbar`) y tarjeta de producto (`ProductCard`).
- [x] Catálogo público (`Home`) con cuadrícula CSS Grid y `@for`.
- [x] Panel de Control (`Dashboard`) con tabla iterativa de inventario.
- [x] Formulario reactivo (`ProductForm`) para crear/editar productos.
- [x] Conexión de enrutamiento final y validación de flujo entre vistas.

### Fase 3: Integración de Backend y Lógica (📍 En Progreso)
- [x] Habilitar `provideHttpClient` en la configuración global de Angular.
- [x] Programar `upload.service.ts` para enviar imágenes a Cloudinary mediante peticiones HTTP.
- [ ] Conectar Angular con Firebase (`@angular/fire`).
- [ ] Programar `product.service.ts` para realizar operaciones CRUD (Crear, Leer, Actualizar, Eliminar) en Firestore.
- [ ] Integrar generación dinámica de enlaces hacia WhatsApp para pedidos.

### Fase 4: Seguridad y Autenticación
- [ ] Implementar inicio de sesión en `LoginComponent` con Firebase Auth.
- [ ] Crear un `AuthGuard` para proteger las rutas privadas `/admin`.
- [ ] Configurar reglas de seguridad en Firebase Firestore (Lectura pública, Escritura solo admin).

### Fase 5: Pruebas y Optimización (QA)
- [ ] Auditoría de diseño responsivo en dispositivos móviles.
- [ ] Pruebas de compresión de imágenes y tiempos de carga.
- [ ] Simulación de flujo de usuario completo (Ver catálogo -> Seleccionar -> Enviar WhatsApp).

### Fase 6: Despliegue y Entrega a Producción
- [ ] Compilación del proyecto para producción (`ng build`).
- [ ] Despliegue en Firebase Hosting o Vercel.
- [ ] Capacitación y entrega final al administrador (Don Edison).

---

## 💻 Cómo ejecutar el proyecto localmente

1. Clona este repositorio o descarga el código fuente.
2. Abre la terminal en la carpeta del proyecto.
3. Instala las dependencias necesarias:
   ```bash
   npm install