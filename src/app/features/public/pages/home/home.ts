import { Component, DestroyRef, Injector, OnInit, afterNextRender, inject, signal } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar';
import { Footer } from '../../../../shared/components/footer/footer';
import { ProductCard } from '../../../../shared/components/product-card/product-card';
import { Product, ProductService } from '../../../../core/services/product';

@Component({
  selector: 'app-home', standalone: true, imports: [NavbarComponent, Footer, ProductCard],
  templateUrl: './home.html', styleUrls: ['./home.scss'],
})
export class HomeComponent implements OnInit {
  private readonly service = inject(ProductService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly viewport = inject(ViewportScroller);
  private readonly injector = inject(Injector);
  private readonly meta = inject(Meta);
  readonly products = signal<Product[]>([]);
  readonly featuredProducts = signal<Product[]>([]);
  readonly featuredLoading = signal(true);
  readonly hasEditorialSelection = signal(false);
  readonly categories = signal<string[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal('');
  readonly categoryError = signal('');
  readonly searchTerm = signal('');
  readonly selectedCategory = signal('');
  readonly page = signal(0);
  readonly total = signal(0);
  readonly pageSize = 24;
  readonly skeletonSlots = [0, 1, 2, 3];
  private request = 0;
  private debounce: ReturnType<typeof setTimeout> | undefined;
  constructor() { this.destroyRef.onDestroy(() => clearTimeout(this.debounce)); }
  async ngOnInit(): Promise<void> {
    this.meta.updateTag({ name: 'description', content: 'Explora electrodomésticos y productos para tu hogar y el campo. Consulta disponibilidad y compra por WhatsApp en CrediVentas.' });
    this.meta.updateTag({ name: 'robots', content: 'index,follow' });
    void this.loadCategories();
    const [, featuredResult] = await Promise.allSettled([
      this.loadProducts(),
      this.service.getPage({ featuredOnly: true, pageSize: 4 }),
    ]);
    if (this.destroyRef.destroyed) return;
    const initialProducts = this.products().slice(0, 4);
    if (featuredResult.status === 'fulfilled') {
      this.hasEditorialSelection.set(featuredResult.value.products.length > 0);
      this.featuredProducts.set(featuredResult.value.products.length ? featuredResult.value.products : initialProducts);
    } else {
      this.featuredProducts.set(initialProducts);
    }
    this.featuredLoading.set(false);
    if (!this.destroyRef.destroyed && this.route.snapshot.fragment === 'catalogo') {
      afterNextRender(() => this.viewport.scrollToAnchor('catalogo'), { injector: this.injector });
    }
  }
  async loadCategories(): Promise<void> {
    this.categoryError.set('');
    try { const categories = await this.service.getCategories(); if (!this.destroyRef.destroyed) this.categories.set(categories); }
    catch { if (!this.destroyRef.destroyed) this.categoryError.set('No se pudieron cargar las categorías.'); }
  }
  async loadProducts(): Promise<void> {
    const request = ++this.request;
    this.isLoading.set(true); this.error.set('');
    try {
      const result = await this.service.getPage({ page: this.page(), pageSize: this.pageSize, search: this.searchTerm(), category: this.selectedCategory() });
      if (this.destroyRef.destroyed || request !== this.request) return;
      this.products.set(result.products); this.total.set(result.total);
    } catch {
      if (!this.destroyRef.destroyed && request === this.request) this.error.set('No se pudieron cargar los productos. Revisa tu conexión e inténtalo de nuevo.');
    } finally { if (!this.destroyRef.destroyed && request === this.request) this.isLoading.set(false); }
  }
  setSearchTerm(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
    this.page.set(0); clearTimeout(this.debounce);
    ++this.request; // Ignore older responses while the next search is being debounced.
    this.isLoading.set(true);
    this.debounce = setTimeout(() => void this.loadProducts(), 300);
  }
  selectCategory(category: string): void {
    clearTimeout(this.debounce); this.selectedCategory.set(category); this.page.set(0); void this.loadProducts();
  }
  clearFilters(): void {
    clearTimeout(this.debounce); this.searchTerm.set(''); this.selectedCategory.set(''); this.page.set(0); void this.loadProducts();
  }
  changePage(delta: number): void {
    if (this.isLoading()) return;
    this.page.update(page => Math.max(0, page + delta));
    void this.loadProducts(); this.viewport.scrollToAnchor('catalogo');
  }
}
