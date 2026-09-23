import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase';

export interface Product {
  id?: string;
  name: string;
  price: number;
  imageUrl?: string;
  // Agrega otras propiedades según tu esquema en PostgreSQL
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
    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Error obteniendo productos:', error);
      return null;
    }

    return data as Product[];
  }

  /**
   * Crea un nuevo producto
   * @param product Datos del producto a crear
   */
  async create(product: Product): Promise<Product | null> {
    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .insert([product])
      .select()
      .single();

    if (error) {
      console.error('Error creando producto:', error);
      return null;
    }

    return data as Product;
  }

  /**
   * Actualiza un producto existente
   * @param id Identificador único del producto
   * @param product Objeto con los datos a actualizar
   */
  async update(id: string, product: Partial<Product>): Promise<Product | null> {
    const { data, error } = await this.supabaseService.client
      .from(this.tableName)
      .update(product)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando producto:', error);
      return null;
    }

    return data as Product;
  }

  /**
   * Elimina un producto por su id
   * @param id Identificador único del producto
   */
  async delete(id: string): Promise<boolean> {
    const { error } = await this.supabaseService.client
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error eliminando producto:', error);
      return false;
    }

    return true;
  }
}
