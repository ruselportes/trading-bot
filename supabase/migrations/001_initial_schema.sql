-- ============================================
-- Trading Bot - Supabase Schema
-- ============================================

-- 1. USERS (extends Supabase Auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 2. API KEYS (encrypted)
create table if not exists public.api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  mode text not null check (mode in ('demo', 'live')),
  api_key text not null,
  secret text not null,
  passphrase text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, mode)
);

alter table public.api_keys enable row level security;

create policy "Users can read own API keys"
  on public.api_keys for select
  using (auth.uid() = user_id);

create policy "Users can insert own API keys"
  on public.api_keys for insert
  with check (auth.uid() = user_id);

create policy "Users can update own API keys"
  on public.api_keys for update
  using (auth.uid() = user_id);

create policy "Users can delete own API keys"
  on public.api_keys for delete
  using (auth.uid() = user_id);


-- 3. BOT SETTINGS
create table if not exists public.bot_settings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  pairs text[] default array['BTC-USDT', 'ETH-USDT'],
  timeframes text[] default array['15m', '1h', '4h'],
  risk_per_trade numeric default 1.0,
  max_trades integer default 3,
  min_profit_ratio numeric default 2.0,
  mode text default 'demo' check (mode in ('paper', 'demo', 'live')),
  auto_trade boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.bot_settings enable row level security;

create policy "Users can read own settings"
  on public.bot_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own settings"
  on public.bot_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own settings"
  on public.bot_settings for update
  using (auth.uid() = user_id);


-- 4. TRADES
create table if not exists public.trades (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  pair text not null,
  side text not null check (side in ('long', 'short')),
  entry_price numeric not null,
  size numeric not null,
  stop_loss numeric not null,
  take_profit numeric not null,
  status text default 'open' check (status in ('open', 'closed', 'cancelled')),
  pnl numeric,
  pnl_percent numeric,
  reason text,
  opened_at timestamptz default now(),
  closed_at timestamptz,
  exit_price numeric,
  exit_reason text
);

alter table public.trades enable row level security;

create policy "Users can read own trades"
  on public.trades for select
  using (auth.uid() = user_id);

create policy "Users can insert own trades"
  on public.trades for insert
  with check (auth.uid() = user_id);

create policy "Users can update own trades"
  on public.trades for update
  using (auth.uid() = user_id);


-- 5. PERFORMANCE LOGS
create table if not exists public.performance_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  total_trades integer default 0,
  winning_trades integer default 0,
  losing_trades integer default 0,
  win_rate numeric default 0,
  profit_factor numeric default 0,
  total_pnl numeric default 0,
  equity numeric default 0,
  best_trade numeric default 0,
  worst_trade numeric default 0,
  created_at timestamptz default now(),
  unique (user_id, date)
);

alter table public.performance_logs enable row level security;

create policy "Users can read own performance"
  on public.performance_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own performance"
  on public.performance_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own performance"
  on public.performance_logs for update
  using (auth.uid() = user_id);


-- 6. SIGNALS LOG
create table if not exists public.signals (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  pair text not null,
  timeframe text not null,
  side text not null check (side in ('long', 'short')),
  entry_price numeric not null,
  stop_loss numeric not null,
  take_profit numeric not null,
  reason text,
  order_block jsonb,
  fvg jsonb,
  liquidity jsonb,
  executed boolean default false,
  trade_id uuid references public.trades(id),
  created_at timestamptz default now()
);

alter table public.signals enable row level security;

create policy "Users can read own signals"
  on public.signals for select
  using (auth.uid() = user_id);

create policy "Users can insert own signals"
  on public.signals for insert
  with check (auth.uid() = user_id);


-- INDEXES
create index if not exists idx_trades_user_id on public.trades(user_id);
create index if not exists idx_trades_status on public.trades(status);
create index if not exists idx_trades_opened_at on public.trades(opened_at desc);
create index if not exists idx_performance_user_date on public.performance_logs(user_id, date desc);
create index if not exists idx_signals_user_created on public.signals(user_id, created_at desc);
