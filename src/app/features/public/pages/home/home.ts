import { Component, OnInit, inject } from '@angular/core';
import { ProductCard } from '../../../../shared/components/product-card/product-card';
import { Product, ProductService } from '../../../../core/services/product';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../../../shared/components/navbar/navbar';
import { Footer } from '../../../../shared/components/footer/footer';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ProductCard, RouterLink, Navbar, Footer],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent implements OnInit {
  products: Product[] = [];
  isLoading = true;
  loadError = false;

  private productService = inject(ProductService);

  async ngOnInit(): Promise<void> {
    try {
      const data = await this.productService.getAll();
      this.products = data.filter(p => p.estado === 'Activo');
    } catch {
      this.loadError = true;
    } finally {
      this.isLoading = false;
    }
  }
}
