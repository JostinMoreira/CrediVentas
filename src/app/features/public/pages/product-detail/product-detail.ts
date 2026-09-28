import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
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
  product: Product | null = null;
  isLoading = true;

  get whatsappUrl(): string {
    if (!this.product) return 'https://wa.me/';
    const message = `Hola, me interesa ${this.product.nombre}. ¿Me pueden dar más información?`;
    return `https://wa.me/${environment.whatsappPhone}?text=${encodeURIComponent(message)}`;
  }

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    try {
      const products = await this.productsService.getAll();
      this.product = products?.find(item => item.id === id && item.estado === 'Activo') ?? null;
    } finally {
      this.isLoading = false;
    }
  }
}
