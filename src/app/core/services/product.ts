import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase';

export interface Product {
  id?: string;
  nombre: string;
  categoria: string;
  precio: number;
  estado: string;
  imagenUrl?: string;
  imagenes?: string[];
  descripcion?: string;
  especificaciones?: Record<string, string>;
}

export type ProductInput = Omit<Product, 'id'>;

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly tableName = 'productos';

  constructor(private supabaseService: SupabaseService) {}

  /**
   * Obtiene todos los productos de la tabla PostgreSQL
   */
  async getAll(): Promise<Product[]> {
    try {
      const { data, error } = await this.supabaseService.client
        .from(this.tableName)
        .select('*')
        .order('id', { ascending: false });
      if (error) throw error;
      return data as Product[];
    } catch (error) {
      console.error('Error obteniendo productos:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo producto
   * @param product Datos del producto a crear
   */
  async create(product: ProductInput): Promise<Product> {
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
      throw error;
    }
  }

  /**
   * Actualiza un producto existente
   * @param id Identificador único del producto
   * @param product Objeto con los datos a actualizar
   */
  async update(id: string, product: Partial<ProductInput>): Promise<Product> {
    if (!id || Object.keys(product).length === 0) {
      throw new Error('Se requiere un identificador y al menos un campo para actualizar.');
    }
    try {
      const { data, error } = await this.supabaseService.client
        .from(this.tableName)
        .update(product)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      if (!data) throw new Error(`No se encontró el producto ${id}.`);
      return data as Product;
    } catch (error) {
      console.error('Error actualizando producto:', error);
      throw error;
    }
  }

  /**
   * Elimina un producto por su id
   * @param id Identificador único del producto
   */
  async delete(id: string): Promise<boolean> {
    if (!id) throw new Error('Se requiere el identificador del producto.');
    try {
      const { data, error } = await this.supabaseService.client
        .from(this.tableName)
        .delete()
        .eq('id', id)
        .select('id');
      if (error) throw error;
      return data.length > 0;
    } catch (error) {
      console.error('Error eliminando producto:', error);
      throw error;
    }
  }
}
