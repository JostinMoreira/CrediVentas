import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { registerLocaleData } from '@angular/common';
import es from '@angular/common/locales/es-EC';
import { ProductService } from '../../../../core/services/product';
import { ProductDetailComponent } from './product-detail';
registerLocaleData(es);
const product = { id: '11111111-1111-4111-8111-111111111111', nombre: 'Refrigeradora', categoria: 'Hogar', precio: 10, estado: 'Activo', imagenUrl: 'https://example.com/a.webp', imagenes: ['https://example.com/a.webp', 'https://example.com/b.webp'] };
describe('Product detail behavior', () => {
  let fixture: ComponentFixture<ProductDetailComponent>;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  const getById = vi.fn();
  beforeEach(async () => {
    getById.mockReset().mockResolvedValue(product); params = new BehaviorSubject(convertToParamMap({ id: product.id }));
    TestBed.configureTestingModule({ imports: [ProductDetailComponent], providers: [
      provideRouter([]), { provide: ProductService, useValue: { getById } },
      { provide: ActivatedRoute, useValue: { paramMap: params, snapshot: {} } },
    ] });
    fixture = TestBed.createComponent(ProductDetailComponent); await fixture.whenStable();
  });
  it('loads only the requested active product and reacts to ID changes', async () => {
    expect(getById).toHaveBeenCalledWith(product.id, true);
    params.next(convertToParamMap({ id: '22222222-2222-4222-8222-222222222222' })); await fixture.whenStable();
    expect(getById).toHaveBeenLastCalledWith('22222222-2222-4222-8222-222222222222', true);
  });
  it('distinguishes network failure from unavailable product', async () => {
    getById.mockRejectedValueOnce(new Error('network')); await fixture.componentInstance.loadProduct(); await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Reintentar');
    getById.mockResolvedValueOnce(null); await fixture.componentInstance.loadProduct(); await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Producto no disponible');
  });
  it('sets actual product metadata and removes structured data on teardown', () => {
    expect(document.title).toContain(product.nombre);
    const schema = document.querySelector('script[type="application/ld+json"]');
    expect(JSON.parse(schema!.textContent!).offers.price).toBe(10);
    fixture.destroy(); expect(document.querySelector('script[type="application/ld+json"]')).toBeNull();
  });
  it('respects reduced motion and announces the selected image', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const track = fixture.nativeElement.querySelector('.main-gallery') as HTMLElement;
    const scrollTo = vi.fn(); track.scrollTo = scrollTo;
    fixture.componentInstance.selectImage(1); await fixture.whenStable();
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'auto' }));
    expect(fixture.nativeElement.textContent).toContain('Imagen 2 de 2');
    vi.unstubAllGlobals();
  });
  it('shows an image fallback', async () => {
    fixture.componentInstance.imageError(product.imagenUrl); await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Imagen no disponible');
  });
});
