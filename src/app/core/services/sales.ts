import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase';
import type { Tables, TablesInsert } from '../models/database';

export type Sale = Tables<'sales'>;
export type SalePayment = Tables<'sale_payments'>;
export type SaleInput = TablesInsert<'sales'>;

@Injectable({ providedIn: 'root' })
export class SalesService {
  private readonly db = inject(SupabaseService).client;

  async list(): Promise<{ sales: Sale[]; payments: SalePayment[] }> {
    const sales: Sale[] = [], payments: SalePayment[] = [];
    for (let offset = 0; ; offset += 500) {
      const { data, error } = await this.db.from('sales').select('*').order('sold_at', { ascending: false }).order('id').range(offset, offset + 499);
      if (error) throw error;
      sales.push(...(data ?? []));
      if (!data || data.length < 500) break;
    }
    for (let offset = 0; offset < sales.length; offset += 100) {
      const ids = sales.slice(offset, offset + 100).map(sale => sale.id);
      const { data, error } = await this.db.from('sale_payments').select('*').in('sale_id', ids);
      if (error) throw error;
      payments.push(...(data ?? []));
    }
    return { sales, payments };
  }

  async create(input: SaleInput, id: string): Promise<void> {
    const { error } = await this.db.from('sales').upsert({ ...input, id }, { onConflict: 'id' });
    if (error) throw error;
  }

  async recordPayment(sale: Sale, installmentNumber: number, amount: number): Promise<void> {
    const { error } = await this.db.from('sale_payments').insert({ sale_id: sale.id, installment_number: installmentNumber, amount });
    if (error) throw error;
  }
}
