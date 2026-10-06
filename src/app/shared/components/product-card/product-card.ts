import { Component, Input, OnChanges, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../../../core/models/product';
import { productWhatsAppUrl } from '../../../core/models/whatsapp';
@Component({
  selector: 'app-product-card', standalone: true, imports: [CurrencyPipe, RouterLink],
  styleUrl: './product-card.scss', templateUrl: './product-card.html',
})
export class ProductCard implements OnChanges {
  @Input({ required: true }) product!: Product;
  @Input() headingLevel: 2 | 3 = 3;
  @Input() priority = false;
  readonly imageFailed = signal(false);
  ngOnChanges(): void { this.imageFailed.set(false); }
  onImageError(): void { this.imageFailed.set(true); }
  whatsappUrl(): string { return productWhatsAppUrl(this.product); }
}
