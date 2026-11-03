create table public.sales (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  sold_at date not null default current_date,
  customer_name text not null check (length(btrim(customer_name)) between 2 and 160),
  product_name text not null check (length(btrim(product_name)) between 2 and 160),
  model text not null default '',
  serial_number text not null default '',
  payment_type text not null check (payment_type in ('contado', 'credito')),
  payment_method text not null check (payment_method in ('efectivo', 'transferencia', 'tarjeta', 'otro')),
  total_amount numeric(12,2) not null check (total_amount > 0),
  down_payment numeric(12,2) not null default 0 check (down_payment >= 0),
  installment_count integer not null default 0 check (installment_count between 0 and 120),
  first_due_date date,
  notes text not null default '' check (length(notes) <= 1000),
  constraint sales_payment_terms check (
    (payment_type = 'contado' and down_payment = 0 and installment_count = 0 and first_due_date is null)
    or (payment_type = 'credito' and installment_count > 0 and first_due_date is not null and down_payment < total_amount)
  )
);

create table public.sale_payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  installment_number integer not null check (installment_number > 0),
  amount numeric(12,2) not null check (amount > 0),
  paid_at date not null default current_date,
  created_at timestamptz not null default now(),
  unique (sale_id, installment_number)
);

create index sales_sold_at_idx on public.sales (sold_at desc, id desc);
create index sale_payments_sale_id_idx on public.sale_payments (sale_id);

alter table public.sales enable row level security;
alter table public.sale_payments enable row level security;
revoke all on public.sales, public.sale_payments from anon, authenticated;
grant select, insert, update on public.sales to authenticated;
grant select, insert on public.sale_payments to authenticated;

create policy "Admins can read sales" on public.sales for select to authenticated
using ((select coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'is_admin')::boolean, false)));
create policy "Admins can create sales" on public.sales for insert to authenticated
with check ((select coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'is_admin')::boolean, false)));
create policy "Admins can update sales" on public.sales for update to authenticated
using ((select coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'is_admin')::boolean, false)))
with check ((select coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'is_admin')::boolean, false)));

create policy "Admins can read sale payments" on public.sale_payments for select to authenticated
using ((select coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'is_admin')::boolean, false)));
create policy "Admins can create sale payments" on public.sale_payments for insert to authenticated
with check ((select coalesce(((select auth.jwt()) -> 'app_metadata' ->> 'is_admin')::boolean, false))
  and exists (select 1 from public.sales where id = sale_id and payment_type = 'credito' and installment_count >= installment_number));
