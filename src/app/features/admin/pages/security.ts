import { Component, DestroyRef, ElementRef, OnInit, inject, signal } from '@angular/core';
import { FormField, form, maxLength, pattern, required } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { MfaEnrollment, MfaFactor, MfaService } from '../../../core/services/mfa';

@Component({
  imports: [RouterLink, FormField],
  selector: 'app-security',
  styleUrl: './security.scss',
  templateUrl: './security.html',
})
export class Security implements OnInit {
  private readonly mfa = inject(MfaService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly factors = signal<MfaFactor[]>([]);
  readonly pendingFactors = signal<MfaFactor[]>([]);
  readonly enrollment = signal<MfaEnrollment | undefined>(undefined);
  readonly busy = signal(false);
  readonly loaded = signal(false);
  readonly error = signal('');
  readonly notice = signal('');
  readonly model = signal({ name: '', code: '' });
  readonly fields = form(this.model, path => {
    required(path.name); maxLength(path.name, 60);
    required(path.code); maxLength(path.code, 6); pattern(path.code, /^\d{6}$/);
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      const pending = this.enrollment();
      this.enrollment.set(undefined); this.model.set({ name: '', code: '' });
      if (pending) void this.mfa.cancelEnrollment(pending.id).catch(() => { /* Retry from account settings. */ });
    });
  }
  async ngOnInit(): Promise<void> { await this.load(); }
  async load(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true); this.error.set('');
    try {
      const [factors, pending] = await Promise.all([this.mfa.factors(), this.mfa.pendingFactors()]);
      if (!this.destroyRef.destroyed) { this.factors.set(factors); this.pendingFactors.set(pending); this.loaded.set(true); }
    } catch { this.error.set('No se pudieron consultar tus dispositivos. Reintenta.'); }
    finally { this.busy.set(false); }
  }
  async start(): Promise<void> {
    if (this.busy() || this.enrollment() || !this.loaded()) return;
    if (this.fields.name().invalid() || !this.model().name.trim()) {
      this.error.set('Dale un nombre al dispositivo, de hasta 60 caracteres.');
      this.element.nativeElement.querySelector<HTMLInputElement>('#device-name')?.focus(); return;
    }
    this.busy.set(true); this.error.set(''); this.notice.set('');
    try {
      const enrollment = await this.mfa.enroll(this.model().name);
      if (this.destroyRef.destroyed) { await this.mfa.cancelEnrollment(enrollment.id); return; }
      this.enrollment.set(enrollment);
      setTimeout(() => this.element.nativeElement.querySelector<HTMLInputElement>('#setup-code')?.focus());
    } catch { this.error.set('No se pudo preparar el autenticador. Usa otro nombre o reintenta.'); }
    finally { this.busy.set(false); }
  }
  async verify(): Promise<void> {
    const pending = this.enrollment();
    if (this.busy() || !pending) return;
    if (this.fields.code().invalid()) {
      this.error.set('Ingresa el código de seis dígitos.');
      this.element.nativeElement.querySelector<HTMLInputElement>('#setup-code')?.focus(); return;
    }
    this.busy.set(true); this.error.set('');
    try {
      await this.mfa.verify(pending.id, this.model().code);
      this.enrollment.set(undefined); this.model.set({ name: '', code: '' });
      this.notice.set('Autenticador activado. Añade otro dispositivo como respaldo.');
    } catch { this.error.set('No se pudo verificar. Usa el código actual y reintenta.'); }
    finally { this.busy.set(false); }
    if (!this.enrollment()) await this.load();
  }
  async cancel(): Promise<void> {
    const pending = this.enrollment();
    if (this.busy() || !pending) return;
    this.busy.set(true); this.error.set('');
    try {
      await this.mfa.cancelEnrollment(pending.id);
      this.enrollment.set(undefined); this.model.set({ name: '', code: '' });
    } catch { this.error.set('No se pudo cancelar. Reintenta antes de añadir otro dispositivo.'); }
    finally { this.busy.set(false); }
  }
  async remove(factor: MfaFactor): Promise<void> {
    if (this.busy() || this.enrollment() || !confirm('¿Retirar el autenticador «' + factor.name + '»? Conserva acceso al otro dispositivo.')) return;
    this.busy.set(true); this.error.set(''); this.notice.set('');
    try {
      await this.mfa.remove(factor.id); this.notice.set('Dispositivo retirado.');
    } catch { this.error.set('No se pudo confirmar la retirada. Revisa tus dispositivos y vuelve a iniciar sesión si hace falta.'); }
    finally { this.busy.set(false); }
    await this.load();
  }
  async discardPending(factor: MfaFactor): Promise<void> {
    if (this.busy() || this.enrollment()) return;
    this.busy.set(true); this.error.set('');
    try { await this.mfa.cancelEnrollment(factor.id); }
    catch { this.error.set('No se pudo retirar la configuración pendiente. Reintenta.'); }
    finally { this.busy.set(false); }
    await this.load();
  }
}
