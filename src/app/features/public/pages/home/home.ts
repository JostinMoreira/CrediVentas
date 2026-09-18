import { Component } from '@angular/core';
import { ProductCard } from '../../../../shared/components/product-card/product-card';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ProductCard],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent {
  productosFalsos = [1, 2, 3, 4, 5, 6, 7, 8];
}
