import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase';
import { Product, ProductInput, ProductPage, ProductQuery, normalizeSearch, parseProduct, validateProductInput } from '../models/product';
export type { Product, ProductInput, ProductState, ProductPage } from '../models/product';

@Injectable({ providedIn: 'root' })
export class ProductService {
  readonly editorialAvailable = signal(false);
  private catalogApiAvailable: boolean | undefined;
  constructor(private readonly supabaseService: SupabaseService) {}

  async getPage(options: ProductQuery = {}): Promise<ProductPage> {
    const page = Math.max(0, Math.floor(options.page ?? 0));
    const pageSize = Math.min(50, Math.max(1, Math.floor(options.pageSize ?? 24)));
    const start = page * pageSize, publicOnly = options.publicOnly !== false;
    if (this.catalogApiAvailable !== false) {
      const { data, count, error } = await this.supabaseService.client.rpc('catalog_products', {
        search_term: normalizeSearch((options.search ?? '').slice(0, 120)), category_name: options.category || undefined,
        active_only: publicOnly, featured_only: options.featuredOnly ?? false,
      }, { count: 'exact' }).order('nombre').order('id').range(start, start + pageSize - 1);
      if (!error) {
        this.catalogApiAvailable = true;
        this.editorialAvailable.set(true);
        return { products: (data ?? []).map(parseProduct), total: count ?? 0 };
      }
      // Only a missing RPC permits fallback during deployment; never mask permission/network errors.
      if (error.code !== 'PGRST202') throw error;
      this.catalogApiAvailable = false;
    }
    if (options.featuredOnly) return { products: [], total: 0 };
    let query = this.supabaseService.client.from('productos').select('*', { count: 'exact' });
    if (publicOnly) query = query.eq('estado', 'Activo');
    if (options.category) query = query.eq('categoria', options.category);
    const search = (options.search ?? '').trim().slice(0, 120).replace(/[\\%_*(),."']/g, ' ').trim();
    if (search) query = query.or('nombre.ilike.%' + search + '%,categoria.ilike.%' + search + '%');
    const { data, count, error } = await query.order('nombre').order('id').range(start, start + pageSize - 1);
    if (error) throw error;
    return { products: (data ?? []).map(parseProduct), total: count ?? 0 };
  }

  async getCategories(): Promise<string[]> {
    if (this.catalogApiAvailable !== false) {
      const { data, error } = await this.supabaseService.client.rpc('catalog_categories');
      if (!error) return (data ?? []).map(row => row.categoria);
      if (error.code !== 'PGRST202') throw error;
    }
    const categories = new Set<string>();
    let offset = 0;
    while (true) {
      const { data, error } = await this.supabaseService.client.from('productos').select('categoria').eq('estado', 'Activo').order('id').range(offset, offset + 499);
      if (error) throw error;
      for (const row of data ?? []) categories.add(row.categoria);
      if (!data || data.length < 500) break;
      offset += 500;
    }
    return [...categories].sort((a, b) => a.localeCompare(b, 'es'));
  }

  async getById(id: string, publicOnly = false): Promise<Product | null> {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
    let query = this.supabaseService.client.from('productos').select('*').eq('id', id);
    if (publicOnly) query = query.eq('estado', 'Activo');
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (data && typeof data.destacado === 'boolean') this.editorialAvailable.set(true);
    return data ? parseProduct(data) : null;
  }

  async create(product: ProductInput, id: string = crypto.randomUUID()): Promise<Product> {
    // Keep the same UUID across form retries to avoid duplicates after a lost response.
    const { data, error } = await this.supabaseService.client.from('productos')
      .upsert({ ...validateProductInput(product), id }, { onConflict: 'id' }).select().single();
    if (error) throw error;
    return parseProduct(data);
  }
  async update(id: string, product: ProductInput): Promise<Product> {
    if (!id) throw new Error('Falta el identificador del producto.');
    const { data, error } = await this.supabaseService.client.from('productos').update(validateProductInput(product)).eq('id', id).select().single();
    if (error) throw error;
    return parseProduct(data);
  }
  async delete(id: string): Promise<boolean> {
    if (!id) throw new Error('Falta el identificador del producto.');
    const { data, error } = await this.supabaseService.client.from('productos').delete().eq('id', id).select('id');
    if (error) throw error;
    return !!data?.length;
  }
}
