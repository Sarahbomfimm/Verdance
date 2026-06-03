
-- YEARS
create table public.years (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year int not null,
  total_budget numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  unique(user_id, year)
);
grant select, insert, update, delete on public.years to authenticated;
grant all on public.years to service_role;
alter table public.years enable row level security;
create policy "own years select" on public.years for select to authenticated using (auth.uid() = user_id);
create policy "own years insert" on public.years for insert to authenticated with check (auth.uid() = user_id);
create policy "own years update" on public.years for update to authenticated using (auth.uid() = user_id);
create policy "own years delete" on public.years for delete to authenticated using (auth.uid() = user_id);

-- CATEGORIES
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year_id uuid not null references public.years(id) on delete cascade,
  name text not null,
  color text not null default '#10b981',
  icon text default 'wallet',
  budget numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "own cat select" on public.categories for select to authenticated using (auth.uid() = user_id);
create policy "own cat insert" on public.categories for insert to authenticated with check (auth.uid() = user_id);
create policy "own cat update" on public.categories for update to authenticated using (auth.uid() = user_id);
create policy "own cat delete" on public.categories for delete to authenticated using (auth.uid() = user_id);

-- PRODUCTS
create table public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  budget numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "own prod select" on public.products for select to authenticated using (auth.uid() = user_id);
create policy "own prod insert" on public.products for insert to authenticated with check (auth.uid() = user_id);
create policy "own prod update" on public.products for update to authenticated using (auth.uid() = user_id);
create policy "own prod delete" on public.products for delete to authenticated using (auth.uid() = user_id);

-- PURCHASES
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  year_id uuid not null references public.years(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  amount numeric(14,2) not null,
  purchase_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.purchases to authenticated;
grant all on public.purchases to service_role;
alter table public.purchases enable row level security;
create policy "own pur select" on public.purchases for select to authenticated using (auth.uid() = user_id);
create policy "own pur insert" on public.purchases for insert to authenticated with check (auth.uid() = user_id);
create policy "own pur update" on public.purchases for update to authenticated using (auth.uid() = user_id);
create policy "own pur delete" on public.purchases for delete to authenticated using (auth.uid() = user_id);

create index on public.categories(year_id);
create index on public.products(category_id);
create index on public.purchases(year_id);
create index on public.purchases(category_id);
create index on public.purchases(product_id);
