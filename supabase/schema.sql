-- ============================================================
-- Formula Selector - Supabase schema
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- 1. Markets
create table if not exists markets (
  code text primary key,
  name text not null,
  currency text not null default 'RUB',
  active boolean default true,
  created_at timestamptz default now()
);

insert into markets (code, name, currency)
values
  ('RU', 'Россия', 'RUB'),
  ('KZ', 'Казахстан', 'KZT'),
  ('BY', 'Беларусь', 'BYN'),
  ('EU', 'Европейский союз', 'EUR')
on conflict (code) do nothing;

-- 2. Formula categories
create table if not exists formula_categories (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  color text default '#1e6ef2',
  order_priority int default 0,
  created_at timestamptz default now()
);

insert into formula_categories (code, name, description, color, order_priority)
values
  ('standard', 'Стандартная', 'Для здоровых детей', '#2349d6', 1),
  ('comfort', 'Комфорт', 'При коликах и запорах', '#a66b00', 2),
  ('ha_phf', 'Гипоаллергенная (ГА)', 'Профилактика аллергии', '#6b3bb5', 3),
  ('ehf', 'Глубокий гидролизат (eHF)', 'Лечебная при АБКМ', '#0d7a55', 4),
  ('aaf', 'Аминокислотная (AAF)', 'При тяжёлой АБКМ', '#ac1f33', 5),
  ('ar', 'Антирефлюксная (AR)', 'При срыгиваниях', '#b2523c', 6),
  ('lactose_free', 'Безлактозная', 'При лактазной недостаточности', '#226998', 7),
  ('goat', 'Козье молоко', 'Альтернативная белковая основа', '#4a5568', 8)
on conflict (code) do nothing;

-- 3. Brands
create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  country text,
  website text,
  active boolean default true,
  created_at timestamptz default now()
);

insert into brands (name, country, website)
values
  ('Abbott (Similac)', 'USA', 'https://www.abbott.com'),
  ('Nutricia (Nutrilon)', 'Netherlands', 'https://www.nutricia.com'),
  ('FrieslandCampina (Frisolac)', 'Netherlands', 'https://www.frieslandcampina.com'),
  ('Nestlé (NAN)', 'Switzerland', 'https://www.nestle.com'),
  ('Gerber', 'USA', 'https://www.gerber.com'),
  ('Hipp', 'Germany', 'https://www.hipp.de'),
  ('Heinz', 'USA', 'https://www.heinz.com')
on conflict (name) do nothing;

-- 4. Products
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete set null,
  market_code text references markets(code) default 'RU',
  category_id uuid references formula_categories(id) on delete restrict,
  name text not null,
  product_type text not null default 'formula' check (product_type in ('formula', 'food')),
  stage text not null default '1',
  status text not null default 'verified' check (status in ('unverified', 'verified', 'archived')),
  verified_at timestamptz default now(),
  verified_by uuid,
  source_url text,

  kcal numeric(5,2),
  protein_g numeric(4,2),
  whey_casein_ratio text,
  fat_g numeric(4,2),
  palm_oil boolean default false,
  carbs_g numeric(4,2),
  lactose_g numeric(4,2),

  maltodextrin boolean default false,
  gos_fos boolean default false,
  probiotics text,
  dha_ara boolean default false,

  calcium_mg numeric(5,2),
  phosphorus_mg numeric(5,2),
  magnesium_mg numeric(4,2),
  iron_mg numeric(4,2),
  zinc_mg numeric(4,2),
  copper_mcg numeric(4,2),
  iodine_mcg numeric(4,2),
  selenium_mcg numeric(4,2),
  vitamin_a_mcg numeric(5,2),
  vitamin_d_mcg numeric(4,2),
  vitamin_e_mg numeric(4,2),
  vitamin_c_mg numeric(4,2),

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_brand on products(brand_id);
create index if not exists idx_products_market on products(market_code);
create index if not exists idx_products_status on products(status);

-- 5. Product barcodes
create table if not exists product_barcodes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  barcode text unique not null,
  format text check (format in ('EAN-13', 'EAN-8')),
  source_note text,
  confirmed boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_product_barcodes_product on product_barcodes(product_id);
create index if not exists idx_product_barcodes_barcode on product_barcodes(barcode);

-- 6. Clinical decisions
create table if not exists clinical_decisions (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  rule_version text not null default '1.0.0',
  patient_age_months integer,
  symptom_input jsonb not null,
  decision jsonb not null,
  matched_rules jsonb not null default '[]'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_clinical_decisions_created on clinical_decisions(created_at desc);

-- 7. Enable RLS
alter table products enable row level security;
alter table product_barcodes enable row level security;
alter table clinical_decisions enable row level security;

create policy "Public read verified products"
on products
for select
using (true);

create policy "Public read barcodes"
on product_barcodes
for select
using (true);

create policy "Public insert clinical decisions"
on clinical_decisions
for insert
with check (true);

create policy "Public read clinical decisions"
on clinical_decisions
for select
using (true);

-- ============================================================
-- Seed sample products
-- ============================================================

insert into products (
  brand_id, market_code, category_id, name, product_type, stage,
  kcal, protein_g, fat_g, carbs_g, lactose_g, whey_casein_ratio,
  calcium_mg, iron_mg, iodine_mcg, vitamin_d_mcg, vitamin_c_mg
)
select
  b.id, 'RU', c.id, 'Similac Pro-Advance 1', 'formula', '1',
  67, 1.5, 3.5, 7.2, 6.8, '60/40',
  58, 0.9, 12, 1.1, 8
from brands b
join formula_categories c on c.code = 'standard'
where b.name = 'Abbott (Similac)'
on conflict do nothing;

insert into product_barcodes (product_id, barcode, format)
select p.id, '5901234123457', 'EAN-13'
from products p
where p.name = 'Similac Pro-Advance 1'
on conflict (barcode) do nothing;

insert into products (
  brand_id, market_code, category_id, name, product_type, stage,
  kcal, protein_g, fat_g, carbs_g, lactose_g, whey_casein_ratio,
  calcium_mg, iron_mg, iodine_mcg, vitamin_d_mcg, vitamin_c_mg
)
select
  b.id, 'RU', c.id, 'Nutrilon Premium 1', 'formula', '1',
  66, 1.4, 3.4, 7.3, 6.9, '65/35',
  56, 0.8, 11, 1.0, 7
from brands b
join formula_categories c on c.code = 'standard'
where b.name = 'Nutricia (Nutrilon)'
on conflict do nothing;

insert into product_barcodes (product_id, barcode, format)
select p.id, '8710908635538', 'EAN-13'
from products p
where p.name = 'Nutrilon Premium 1'
on conflict (barcode) do nothing;

insert into products (
  brand_id, market_code, category_id, name, product_type, stage,
  kcal, protein_g, fat_g, carbs_g, lactose_g,
  calcium_mg, iron_mg, iodine_mcg, vitamin_d_mcg, vitamin_c_mg
)
select
  b.id, 'EU', c.id, 'Nutrilon Pepti 1', 'formula', '1',
  65, 1.5, 3.4, 7.0, 0.0,
  55, 1.0, 11, 1.1, 9
from brands b
join formula_categories c on c.code = 'ehf'
where b.name = 'Nutricia (Nutrilon)'
on conflict do nothing;

insert into products (
  brand_id, market_code, category_id, name, product_type, stage,
  kcal, protein_g, fat_g, carbs_g, lactose_g,
  calcium_mg, iron_mg, iodine_mcg, vitamin_d_mcg, vitamin_c_mg
)
select
  b.id, 'EU', c.id, 'Frisolac Gold HA 1', 'formula', '1',
  68, 1.6, 3.4, 7.3, 6.5,
  57, 0.9, 12, 1.0, 8
from brands b
join formula_categories c on c.code = 'ha_phf'
where b.name = 'FrieslandCampina (Frisolac)'
on conflict do nothing;

insert into products (
  brand_id, market_code, category_id, name, product_type, stage,
  kcal, protein_g, fat_g, carbs_g, lactose_g,
  calcium_mg, iron_mg, iodine_mcg, vitamin_d_mcg, vitamin_c_mg
)
select
  b.id, 'RU', c.id, 'NAN 1 Comfort', 'formula', '1',
  68, 1.3, 3.6, 7.5, 5.8,
  60, 1.0, 13, 1.1, 9
from brands b
join formula_categories c on c.code = 'comfort'
where b.name = 'Nestlé (NAN)'
on conflict do nothing;

insert into products (
  brand_id, market_code, category_id, name, product_type, stage,
  kcal, protein_g, fat_g, carbs_g,
  calcium_mg, iron_mg, vitamin_c_mg
)
select
  b.id, 'RU', c.id, 'Gerber - Абрикос и груша', 'food', '4+ месяцев',
  46, 0.5, 0.2, 11.5,
  15, 0.3, 12
from brands b
join formula_categories c on c.code = 'standard'
where b.name = 'Gerber'
on conflict do nothing;

insert into products (
  brand_id, market_code, category_id, name, product_type, stage,
  kcal, protein_g, fat_g, carbs_g,
  calcium_mg, iron_mg, vitamin_c_mg
)
select
  b.id, 'EU', c.id, 'HiPP Organic - Яблоко и банан', 'food', '4+ месяцев',
  48, 0.6, 0.1, 12.0,
  18, 0.4, 14
from brands b
join formula_categories c on c.code = 'standard'
where b.name = 'Hipp'
on conflict do nothing;

insert into products (
  brand_id, market_code, category_id, name, product_type, stage,
  kcal, protein_g, fat_g, carbs_g,
  calcium_mg, iron_mg, vitamin_c_mg
)
select
  b.id, 'RU', c.id, 'Heinz - Морковь и зелень', 'food', '4+ месяцев',
  32, 0.8, 0.3, 7.2,
  22, 0.5, 8
from brands b
join formula_categories c on c.code = 'standard'
where b.name = 'Heinz'
on conflict do nothing;

insert into products (
  brand_id, market_code, category_id, name, product_type, stage,
  kcal, protein_g, fat_g, carbs_g, lactose_g,
  calcium_mg, iron_mg, iodine_mcg, vitamin_d_mcg, vitamin_c_mg
)
select
  b.id, 'RU', c.id, 'NAN Anti-Reflux', 'formula', '1',
  66, 1.5, 3.4, 7.0, 4.8,
  58, 0.9, 12, 1.0, 8
from brands b
join formula_categories c on c.code = 'ar'
where b.name = 'Nestlé (NAN)'
on conflict do nothing;

insert into product_barcodes (product_id, barcode, format)
select p.id, '7613031705345', 'EAN-13'
from products p
where p.name = 'NAN Anti-Reflux'
on conflict (barcode) do nothing;

select 'Schema ready' as status;
