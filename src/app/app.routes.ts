import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    // ==========================================
    // RUTAS PÚBLICAS (Lo que ven los clientes)
    // ==========================================
    {
        path: '',
        title: 'Crediventas Caminante - Catálogo',
        loadComponent: () => import('./features/public/pages/home/home').then(m => m.HomeComponent)
    },
    {
        path: 'producto/:id',
        title: 'Detalle del Producto',
        loadComponent: () => import('./features/public/pages/product-detail/product-detail').then(m => m.ProductDetailComponent)
    },

    // ==========================================
    // RUTAS PRIVADAS (Lo que ve el Administrador)
    // ==========================================
    {
        path: 'login',
        title: 'Acceso Administrativo',
        loadComponent: () => import('./features/admin/pages/login/login').then(m => m.LoginComponent),
    },
    {
        path: 'admin',
        title: 'Panel de Control',
        canActivate: [authGuard],
        loadComponent: () => import('./features/admin/pages/dashboard/dashboard').then(m => m.Dashboard)
    },
    {
        path: 'admin/nuevo-producto',
        title: 'Agregar Producto',
        canActivate: [authGuard],
        loadComponent: () => import('./features/admin/pages/product-form/product-form').then(m => m.ProductFormComponent)
    },
    {
        path: 'admin/editar-producto/:id',
        title: 'Editar Producto',
        canActivate: [authGuard],
        loadComponent: () => import('./features/admin/pages/product-form/product-form').then(m => m.ProductFormComponent)
    },

    // ==========================================
    // RUTA POR DEFECTO
    // ==========================================
    {
        path: '**',
        redirectTo: ''
    }
];
