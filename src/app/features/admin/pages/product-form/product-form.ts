import { Component, DestroyRef, ElementRef, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../../../core/services/product';
import { ProductInput, ProductState, PRODUCT_LIMITS, productImages, parseSpecifications, normalizeSearch } from '../../../../core/models/product';
import { IMAGE_TYPES, UploadService } from '../../../../core/services/upload';
import { UiButtonComponent } from '../../../../shared/ui/ui-button/ui-button';
import { UiInputComponent } from '../../../../shared/ui/ui-input/ui-input';

@Component({
  selector: 'app-product-form', standalone: true,
  imports: [ReactiveFormsModule, RouterLink, UiButtonComponent, UiInputComponent],
  templateUrl: './product-form.html', styleUrl: './product-form.scss',
})
export class ProductFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly productService = inject(ProductService);
  private readonly uploadService = inject(UploadService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  readonly limits = PRODUCT_LIMITS;
  readonly imageTypes = IMAGE_TYPES.join(',');
  readonly commonSpecifications = [
    { key: 'marca', label: 'Marca', placeholder: 'Ej.: Samsung' },
    { key: 'modelo', label: 'Modelo', placeholder: 'Ej.: ABC-123' },
    { key: 'color', label: 'Color', placeholder: 'Ej.: Blanco' },
    { key: 'garantia', label: 'Garantía', placeholder: 'Ej.: 12 meses' },
  ] as const;
  readonly productForm = this.fb.group({
    nombre: this.fb.nonNullable.control('', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(PRODUCT_LIMITS.name)]),
    categoria: this.fb.nonNullable.control('', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(PRODUCT_LIMITS.category)]),
    precio: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01), Validators.max(999999999.99)]),
    estado: this.fb.nonNullable.control<ProductState>('Activo', [Validators.required]),
    descripcion: this.fb.nonNullable.control('', [Validators.maxLength(PRODUCT_LIMITS.description)]),
    marca: this.fb.nonNullable.control('', [Validators.maxLength(500)]),
    modelo: this.fb.nonNullable.control('', [Validators.maxLength(500)]),
    color: this.fb.nonNullable.control('', [Validators.maxLength(500)]),
    garantia: this.fb.nonNullable.control('', [Validators.maxLength(500)]),
    especificacionesTexto: this.fb.nonNullable.control(''),
    destacado: this.fb.nonNullable.control(false),
  });
  readonly selectedFiles = signal<File[]>([]);
  readonly existingImages = signal<string[]>([]);
  readonly isSubmitting = signal(false);
  readonly isEditMode = signal(false);
  readonly isLoadingProduct = signal(false);
  readonly loadError = signal('');
  readonly error = signal('');
  readonly specificationError = signal('');
  readonly status = signal('');
  private originalImages: string[] = [];
  productId = crypto.randomUUID() as string;
  private attemptedSave = false;

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) { this.productId = id; this.isEditMode.set(true); await this.loadProduct(); }
    else {
      try { await this.productService.getPage({ pageSize: 1, publicOnly: false }); }
      catch { /* Saving remains available; the service will report any access error. */ }
    }
  }
  async loadProduct(): Promise<void> {
    this.isLoadingProduct.set(true); this.loadError.set('');
    try {
      const product = await this.productService.getById(this.productId);
      if (this.destroyRef.destroyed) return;
      if (!product) { this.loadError.set('No encontramos el producto que quieres editar.'); return; }
      const entries = Object.entries(product.especificaciones ?? {});
      const commonNames = new Set(this.commonSpecifications.map(item => normalizeSearch(item.label)));
      const commonValue = (name: string): string => entries.find(([key]) => normalizeSearch(key) === normalizeSearch(name))?.[1] ?? '';
      this.productForm.patchValue({
        nombre: product.nombre, categoria: product.categoria, precio: product.precio, estado: product.estado,
        descripcion: product.descripcion ?? '', destacado: product.destacado ?? false,
        marca: commonValue('Marca'), modelo: commonValue('Modelo'), color: commonValue('Color'),
        garantia: commonValue('Garantía'),
        especificacionesTexto: entries.filter(([name]) => !commonNames.has(normalizeSearch(name))).map(([name, value]) => name + ': ' + value).join('\n'),
      });
      this.originalImages = productImages(product);
      this.existingImages.set([...this.originalImages]);
    } catch { this.loadError.set('No se pudo cargar el producto. Revisa tu conexión e inténtalo de nuevo.'); }
    finally { this.isLoadingProduct.set(false); }
  }
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    try {
      this.uploadService.validateFiles(files);
      if (files.length + this.existingImages().length > PRODUCT_LIMITS.images) throw new Error('Conserva como máximo 10 imágenes en total.');
      this.selectedFiles.set(files); this.error.set('');
    } catch (error) {
      input.value = ''; this.selectedFiles.set([]);
      this.error.set(error instanceof Error ? error.message : 'No se pudieron seleccionar las imágenes.');
    }
  }
  removeExistingImage(index: number): void { this.existingImages.update(images => images.filter((_, i) => i !== index)); }
  isFieldInvalid(name: keyof typeof this.productForm.controls): boolean {
    const field = this.productForm.controls[name];
    return field.invalid && (field.touched || field.dirty);
  }
  private focusInvalid(): void {
    this.element.nativeElement.querySelector<HTMLElement>('.ng-invalid input, input.ng-invalid, select.ng-invalid, textarea.ng-invalid')?.focus();
  }
  async onSubmit(): Promise<void> {
    if (this.isSubmitting() || this.loadError()) return;
    this.error.set(''); this.specificationError.set(''); this.status.set('');
    this.productForm.markAllAsTouched();
    if (this.productForm.invalid) { this.focusInvalid(); return; }
    const values = this.productForm.getRawValue();
    let specifications: Record<string, string>;
    try {
      specifications = parseSpecifications(values.especificacionesTexto);
      for (const item of this.commonSpecifications) {
        const value = values[item.key].trim();
        if (!value) continue;
        if (Object.keys(specifications).some(name => normalizeSearch(name) === normalizeSearch(item.label))) {
          throw new Error(item.label + ' ya tiene un campo propio. Quita esa línea de Otras especificaciones.');
        }
        specifications[item.label] = value;
      }
    }
    catch (error) {
      this.specificationError.set(error instanceof Error ? error.message : 'Revisa las especificaciones.');
      this.element.nativeElement.querySelector<HTMLElement>('#especificaciones')?.focus(); return;
    }
    if (!this.existingImages().length && !this.selectedFiles().length) {
      this.error.set('Selecciona al menos una imagen.');
      this.element.nativeElement.querySelector<HTMLElement>('#imagen')?.focus(); return;
    }
    this.isSubmitting.set(true);
    const uploaded: string[] = [];
    let saved = false;
    try {
      // If the previous response was lost, include its images when cleaning up a successful retry.
      if (this.attemptedSave) {
        const previous = await this.productService.getById(this.productId);
        if (previous) this.originalImages = [...new Set([...this.originalImages, ...productImages(previous)])];
      }
      this.attemptedSave = true;
      this.status.set(this.selectedFiles().length ? 'Preparando y subiendo imágenes…' : 'Guardando producto…');
      uploaded.push(...await this.uploadService.uploadProductImages(this.selectedFiles()));
      const images = [...this.existingImages(), ...uploaded];
      const input: ProductInput = {
        nombre: values.nombre, categoria: values.categoria, precio: Number(values.precio), estado: values.estado,
        descripcion: values.descripcion, especificaciones: specifications, imagenUrl: images[0], imagenes: images,
        ...(this.productService.editorialAvailable() ? { destacado: values.destacado } : {}),
      };
      this.status.set('Guardando producto…');
      if (this.isEditMode()) await this.productService.update(this.productId, input);
      else await this.productService.create(input, this.productId);
      saved = true;
      await this.uploadService.removeUnreferencedImages(this.originalImages.filter(url => !images.includes(url)));
      this.status.set('Producto guardado.');
      await this.router.navigate(['/admin']);
    } catch {
      if (!saved) await this.uploadService.removeUnreferencedImages(uploaded);
      this.error.set(saved ? 'El producto se guardó. Usa Volver al panel para continuar.' : 'No se pudo guardar el producto. Tus datos se conservan; revisa tu conexión y vuelve a intentarlo.');
      this.status.set('');
    } finally { this.isSubmitting.set(false); }
  }
}
