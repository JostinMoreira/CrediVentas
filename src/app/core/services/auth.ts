import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { SupabaseService } from './supabase';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService).client;
  private readonly router = inject(Router);

  get session(): Promise<Session | null> {
    return this.supabase.auth.getSession().then(({ data }) => data.session);
  }

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback).data.subscription;
  }

  async signIn(email: string, password: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
      if (error) return error.message;
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
