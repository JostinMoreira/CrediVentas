import { Component, Input, LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { CurrencyPipe } from '@angular/common';
import { Product } from '../../../core/services/product';
import { environment } from '../../../../environments/environment';
import { UiButtonComponent } from '../../ui/ui-button/ui-button';

registerLocaleData(localeEs, 'es-EC');

@Component({
  selector: 'app-product-card',
  standalone: true,
  providers: [{ provide: LOCALE_ID, useValue: 'es-EC' }],
  imports: [CurrencyPipe, UiButtonComponent],
  styleUrl: './product-card.scss',
  templateUrl: './product-card.html',
})
export class ProductCard {
  @Input({ required: true }) product!: Product;
  readonly whatsappUrl = (): string => {
    const message = `Hola, me interesa ${this.product.nombre} (${new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(this.product.precio)}). ¿Me pueden dar más información?`;
    return `https://wa.me/${environment.whatsappPhone}?text=${encodeURIComponent(message)}`;
  };
}
