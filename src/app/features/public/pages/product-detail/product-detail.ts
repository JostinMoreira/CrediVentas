import { CurrencyPipe, DOCUMENT } from '@angular/common';
import { Component, DestroyRef, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Product, ProductService } from '../../../../core/services/product';
import { productImages } from '../../../../core/models/product';
import { productWhatsAppUrl } from '../../../../core/models/whatsapp';
import { thumbnailUrl } from '../../../../core/services/upload';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar';
import { Footer } from '../../../../shared/components/footer/footer';

@Component({
  selector: 'app-product-detail', standalone: true,
  imports: [CurrencyPipe, RouterLink, NavbarComponent, Footer],
  styleUrl: './product-detail.scss', templateUrl: './product-detail.html',
  host: { '[class.has-product]': 'product() !== null' },
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(ProductService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  readonly product = signal<Product | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal('');
  readonly activeImageIndex = signal(0);
  readonly failedImages = signal(new Set<string>());
  readonly failedThumbnails = signal(new Set<string>());
  readonly gallery = computed(() => this.product() ? productImages(this.product()!) : []);
  readonly specifications = computed(() => Object.entries(this.product()?.especificaciones ?? {}));
  readonly whatsappUrl = computed(() => this.product() ? productWhatsAppUrl(this.product()!) : '');
  readonly thumbnail = thumbnailUrl;
  @ViewChild('galleryTrack') private galleryTrack?: ElementRef<HTMLElement>;
  @ViewChild('imageDialog') private imageDialog?: ElementRef<HTMLDialogElement>;
  private request = 0;
  private productId = '';
  private structuredData?: HTMLScriptElement;
  private canonical?: HTMLLinkElement;

  constructor() { this.destroyRef.onDestroy(() => this.clearMetadata()); }
  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.productId = params.get('id') ?? ''; void this.loadProduct();
    });
  }
  async loadProduct(): Promise<void> {
    const request = ++this.request;
    this.clearMetadata(); this.isLoading.set(true); this.error.set(''); this.product.set(null); this.activeImageIndex.set(0);
    this.title.setTitle('Producto | CrediVentas');
    this.meta.updateTag({ name: 'robots', content: 'noindex,follow' });
    this.failedImages.set(new Set()); this.failedThumbnails.set(new Set());
    try {
      const product = await this.service.getById(this.productId, true);
      if (this.destroyRef.destroyed || request !== this.request) return;
      this.product.set(product);
      if (product) this.setMetadata(product);
      else this.title.setTitle('Producto no disponible | CrediVentas');
    } catch {
      if (!this.destroyRef.destroyed && request === this.request) this.error.set('No se pudo cargar el producto. Revisa tu conexión e inténtalo de nuevo.');
    } finally { if (!this.destroyRef.destroyed && request === this.request) this.isLoading.set(false); }
  }
  selectImage(index: number): void {
    if (index < 0 || index >= this.gallery().length) return;
    this.activeImageIndex.set(index);
    const track = this.galleryTrack?.nativeElement;
    const reduced = this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track?.scrollTo({ left: index * track.clientWidth, behavior: reduced ? 'auto' : 'smooth' });
  }
  stepImage(delta: number, event: Event): void { event.preventDefault(); this.selectImage(this.activeImageIndex() + delta); }
  onGalleryScroll(event: Event): void {
    const track = event.currentTarget as HTMLElement;
    this.activeImageIndex.set(Math.max(0, Math.min(this.gallery().length - 1, Math.round(track.scrollLeft / Math.max(track.clientWidth, 1)))));
  }
  imageError(image: string): void { this.failedImages.update(images => new Set([...images, image])); }
  thumbnailError(image: string): void { this.failedThumbnails.update(images => new Set([...images, image])); }
  openImage(index: number): void { this.activeImageIndex.set(index); this.imageDialog?.nativeElement.showModal(); }
  closeImage(): void { this.imageDialog?.nativeElement.close(); }
  closeOnBackdrop(event: MouseEvent): void { if (event.target === this.imageDialog?.nativeElement) this.closeImage(); }

  private setMetadata(product: Product): void {
    const title = product.nombre + ' | CrediVentas';
    const description = (product.descripcion || 'Consulta precio y condiciones de compra de ' + product.nombre + ' en CrediVentas.').slice(0, 160);
    const url = this.document.location.origin + '/producto/' + encodeURIComponent(product.id);
    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ name: 'robots', content: 'index,follow' });
    for (const [property, content] of Object.entries({ 'og:title': title, 'og:description': description, 'og:type': 'product', 'og:url': url, 'og:image': product.imagenUrl ?? '' })) this.meta.updateTag({ property, content });
    this.canonical = this.document.createElement('link'); this.canonical.rel = 'canonical'; this.canonical.href = url;
    this.document.head.appendChild(this.canonical);
    this.structuredData = this.document.createElement('script'); this.structuredData.type = 'application/ld+json';
    this.structuredData.textContent = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'Product', name: product.nombre, description,
      image: productImages(product), sku: product.id,
      offers: { '@type': 'Offer', price: product.precio, priceCurrency: 'USD', url },
    });
    this.document.head.appendChild(this.structuredData);
  }
  private clearMetadata(): void {
    this.structuredData?.remove(); this.canonical?.remove();
    for (const property of ['og:title', 'og:description', 'og:type', 'og:url', 'og:image']) this.meta.removeTag('property="' + property + '"');
  }
}
