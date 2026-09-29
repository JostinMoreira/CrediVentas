import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Product, ProductService } from '../../../../core/services/product';
import { environment } from '../../../../../environments/environment';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar';
import { Footer } from '../../../../shared/components/footer/footer';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CurrencyPipe, RouterLink, NavbarComponent, Footer],
  styleUrl: './product-detail.scss',
  templateUrl: './product-detail.html',
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productsService = inject(ProductService);
  product = signal<Product | null>(null);
  isLoading = signal(true);
  activeImageIndex = signal(0);
  gallery = computed(() => {
    const product = this.product();
    return [...new Set([...(product?.imagenes ?? []), product?.imagenUrl].filter((url): url is string => !!url))];
  });
  activeImage = computed(() => this.gallery()[this.activeImageIndex()] ?? null);
  specifications = computed(() => Object.entries(this.product()?.especificaciones ?? {}));

  get whatsappUrl(): string {
    const product = this.product();
    if (!product) return 'https://wa.me/';
    const message = `Hola, me interesa ${product.nombre} (${new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(product.precio)}). ¿Me pueden dar más información?`;
    return `https://wa.me/${environment.whatsappPhone}?text=${encodeURIComponent(message)}`;
  }

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    try {
      const products = await this.productsService.getAll();
      this.product.set(products?.find(item => item.id === id && item.estado === 'Activo') ?? null);
    } catch {
      this.product.set(null);
    } finally {
      this.isLoading.set(false);
    }
  }
}
