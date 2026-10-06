import { DestroyRef, Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase';
import { MfaService } from './mfa';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly router = inject(Router);
  private readonly mfa = inject(MfaService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    const subscription = this.onAuthStateChange((event, session) => {
      if ((!session || session.user.app_metadata['is_admin'] !== true) && /^\/admin(?:\/|$)/.test(this.router.url)) {
        queueMicrotask(() => void this.router.navigate(['/login']));
      }
      if (session && event === 'TOKEN_REFRESHED') {
        // Auth callbacks run under the client's lock. Check MFA only after it is released.
        setTimeout(() => {
          if (this.destroyRef.destroyed || !/^\/admin(?:\/|$)/.test(this.router.url)) return;
          void this.mfa.requiresChallenge().then(required => {
            if (required && !this.destroyRef.destroyed) void this.router.navigate(['/login']);
          }).catch(() => { if (!this.destroyRef.destroyed) void this.router.navigate(['/login']); });
        });
      }
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  async isAdministrator(): Promise<boolean> {
    const { data, error } = await this.supabase.auth.getUser();
    return !error && data.user?.app_metadata['is_admin'] === true;
  }

  get session(): Promise<Session | null> {
    return this.supabase.auth.getSession().then(({ data }) => data.session);
  }

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback).data.subscription;
  }

  async signIn(email: string, password: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.code === 'invalid_credentials') return 'Correo o contraseña incorrectos.';
        if (error.code === 'weak_password') return 'La contraseña no cumple los requisitos de seguridad actuales. Contacta al propietario para restablecerla.';
        return 'No se pudo iniciar sesión. Revisa tus datos e inténtalo de nuevo.';
      }
      if (data.user?.app_metadata?.['is_admin'] !== true) {
        await this.supabase.auth.signOut();
        return 'Esta cuenta no tiene permisos de administración.';
      }
      return null;
    } catch {
      return 'No se pudo conectar con el servicio de autenticación.';
    }
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
    await this.router.navigate(['/login']);
  }
}
