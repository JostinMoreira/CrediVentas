import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    // Inicializa el cliente de Supabase usando las credenciales del environment
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  /**
   * Expone el cliente de Supabase para ser utilizado por otros servicios
   */
  get client(): SupabaseClient {
    return this.supabase;
  }
}
