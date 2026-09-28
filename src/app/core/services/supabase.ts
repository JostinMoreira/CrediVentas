import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    if (!environment.supabaseUrl.startsWith('https://') || environment.supabaseUrl.includes('YOUR_PROJECT')) {
      throw new Error('Configura SUPABASE_URL real en src/environments/environment.ts.');
    }
    if (!environment.supabaseKey || environment.supabaseKey.includes('YOUR_SUPABASE')) {
      throw new Error('Configura la publishable key de Supabase en src/environments/environment.ts.');
    }
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  /**
   * Expone el cliente de Supabase para ser utilizado por otros servicios
   */
  get client(): SupabaseClient {
    return this.supabase;
  }
}
