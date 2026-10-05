import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import type { Database } from '../models/database';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient<Database>;

  constructor() {
    const url = new URL(environment.supabaseUrl);
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname))) {
      throw new Error('Configura SUPABASE_URL en .env y genera la configuración.');
    }
    if (!environment.supabaseKey || environment.supabaseKey.includes('YOUR_SUPABASE')) {
      throw new Error('Configura SUPABASE_PUBLISHABLE_KEY en .env y genera la configuración.');
    }
    if (environment.supabaseKey.startsWith('sb_secret_')) throw new Error('No se permiten claves privadas en el navegador.');
    if (environment.supabaseKey.startsWith('eyJ')) {
      const payload = JSON.parse(atob(environment.supabaseKey.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as { role?: string };
      if (payload.role !== 'anon') throw new Error('El navegador solo debe usar la clave pública de Supabase.');
    }
    this.supabase = createClient<Database>(environment.supabaseUrl, environment.supabaseKey);
  }

  /**
   * Expone el cliente de Supabase para ser utilizado por otros servicios
   */
  get client(): SupabaseClient<Database> {
    return this.supabase;
  }
}
