import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { ProductService } from '../../../../core/services/product';
import { UploadService } from '../../../../core/services/upload';
import { ProductFormComponent } from './product-form';
describe('Product editing behavior', () => {
  let fixture: ComponentFixture<ProductFormComponent>;
  const create = vi.fn(), update = vi.fn(), getById = vi.fn(), upload = vi.fn(), cleanup = vi.fn();
  beforeEach(async () => {
    vi.clearAllMocks(); create.mockResolvedValue({}); update.mockResolvedValue({}); getById.mockResolvedValue(null);
    upload.mockResolvedValue(['https://example.com/new.webp']); cleanup.mockResolvedValue(0);
    TestBed.configureTestingModule({ imports: [ProductFormComponent], providers: [
      provideRouter([]),
      { provide: ProductService, useValue: { create, update, getById, getPage: vi.fn().mockResolvedValue({ products: [], total: 0 }), editorialAvailable: signal(true) } },
      { provide: UploadService, useValue: { uploadProductImages: upload, removeUnreferencedImages: cleanup, validateFiles: vi.fn() } },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({}) } } },
    ] });
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(ProductFormComponent); await fixture.whenStable();
    fixture.componentInstance.productForm.patchValue({ nombre: 'Artículo', categoria: 'Hogar', precio: 10 });
    fixture.componentInstance.selectedFiles.set([new File(['image'], 'image.webp', { type: 'image/webp' })]);
  });
  it('offers only canonical database states', () => {
    const values = [...fixture.nativeElement.querySelectorAll('#estado option')].map((option: HTMLOptionElement) => option.value);
    expect(values).toEqual(['Activo', 'Oculto']);
  });
  it('rejects invalid specifications before uploading', async () => {
    fixture.componentInstance.productForm.controls.especificacionesTexto.setValue('Marca sin valor');
    await fixture.componentInstance.onSubmit(); await fixture.whenStable();
    expect(upload).not.toHaveBeenCalled(); expect(create).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#especificaciones').getAttribute('aria-invalid')).toBe('true');
  });
  it('compensates uploads after save failure and preserves input', async () => {
    create.mockRejectedValueOnce(new Error('failed'));
    await fixture.componentInstance.onSubmit(); await fixture.whenStable();
    expect(cleanup).toHaveBeenCalledWith(['https://example.com/new.webp']);
    expect(fixture.componentInstance.productForm.controls.nombre.value).toBe('Artículo');
    expect(fixture.nativeElement.querySelector('[role=alert]')).toBeTruthy();
  });
  it('reuses the same ID after an ambiguous save failure', async () => {
    create.mockRejectedValueOnce(new Error('response lost'));
    await fixture.componentInstance.onSubmit(); await fixture.componentInstance.onSubmit();
    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[0][1]).toBe(create.mock.calls[1][1]);
  });
  it('prevents duplicate submissions', async () => {
    let done!: (value: string[]) => void; upload.mockReturnValueOnce(new Promise(resolve => done = resolve));
    const first = fixture.componentInstance.onSubmit(); await fixture.componentInstance.onSubmit();
    expect(upload).toHaveBeenCalledOnce(); done(['https://example.com/new.webp']); await first;
    expect(create).toHaveBeenCalledOnce();
  });
});
