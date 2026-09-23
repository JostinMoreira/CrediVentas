import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProductService } from '../../../../core/services/product';
import { UploadService } from '../../../../core/services/upload';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss'
})
export class ProductFormComponent {
  productForm: FormGroup;
  selectedFile: File | null = null;
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
      estado: ['Activo', [Validators.required]]
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Selecciona un archivo de imagen válido.');
        input.value = '';
        return;
      }
      this.selectedFile = file;
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.productForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  async onSubmit(): Promise<void> {
    if (this.productForm.valid && this.selectedFile) {
      this.isSubmitting = true;
      try {
        // 1. Subir la imagen
        const imagenUrl = await this.uploadService.uploadProductImage(this.selectedFile);

        if (!imagenUrl) {
          alert('Error al subir la imagen');
          this.isSubmitting = false;
          return;
        }

        // 2. Guardar en Supabase
        const productData = {
          ...this.productForm.value,
          imagenUrl: imagenUrl
        };

        const result = await this.productService.create({
          ...productData,
          precio: Number(productData['precio'])
        });
        if (result) {
          alert('Producto guardado correctamente');
          this.router.navigate(['/admin']);
        } else {
          alert('Error al guardar el producto');
        }
      } catch (error) {
        console.error(error);
        alert('Ocurrió un error inesperado');
      } finally {
        this.isSubmitting = false;
      }
    } else {
      this.productForm.markAllAsTouched();
      if (!this.selectedFile) {
        alert('Por favor selecciona una imagen para el producto.');
      }
    }
  }
}
