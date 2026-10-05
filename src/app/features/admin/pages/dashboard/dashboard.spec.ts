import { ComponentFixture, TestBed } from '@angular/core/testing';
import { registerLocaleData } from '@angular/common';
import es from '@angular/common/locales/es-EC';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Dashboard } from './dashboard';
import { ProductService } from '../../../../core/services/product';
import { AuthService } from '../../../../core/services/auth';
import { UploadService } from '../../../../core/services/upload';
registerLocaleData(es);
const product = { id: '11111111-1111-4111-8111-111111111111', nombre: 'Refrigeradora', categoria: 'Hogar', precio: 10, estado: 'Activo' as const, imagenUrl: 'https://example.com/a.webp' };
describe('Inventory behavior', () => {
  let fixture: ComponentFixture<Dashboard>;
  const getPage = vi.fn(), remove = vi.fn(), cleanup = vi.fn();
  beforeEach(async () => {
    vi.clearAllMocks();
    getPage.mockResolvedValue({ products: [product], total: 1 }); remove.mockResolvedValue(true); cleanup.mockResolvedValue(0);
    TestBed.configureTestingModule({ imports: [Dashboard], providers: [
      provideRouter([]), { provide: ProductService, useValue: { getPage, delete: remove } },
      { provide: AuthService, useValue: { signOut: vi.fn() } },
      { provide: UploadService, useValue: { pendingCleanup: signal([]), removeUnreferencedImages: cleanup } },
    ] });
    fixture = TestBed.createComponent(Dashboard); await fixture.whenStable();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });
  afterEach(() => vi.restoreAllMocks());
  it('removes a row from the DOM after a confirmed deletion', async () => {
    getPage.mockResolvedValue({ products: [], total: 0 });
    await fixture.componentInstance.deleteProduct(product); await fixture.whenStable();
    expect(fixture.nativeElement.querySelectorAll('tbody .product-name')).toHaveLength(0);
    expect(fixture.nativeElement.textContent).not.toContain('Refrigeradora');
    expect(cleanup).toHaveBeenCalledWith([product.imagenUrl]);
    expect(fixture.nativeElement.textContent).toContain('Producto eliminado');
  });
  it('keeps the row and requests reference-safe cleanup when deletion is unconfirmed', async () => {
    remove.mockRejectedValue(new Error('denied'));
    await fixture.componentInstance.deleteProduct(product); await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Refrigeradora');
    expect(cleanup).toHaveBeenCalledWith([product.imagenUrl]);
    expect(fixture.nativeElement.querySelector('[role=alert]')).toBeTruthy();
  });
  it('blocks a repeated delete while the first request is pending', async () => {
    let done!: (value: boolean) => void; remove.mockReturnValue(new Promise(resolve => done = resolve));
    const first = fixture.componentInstance.deleteProduct(product); await fixture.componentInstance.deleteProduct(product);
    expect(remove).toHaveBeenCalledOnce(); done(false); await first;
  });
});
