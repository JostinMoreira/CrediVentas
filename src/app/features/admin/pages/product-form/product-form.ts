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
        if (!imagenUrl) throw new Error('Storage no devolvió la URL de la imagen subida.');

        // 2. Guardar en Supabase
        const productData = {
          ...this.productForm.value,
          imagenUrl: imagenUrl
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
      if (!this.selectedFile) {
        alert('Por favor selecciona una imagen para el producto.');
      }
    }
  }
}
