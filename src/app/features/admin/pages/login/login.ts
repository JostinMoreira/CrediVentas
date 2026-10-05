import { Component, ElementRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  errorMessage = signal('');
  isSubmitting = signal(false);

  async submit(): Promise<void> {
    if (this.isSubmitting()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.element.nativeElement.querySelector<HTMLInputElement>('input.ng-invalid')?.focus();
      return;
    }
    this.isSubmitting.set(true);
    this.errorMessage.set('');
    try {
      const error = await this.auth.signIn(this.form.controls.email.value, this.form.controls.password.value);
      if (error) {
        this.errorMessage.set(error);
        return;
      }
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      await this.router.navigateByUrl(returnUrl && /^\/admin(?:\/|\?|$)/.test(returnUrl) ? returnUrl : '/admin');
    } catch {
      this.errorMessage.set('No se pudo iniciar sesión. Revisa tu conexión e inténtalo otra vez.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
