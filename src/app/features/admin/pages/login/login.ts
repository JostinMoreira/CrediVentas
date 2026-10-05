import { Component, ElementRef, OnInit, inject, signal } from '@angular/core';
import { FormField, form, maxLength, pattern, required } from '@angular/forms/signals';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';
import { MfaFactor, MfaService } from '../../../../core/services/mfa';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, FormField],
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly mfa = inject(MfaService);
  readonly factors = signal<MfaFactor[]>([]);
  readonly selectedFactor = signal('');
  readonly challenge = signal(false);
  readonly codeModel = signal({ code: '' });
  readonly codeForm = form(this.codeModel, path => {
    required(path.code); maxLength(path.code, 6);
    pattern(path.code, /^\d{6}$/);
  });
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  errorMessage = signal('');
  isSubmitting = signal(false);

  async ngOnInit(): Promise<void> {
    this.isSubmitting.set(true);
    try {
      if (await this.auth.isAdministrator() && await this.mfa.requiresChallenge()) await this.openChallenge();
    } catch { this.errorMessage.set('No se pudo comprobar la sesión. Inicia sesión para reintentar.'); }
    finally { this.isSubmitting.set(false); }
  }

  private async openChallenge(): Promise<void> {
    this.challenge.set(true);
    this.form.controls.password.reset();
    this.factors.set(await this.mfa.factors());
    this.selectedFactor.set(this.factors()[0]?.id || '');
    if (!this.selectedFactor()) throw new Error('No hay un autenticador compatible. Contacta al propietario.');
    setTimeout(() => this.element.nativeElement.querySelector<HTMLInputElement>('#mfa-code')?.focus());
  }

  private async enterPanel(): Promise<void> {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    await this.router.navigateByUrl(returnUrl && /^\/admin(?:\/|\?|$)/.test(returnUrl) ? returnUrl : '/admin');
  }

  async verifyCode(): Promise<void> {
    if (this.isSubmitting()) return;
    if (this.codeForm.code().invalid() || !this.selectedFactor()) {
      this.errorMessage.set('Ingresa el código de seis dígitos de tu autenticador.');
      this.element.nativeElement.querySelector<HTMLInputElement>('#mfa-code')?.focus();
      return;
    }
    this.isSubmitting.set(true); this.errorMessage.set('');
    try {
      await this.mfa.verify(this.selectedFactor(), this.codeModel().code);
      this.codeModel.set({ code: '' });
      await this.enterPanel();
    } catch { this.errorMessage.set('No se pudo verificar. Usa el código actual y reintenta.'); }
    finally { this.isSubmitting.set(false); }
  }

  async cancelChallenge(): Promise<void> {
    if (this.isSubmitting()) return;
    this.isSubmitting.set(true);
    try {
      await this.auth.signOut();
      this.challenge.set(false); this.factors.set([]); this.codeModel.set({ code: '' });
      this.errorMessage.set('');
    } catch { this.errorMessage.set('No se pudo cerrar la sesión. Reintenta.'); }
    finally { this.isSubmitting.set(false); }
  }

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
      if (await this.mfa.requiresChallenge()) await this.openChallenge();
      else await this.enterPanel();
    } catch {
      this.errorMessage.set('No se pudo iniciar sesión. Revisa tu conexión e inténtalo otra vez.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
