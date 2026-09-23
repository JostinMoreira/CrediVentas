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
      if (data) {
        this.products = data;
      } else {
        alert('No se pudo cargar el inventario. Revisa tu conexión e inténtalo otra vez.');
      }
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
      const success = await this.productService.delete(id);
      if (success) {
        this.products = this.products.filter(p => p.id !== id);
      } else {
        alert('Error al eliminar el producto');
      }
    }
  }

  async logout(): Promise<void> {
    await this.authService.signOut();
  }
}
