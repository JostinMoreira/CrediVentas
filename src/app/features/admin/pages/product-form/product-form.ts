import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProductService } from '../../../../core/services/product';
import { UploadService } from '../../../../core/services/upload';
import { UiButtonComponent } from '../../../../shared/ui/ui-button/ui-button';
import { UiInputComponent } from '../../../../shared/ui/ui-input/ui-input';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, UiButtonComponent, UiInputComponent],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss'
})
export class ProductFormComponent {
  productForm: FormGroup;
  selectedFiles: File[] = [];
  isSubmitting = false;

  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private uploadService = inject(UploadService);
  private router = inject(Router);

  constructor() {
    this.productForm = this.fb.group({
      nombre: ['', [Validators.required]],
      categoria: ['', [Validators.required]],
      precio: [null as number | null, [Validators.required, Validators.min(0.01)]],
      estado: ['Activo', [Validators.required]],
      descripcion: [''],
      especificacionesTexto: ['']
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    if (files.some(file => !file.type.startsWith('image/'))) {
      alert('Selecciona solo archivos de imagen.');
      input.value = '';
      return;
    }
    this.selectedFiles = files;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.productForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  async onSubmit(): Promise<void> {
    if (this.productForm.valid && this.selectedFiles.length) {
      this.isSubmitting = true;
      try {
        const imagenes = await this.uploadService.uploadProductImages(this.selectedFiles);
        const { especificacionesTexto, ...formValues } = this.productForm.value;
        const especificaciones = String(especificacionesTexto ?? '')
          .split('\n')
          .map(line => line.trim())
          .filter(Boolean)
          .reduce<Record<string, string>>((result, line) => {
            const separator = line.indexOf(':');
            if (separator > 0) result[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
            return result;
          }, {});

        const productData = {
          ...formValues,
          imagenUrl: imagenes[0],
          imagenes,
          especificaciones
        };

        await this.productService.create({
          ...productData,
          precio: Number(productData['precio'])
        });
        alert('Producto guardado correctamente');
        this.router.navigate(['/admin']);
      } catch (error) {
        console.error(error);
        alert('No se pudo guardar el producto. Revisa tu sesión y conexión e inténtalo otra vez.');
      } finally {
        this.isSubmitting = false;
      }
    } else {
      this.productForm.markAllAsTouched();
      if (!this.selectedFiles.length) {
        alert('Por favor selecciona una imagen para el producto.');
      }
    }
  }
}
