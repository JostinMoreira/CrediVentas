import { Component, OnInit, OnDestroy, inject, LOCALE_ID, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { Product, ProductService } from '../../../../core/services/product';
import { SlicePipe, CurrencyPipe } from '@angular/common';
import { AuthService } from '../../../../core/services/auth';
import { UiButtonComponent } from '../../../../shared/ui/ui-button/ui-button';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
registerLocaleData(localeEs, 'es-EC');

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, SlicePipe, CurrencyPipe, UiButtonComponent],
  providers: [{ provide: LOCALE_ID, useValue: 'es-EC' }],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit, OnDestroy {
  products: Product[] = [];
  isLoading = true;

  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  private navigationSubscription: Subscription | null = null;

  async ngOnInit(): Promise<void> {
    await this.loadProducts();

    this.navigationSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd && event.url === '/admin')
    ).subscribe(() => {
      this.loadProducts();
    });
  }

  ngOnDestroy(): void {
    this.navigationSubscription?.unsubscribe();
  }

  async loadProducts(): Promise<void> {
    this.isLoading = true;
    try {
      const data = await this.productService.getAll();
      this.products = data;
    } catch (error) {
      console.error('loadProducts ERROR:', error);
      alert('No se pudo cargar el inventario. Revisa tu conexión e inténtalo otra vez.');
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async deleteProduct(id: string | undefined): Promise<void> {
    if (!id) return;
    const confirmed = confirm('¿Estás seguro de eliminar este producto?');
    if (confirmed) {
      try {
        const deleted = await this.productService.delete(id);
        if (!deleted) {
          alert('El producto ya no existe o no tienes permiso para borrarlo.');
          return;
        }
        this.products = this.products.filter(p => p.id !== id);
      } catch {
        alert('No se pudo eliminar el producto. Revisa tu sesión e inténtalo otra vez.');
      }
    }
  }

  async logout(): Promise<void> {
    await this.authService.signOut();
  }
}
