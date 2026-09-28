import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiButtonComponent } from '../../../../shared/ui/ui-button/ui-button';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar';
import { ProductCard } from '../../../../shared/components/product-card/product-card';
import { Product, ProductService } from '../../../../core/services/product';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, UiButtonComponent, NavbarComponent, ProductCard],
  templateUrl: './home.html',
  styleUrls: ['./home.scss']
})
export class HomeComponent implements OnInit {
  private productService = inject(ProductService);
  
  products: Product[] = [];
  isLoading = true;
  error: string | null = null;

  async ngOnInit() {
    try {
      this.products = await this.productService.getAll();
    } catch (err) {
      console.error(err);
      this.error = 'No se pudieron cargar los productos. Revisa la conexión con Supabase.';
    } finally {
      this.isLoading = false;
    }
  }
}
