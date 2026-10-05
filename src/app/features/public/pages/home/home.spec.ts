import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import es from '@angular/common/locales/es-EC';
import { ProductService } from '../../../../core/services/product';
import { HomeComponent } from './home';
registerLocaleData(es);
describe('Catalog behavior', () => {
  let fixture: ComponentFixture<HomeComponent>;
  const getPage = vi.fn(), getCategories = vi.fn();
  beforeEach(async () => {
    vi.clearAllMocks(); getPage.mockResolvedValue({ products: [], total: 0 }); getCategories.mockResolvedValue(['Hogar']);
    TestBed.configureTestingModule({ imports: [HomeComponent], providers: [
      provideRouter([]), { provide: ProductService, useValue: { getPage, getCategories } },
    ] });
    fixture = TestBed.createComponent(HomeComponent); await fixture.whenStable();
  });
  it('keeps the catalog anchor present even when empty', () => expect(fixture.nativeElement.querySelector('#catalogo')).toBeTruthy());
  it('renders recoverable network failures', async () => {
    getPage.mockRejectedValueOnce(new Error('offline'));
    await fixture.componentInstance.loadProducts(); await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role=alert]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Reintentar');
  });
  it('clears filters and requests the first page', async () => {
    const component = fixture.componentInstance;
    component.searchTerm.set('cafe'); component.selectedCategory.set('Hogar'); component.page.set(3);
    component.clearFilters(); await fixture.whenStable();
    expect(getPage).toHaveBeenLastCalledWith({ page: 0, pageSize: 24, search: '', category: '' });
  });
  it('ignores an older response arriving after the current search', async () => {
    let resolveOld!: (value: object) => void;
    getPage.mockReturnValueOnce(new Promise(resolve => resolveOld = resolve));
    const old = fixture.componentInstance.loadProducts();
    getPage.mockResolvedValueOnce({ products: [], total: 2 });
    await fixture.componentInstance.loadProducts();
    resolveOld({ products: [], total: 99 }); await old;
    expect(fixture.componentInstance.total()).toBe(2);
  });
});
