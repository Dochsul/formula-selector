-- Users table
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Licenses table
create table if not exists public.licenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  email text not null,
  key text unique not null,
  plan text not null check (plan in ('monthly', 'quarterly', 'yearly')),
  status text not null default 'active' check (status in ('active', 'inactive', 'expired')),
  started_at timestamptz default now(),
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Payments table
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  email text not null,
  amount numeric(10, 2) not null,
  currency text default 'RUB',
  plan text not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'rejected')),
  reference_number text,
  created_at timestamptz default now(),
  confirmed_at timestamptz,
  updated_at timestamptz default now()
);

-- Invoices table
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  payment_id uuid references public.payments(id) on delete set null,
  email text not null,
  amount numeric(10, 2) not null,
  currency text default 'RUB',
  invoice_number text unique not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'paid')),
  created_at timestamptz default now(),
  sent_at timestamptz,
  updated_at timestamptz default now()
);

-- Create indexes
create index if not exists idx_users_email on public.users(email);
create index if not exists idx_licenses_user_id on public.licenses(user_id);
create index if not exists idx_licenses_email on public.licenses(email);
create index if not exists idx_licenses_key on public.licenses(key);
create index if not exists idx_payments_user_id on public.payments(user_id);
create index if not exists idx_payments_status on public.payments(status);
create index if not exists idx_invoices_user_id on public.invoices(user_id);
create index if not exists idx_invoices_status on public.invoices(status);

-- Enable RLS
alter table public.users enable row level security;
alter table public.licenses enable row level security;
alter table public.payments enable row level security;
alter table public.invoices enable row level security;

-- RLS Policies
create policy "Users can read their own data" on public.users
  for select using (auth.uid() = id);

create policy "Licenses are readable" on public.licenses
  for select using (true);

create policy "Payments are readable" on public.payments
  for select using (auth.uid() = user_id);

create policy "Invoices are readable" on public.invoices
  for select using (auth.uid() = user_id);
