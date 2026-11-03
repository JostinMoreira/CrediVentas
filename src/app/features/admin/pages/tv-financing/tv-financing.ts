import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Sale, SaleInput, SalePayment, SalesService } from '../../../../core/services/sales';

type Filter = 'Todos' | 'Al día' | 'Vencido' | 'Contado';
type SaleForm = {
  customer_name: string; product_name: string; model: string; serial_number: string;
  payment_type: 'contado' | 'credito'; payment_method: 'efectivo' | 'transferencia' | 'tarjeta' | 'otro';
  total_amount: number | null; down_payment: number | null; installment_count: number | null;
  sold_at: string; first_due_date: string; notes: string;
};
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const blankForm = (): SaleForm => ({ customer_name: '', product_name: '', model: '', serial_number: '', payment_type: 'contado', payment_method: 'efectivo', total_amount: null, down_payment: 0, installment_count: null, sold_at: today(), first_due_date: '', notes: '' });

@Component({
  selector: 'app-tv-financing',
  imports: [RouterLink, CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './tv-financing.html',
  styleUrl: './tv-financing.scss',
})
export class TvFinancing implements OnInit {
  private readonly service = inject(SalesService);
  readonly sales = signal<Sale[]>([]);
  readonly payments = signal<SalePayment[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly loadError = signal('');
  readonly error = signal('');
  readonly notice = signal('');
  readonly query = signal('');
  readonly filter = signal<Filter>('Todos');
  readonly selected = signal<Sale | null>(null);
  readonly showForm = signal(false);
  private draftId = crypto.randomUUID();
  readonly form = signal<SaleForm>(blankForm());
  readonly filtered = computed(() => this.sales().filter(sale =>
    (this.filter() === 'Todos' || this.status(sale) === this.filter()) &&
    `${sale.customer_name} ${sale.product_name} ${sale.model} ${sale.serial_number}`.toLocaleLowerCase().includes(this.query().trim().toLocaleLowerCase())
  ));
  readonly overdue = computed(() => this.sales().filter(sale => this.status(sale) === 'Vencido').length);
  readonly current = computed(() => this.sales().filter(sale => this.status(sale) === 'Al día').length);
  readonly credit = computed(() => this.sales().filter(sale => sale.payment_type === 'credito').length);

  ngOnInit(): void { void this.load(); }
  async load(): Promise<void> {
    this.loading.set(true); this.loadError.set('');
    try {
      const { sales, payments } = await this.service.list();
      this.sales.set(sales); this.payments.set(payments);
    } catch { this.loadError.set('No se pudieron cargar las ventas. La base de datos de ventas aún no está lista o no hay conexión.'); }
    finally { this.loading.set(false); }
  }

  paidCount(sale: Sale): number { return this.payments().filter(payment => payment.sale_id === sale.id).length; }
  installmentAmount(sale: Sale): number { return sale.installment_count ? Math.round((sale.total_amount - sale.down_payment) * 100 / sale.installment_count) / 100 : 0; }
  nextDue(sale: Sale): string | null {
    if (!sale.first_due_date || this.paidCount(sale) >= sale.installment_count) return null;
    const [year, month, day] = sale.first_due_date.split('-').map(Number);
    const index = year * 12 + month - 1 + this.paidCount(sale);
    const targetYear = Math.floor(index / 12), targetMonth = index % 12;
    const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
    return `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(Math.min(day, lastDay)).padStart(2, '0')}`;
  }
  status(sale: Sale): Filter {
    if (sale.payment_type === 'contado') return 'Contado';
    const due = this.nextDue(sale);
    return due && due < today() ? 'Vencido' : 'Al día';
  }
  setQuery(event: Event): void { this.query.set((event.target as HTMLInputElement).value); }
  setFilter(filter: Filter): void { this.filter.set(filter); }
  openForm(): void { this.draftId = crypto.randomUUID(); this.form.set(blankForm()); this.error.set(''); this.showForm.set(true); }
  closeForm(): void { if (!this.saving()) this.showForm.set(false); }

  async save(): Promise<void> {
    const value = this.form();
    if (!value.customer_name.trim() || !value.product_name.trim() || !value.sold_at || !value.total_amount || value.total_amount <= 0) {
      this.error.set('Completa cliente, producto, fecha y valor de venta.'); return;
    }
    if (value.payment_type === 'credito' && (!value.installment_count || value.installment_count < 1 || value.installment_count > 120 || !value.first_due_date || (value.down_payment ?? 0) >= value.total_amount)) {
      this.error.set('Para crédito, indica entre 1 y 120 cuotas, el primer vencimiento y una entrada menor al valor total.'); return;
    }
    const input: SaleInput = {
      customer_name: value.customer_name.trim(), product_name: value.product_name.trim(), model: value.model.trim(), serial_number: value.serial_number.trim(),
      payment_type: value.payment_type, payment_method: value.payment_method, total_amount: value.total_amount, sold_at: value.sold_at, notes: value.notes.trim(),
      down_payment: value.payment_type === 'credito' ? (value.down_payment ?? 0) : 0,
      installment_count: value.payment_type === 'credito' ? value.installment_count! : 0,
      first_due_date: value.payment_type === 'credito' ? value.first_due_date : null,
    };
    this.saving.set(true); this.error.set('');
    try {
      await this.service.create(input, this.draftId);
      this.showForm.set(false); this.notice.set('Venta registrada.'); await this.load();
    } catch { this.error.set('No se pudo registrar la venta. Revisa los datos e inténtalo de nuevo.'); }
    finally { this.saving.set(false); }
  }

  async recordPayment(sale: Sale): Promise<void> {
    const next = this.paidCount(sale) + 1;
    if (this.saving() || next > sale.installment_count || !confirm(`¿Registrar la cuota ${next} de ${sale.installment_count} de ${sale.customer_name} como pagada?`)) return;
    this.saving.set(true); this.error.set('');
    try {
      const regular = this.installmentAmount(sale);
      const amount = next === sale.installment_count
        ? Math.round((sale.total_amount - sale.down_payment - regular * (next - 1)) * 100) / 100
        : regular;
      await this.service.recordPayment(sale, next, amount);
      this.notice.set(`Cuota ${next} registrada.`); await this.load();
    } catch { this.error.set('No se pudo registrar la cuota. Actualiza la lista antes de volver a intentar.'); }
    finally { this.saving.set(false); }
  }
}
