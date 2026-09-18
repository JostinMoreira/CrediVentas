import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss'
})
export class ProductFormComponent {
  productForm: FormGroup;

  constructor(private fb: FormBuilder) {
    // Configuración del formulario reactivo con validaciones requeridas
    this.productForm = this.fb.group({
      nombre: ['', [Validators.required]],
      categoria: ['', [Validators.required]],
      precio: ['', [Validators.required, Validators.min(0)]],
      estado: ['Activo', [Validators.required]],
      imagenUrl: ['', [Validators.required]]
    });
  }

  // Comprueba si un campo es inválido y fue tocado por el usuario
  isFieldInvalid(fieldName: string): boolean {
    const field = this.productForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // Método que procesa el envío del formulario
  onSubmit(): void {
    if (this.productForm.valid) {
      console.log('Datos del Producto:', this.productForm.value);
    } else {
      this.productForm.markAllAsTouched();
    }
  }
}
