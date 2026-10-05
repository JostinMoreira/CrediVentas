import type { Product } from './product';
import { environment } from '../../../environments/environment';
export function productWhatsAppUrl(product: Product): string {
  const price = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(product.precio);
  const message = 'Hola, me interesa ' + product.nombre + ' (' + price + '). ¿Me pueden confirmar disponibilidad y condiciones de compra?';
  return 'https://wa.me/' + environment.whatsappPhone + '?text=' + encodeURIComponent(message);
}
