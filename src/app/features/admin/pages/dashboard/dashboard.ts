import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { Product, ProductService } from '../../../../core/services/product';
import { productImages } from '../../../../core/models/product';
import { AuthService } from '../../../../core/services/auth';
import { UploadService } from '../../../../core/services/upload';
import { UiButtonComponent } from '../../../../shared/ui/ui-button/ui-button';

@Component({
  selector: 'app-dashboard', standalone: true,
  imports: [RouterLink, CurrencyPipe, UiButtonComponent],
  templateUrl: './dashboard.html', styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  readonly products = signal<Product[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal('');
  readonly notice = signal('');
  readonly deletingId = signal<string | null>(null);
  readonly page = signal(0);
  readonly total = signal(0);
  readonly pageSize = 20;
  readonly uploads = inject(UploadService);
  private readonly productService = inject(ProductService);
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private request = 0;

  ngOnInit(): void { void this.loadProducts(); }
  async loadProducts(): Promise<void> {
    const request = ++this.request;
    this.isLoading.set(true); this.error.set('');
    try {
      const result = await this.productService.getPage({ page: this.page(), pageSize: this.pageSize, publicOnly: false });
      if (this.destroyRef.destroyed || request !== this.request) return;
      if (!result.products.length && this.page() > 0) { this.page.update(value => value - 1); return await this.loadProducts(); }
      this.products.set(result.products); this.total.set(result.total);
    } catch { if (!this.destroyRef.destroyed) this.error.set('No se pudo cargar el inventario. Revisa tu conexión e inténtalo de nuevo.'); }
    finally { if (!this.destroyRef.destroyed && request === this.request) this.isLoading.set(false); }
  }
  changePage(delta: number): void {
    if (this.isLoading()) return;
    this.page.update(value => Math.max(0, value + delta)); void this.loadProducts();
  }
  async deleteProduct(product: Product): Promise<void> {
    if (this.deletingId() || !confirm('¿Eliminar «' + product.nombre + '» del catálogo?')) return;
    this.deletingId.set(product.id); this.error.set(''); this.notice.set('');
    try {
      if (!await this.productService.delete(product.id)) throw new Error('No se pudo confirmar el borrado.');
      this.products.update(products => products.filter(item => item.id !== product.id));
      this.total.update(total => Math.max(0, total - 1));
      this.notice.set('Producto eliminado.');
      await this.uploads.removeUnreferencedImages(productImages(product));
      await this.loadProducts();
    } catch {
      // A lost response may follow a committed deletion. Reference checks retain images
      // if the product still exists; failed checks queue cleanup for a later retry.
      await this.uploads.removeUnreferencedImages(productImages(product));
      this.error.set('No se pudo confirmar la eliminación. Actualiza el inventario antes de reintentar.');
    }
    finally { this.deletingId.set(null); }
  }
  async logout(): Promise<void> {
    try { await this.auth.signOut(); }
    catch { this.error.set('No se pudo cerrar la sesión. Revisa tu conexión e inténtalo de nuevo.'); }
  }
}
