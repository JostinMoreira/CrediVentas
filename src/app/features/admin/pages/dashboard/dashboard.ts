import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product, ProductService } from '../../../../core/services/product';
import { SlicePipe } from '@angular/common';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, SlicePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  products: Product[] = [];
  isLoading = true;

  private productService = inject(ProductService);
  private authService = inject(AuthService);

  async ngOnInit(): Promise<void> {
    await this.loadProducts();
  }

  async loadProducts(): Promise<void> {
    this.isLoading = true;
    try {
      const data = await this.productService.getAll();
      this.products = data;
    } catch {
      alert('No se pudo cargar el inventario. Revisa tu conexión e inténtalo otra vez.');
    } finally {
      this.isLoading = false;
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
