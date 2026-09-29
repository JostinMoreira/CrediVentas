import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar';
import { ProductCard } from '../../../../shared/components/product-card/product-card';
import { Product, ProductService } from '../../../../core/services/product';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [NavbarComponent, ProductCard],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class HomeComponent implements OnInit {
  private readonly productService = inject(ProductService);

  readonly products = signal<Product[]>([]);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly selectedCategory = signal('Todos');

  readonly categories = computed(() => [
    'Todos',
    ...new Set(this.products().map(product => product.categoria).filter(Boolean))
  ]);

  readonly featuredProducts = computed(() => this.products().slice(0, 4));

  readonly filteredProducts = computed(() => {
    const search = this.searchTerm().trim().toLocaleLowerCase('es');
    const category = this.selectedCategory();

    return this.products().filter(product => {
      const matchesCategory = category === 'Todos' || product.categoria === category;
      const matchesSearch = !search ||
        product.nombre.toLocaleLowerCase('es').includes(search) ||
        product.categoria.toLocaleLowerCase('es').includes(search);
      return matchesCategory && matchesSearch;
    });
  });

  async ngOnInit(): Promise<void> {
    try {
      const products = await this.productService.getAll();
      this.products.set(products.filter(product => product.estado === 'Activo'));
    } catch (error) {
      console.error(error);
      this.error.set('No se pudieron cargar los productos. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      this.isLoading.set(false);
    }
  }

  setSearchTerm(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
  }
}
