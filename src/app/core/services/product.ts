import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase';

export interface Product {
  id?: string;
  nombre: string;
  categoria: string;
  precio: number;
  estado: string;
  imagenUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly tableName = 'productos';

  constructor(private supabaseService: SupabaseService) {}

  /**
   * Obtiene todos los productos de la tabla PostgreSQL
   */
  async getAll(): Promise<Product[] | null> {
    try {
      const { data, error } = await this.supabaseService.client
        .from(this.tableName)
        .select('*')
        .order('id', { ascending: false });
      if (error) throw error;
      return data as Product[];
    } catch (error) {
      console.error('Error obteniendo productos:', error);
      return null;
    }
  }

  /**
   * Crea un nuevo producto
   * @param product Datos del producto a crear
   */
  async create(product: Product): Promise<Product | null> {
    try {
      const { data, error } = await this.supabaseService.client
        .from(this.tableName)
        .insert([product])
        .select()
        .single();
      if (error) throw error;
      return data as Product;
    } catch (error) {
      console.error('Error creando producto:', error);
      return null;
    }
  }

  /**
   * Actualiza un producto existente
   * @param id Identificador único del producto
   * @param product Objeto con los datos a actualizar
   */
  async update(id: string, product: Partial<Product>): Promise<Product | null> {
    try {
      const { data, error } = await this.supabaseService.client
        .from(this.tableName)
        .update(product)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Product;
    } catch (error) {
      console.error('Error actualizando producto:', error);
      return null;
    }
  }

  /**
   * Elimina un producto por su id
   * @param id Identificador único del producto
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabaseService.client
        .from(this.tableName)
        .delete()
        .eq('id', id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error eliminando producto:', error);
      return false;
    }
  }
}
