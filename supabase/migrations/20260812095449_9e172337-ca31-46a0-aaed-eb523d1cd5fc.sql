
-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  language text not null default 'en',
  telegram_id bigint unique,
  telegram_username text,
  notifications_enabled boolean not null default true,
  is_merchant boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url, telegram_id, telegram_username, language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(coalesce(new.email,''), '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    nullif(new.raw_user_meta_data->>'telegram_id','')::bigint,
    new.raw_user_meta_data->>'telegram_username',
    coalesce(nullif(new.raw_user_meta_data->>'language',''), 'en')
  )
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

-- ============ STORES ============
create table public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  category text not null default 'other',
  logo_url text,
  currency text not null default 'USD',
  address text,
  phone text,
  join_token text not null unique default encode(gen_random_bytes(12), 'hex'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index stores_owner_idx on public.stores(owner_id);
grant select, insert, update, delete on public.stores to authenticated;
grant select on public.stores to anon;
grant all on public.stores to service_role;
alter table public.stores enable row level security;
create policy "stores_public_read" on public.stores for select to anon, authenticated using (true);
create policy "stores_owner_write" on public.stores for insert to authenticated with check (owner_id = auth.uid());
create policy "stores_owner_update" on public.stores for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "stores_owner_delete" on public.stores for delete to authenticated using (owner_id = auth.uid());
create trigger stores_touch before update on public.stores for each row execute function public.touch_updated_at();

create or replace function public.is_store_owner(_store_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.stores s where s.id = _store_id and s.owner_id = auth.uid());
$$;

-- ============ LOYALTY PROGRAMS ============
create type public.loyalty_mode as enum ('points','stamps');

create table public.loyalty_programs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  mode public.loyalty_mode not null default 'points',
  points_per_currency numeric(10,2) not null default 1,
  stamps_required integer not null default 5,
  welcome_points integer not null default 0,
  welcome_stamps integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index loyalty_programs_active_store_idx on public.loyalty_programs(store_id) where is_active;
grant select, insert, update, delete on public.loyalty_programs to authenticated;
grant select on public.loyalty_programs to anon;
grant all on public.loyalty_programs to service_role;
alter table public.loyalty_programs enable row level security;
create policy "programs_public_read" on public.loyalty_programs for select to anon, authenticated using (true);
create policy "programs_owner_all" on public.loyalty_programs for all to authenticated
  using (public.is_store_owner(store_id)) with check (public.is_store_owner(store_id));
create trigger programs_touch before update on public.loyalty_programs for each row execute function public.touch_updated_at();

-- ============ REWARDS ============
create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  program_id uuid references public.loyalty_programs(id) on delete cascade,
  name text not null,
  description text,
  image_url text,
  points_cost integer,
  stamps_cost integer,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index rewards_store_idx on public.rewards(store_id);
grant select, insert, update, delete on public.rewards to authenticated;
grant select on public.rewards to anon;
grant all on public.rewards to service_role;
alter table public.rewards enable row level security;
create policy "rewards_public_read" on public.rewards for select to anon, authenticated using (true);
create policy "rewards_owner_all" on public.rewards for all to authenticated
  using (public.is_store_owner(store_id)) with check (public.is_store_owner(store_id));
create trigger rewards_touch before update on public.rewards for each row execute function public.touch_updated_at();

-- ============ MEMBERSHIPS ============
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  points_balance integer not null default 0,
  stamps_balance integer not null default 0,
  lifetime_points integer not null default 0,
  lifetime_stamps integer not null default 0,
  welcome_granted boolean not null default false,
  status text not null default 'active',
  joined_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  unique (store_id, customer_id)
);
create index memberships_customer_idx on public.memberships(customer_id);
create index memberships_store_idx on public.memberships(store_id);
grant select on public.memberships to authenticated;
grant all on public.memberships to service_role;
alter table public.memberships enable row level security;
create policy "memberships_customer_read" on public.memberships for select to authenticated using (customer_id = auth.uid());
create policy "memberships_merchant_read" on public.memberships for select to authenticated using (public.is_store_owner(store_id));

-- ============ TRANSACTIONS (ledger) ============
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  membership_id uuid not null references public.memberships(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  points_delta integer not null default 0,
  stamps_delta integer not null default 0,
  purchase_amount numeric(12,2),
  reward_id uuid references public.rewards(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index transactions_membership_idx on public.transactions(membership_id, created_at desc);
create index transactions_store_idx on public.transactions(store_id, created_at desc);
create index transactions_customer_idx on public.transactions(customer_id, created_at desc);
grant select on public.transactions to authenticated;
grant all on public.transactions to service_role;
alter table public.transactions enable row level security;
create policy "transactions_customer_read" on public.transactions for select to authenticated using (customer_id = auth.uid());
create policy "transactions_merchant_read" on public.transactions for select to authenticated using (public.is_store_owner(store_id));

-- ============ REDEMPTIONS ============
create table public.redemptions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  membership_id uuid not null references public.memberships(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  reward_id uuid not null references public.rewards(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  status text not null default 'pending',
  points_spent integer not null default 0,
  stamps_spent integer not null default 0,
  expires_at timestamptz not null default now() + interval '24 hours',
  redeemed_at timestamptz,
  redeemed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index redemptions_customer_idx on public.redemptions(customer_id, created_at desc);
create index redemptions_store_idx on public.redemptions(store_id, created_at desc);
grant select on public.redemptions to authenticated;
grant all on public.redemptions to service_role;
alter table public.redemptions enable row level security;
create policy "redemptions_customer_read" on public.redemptions for select to authenticated using (customer_id = auth.uid());
create policy "redemptions_merchant_read" on public.redemptions for select to authenticated using (public.is_store_owner(store_id));

-- ============ QR TOKENS ============
create table public.qr_tokens (
  id uuid primary key default gen_random_uuid(),
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  kind text not null default 'customer',
  customer_id uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz not null default now() + interval '5 minutes',
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index qr_tokens_customer_idx on public.qr_tokens(customer_id, created_at desc);
grant select on public.qr_tokens to authenticated;
grant all on public.qr_tokens to service_role;
alter table public.qr_tokens enable row level security;
create policy "qr_tokens_owner_read" on public.qr_tokens for select to authenticated using (customer_id = auth.uid());

-- ============ NOTIFICATIONS ============
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  store_id uuid references public.stores(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  delivered boolean not null default false,
  delivered_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);
create index notifications_customer_idx on public.notifications(customer_id, created_at desc);
grant select on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "notifications_customer_read" on public.notifications for select to authenticated using (customer_id = auth.uid());
create policy "notifications_merchant_read" on public.notifications for select to authenticated using (store_id is not null and public.is_store_owner(store_id));

-- ============ AUDIT LOGS ============
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  store_id uuid references public.stores(id) on delete cascade,
  action text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_store_idx on public.audit_logs(store_id, created_at desc);
grant select on public.audit_logs to authenticated;
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;
create policy "audit_merchant_read" on public.audit_logs for select to authenticated using (store_id is not null and public.is_store_owner(store_id));

-- ============ BUSINESS LOGIC (security definer) ============

-- Issue a short-lived customer QR token
create or replace function public.issue_customer_qr()
returns text language plpgsql security definer set search_path = public as $$
declare v_token text;
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED'; end if;
  delete from public.qr_tokens where customer_id = auth.uid() and expires_at < now() - interval '1 day';
  insert into public.qr_tokens (customer_id) values (auth.uid()) returning token into v_token;
  return v_token;
end; $$;

-- Preview a store from its join token (public)
create or replace function public.get_store_by_join_token(_token text)
returns table (
  store_id uuid, store_name text, logo_url text, category text, currency text,
  mode public.loyalty_mode, welcome_points integer, welcome_stamps integer,
  stamps_required integer, points_per_currency numeric, already_member boolean
) language sql stable security definer set search_path = public as $$
  select s.id, s.name, s.logo_url, s.category, s.currency,
         p.mode, p.welcome_points, p.welcome_stamps, p.stamps_required, p.points_per_currency,
         exists (select 1 from public.memberships m where m.store_id = s.id and m.customer_id = auth.uid())
  from public.stores s
  join public.loyalty_programs p on p.store_id = s.id and p.is_active
  where s.join_token = _token and s.is_active;
$$;

-- Join a store loyalty program
create or replace function public.join_store(_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_store public.stores; v_prog public.loyalty_programs; v_m public.memberships; v_new boolean := false;
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED'; end if;
  select * into v_store from public.stores where join_token = _token and is_active;
  if v_store.id is null then raise exception 'INVALID_QR'; end if;
  select * into v_prog from public.loyalty_programs where store_id = v_store.id and is_active;
  if v_prog.id is null then raise exception 'NO_PROGRAM'; end if;

  select * into v_m from public.memberships where store_id = v_store.id and customer_id = auth.uid();
  if v_m.id is null then
    insert into public.memberships (store_id, customer_id) values (v_store.id, auth.uid()) returning * into v_m;
    v_new := true;
  end if;

  if v_new and not v_m.welcome_granted and (v_prog.welcome_points > 0 or v_prog.welcome_stamps > 0) then
    update public.memberships set
      welcome_granted = true,
      points_balance = points_balance + v_prog.welcome_points,
      stamps_balance = stamps_balance + v_prog.welcome_stamps,
      lifetime_points = lifetime_points + v_prog.welcome_points,
      lifetime_stamps = lifetime_stamps + v_prog.welcome_stamps,
      last_activity_at = now()
    where id = v_m.id returning * into v_m;

    insert into public.transactions (store_id, membership_id, customer_id, type, points_delta, stamps_delta, actor_id)
    values (v_store.id, v_m.id, auth.uid(), 'welcome_bonus', v_prog.welcome_points, v_prog.welcome_stamps, auth.uid());
  elsif v_new then
    update public.memberships set welcome_granted = true where id = v_m.id returning * into v_m;
  end if;

  if v_new then
    insert into public.notifications (customer_id, store_id, event_type, payload)
    values (auth.uid(), v_store.id, 'joined_store', jsonb_build_object(
      'store_name', v_store.name, 'points', v_prog.welcome_points, 'stamps', v_prog.welcome_stamps));
  end if;

  return jsonb_build_object('membership_id', v_m.id, 'store_id', v_store.id, 'store_name', v_store.name,
    'already_member', not v_new, 'welcome_points', case when v_new then v_prog.welcome_points else 0 end,
    'welcome_stamps', case when v_new then v_prog.welcome_stamps else 0 end,
    'points_balance', v_m.points_balance, 'stamps_balance', v_m.stamps_balance);
end; $$;

-- Merchant: look up a customer by their QR token
create or replace function public.lookup_customer_qr(_token text, _store_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_q public.qr_tokens; v_p public.profiles; v_m public.memberships; v_prog public.loyalty_programs;
begin
  if not public.is_store_owner(_store_id) then raise exception 'UNAUTHORIZED_STORE'; end if;
  select * into v_q from public.qr_tokens where token = _token and kind = 'customer';
  if v_q.id is null then raise exception 'INVALID_QR'; end if;
  if v_q.expires_at < now() then raise exception 'EXPIRED_QR'; end if;
  select * into v_p from public.profiles where id = v_q.customer_id;
  select * into v_m from public.memberships where store_id = _store_id and customer_id = v_q.customer_id;
  select * into v_prog from public.loyalty_programs where store_id = _store_id and is_active;
  return jsonb_build_object(
    'customer_id', v_p.id, 'customer_name', v_p.full_name, 'avatar_url', v_p.avatar_url,
    'is_member', v_m.id is not null, 'membership_id', v_m.id,
    'points_balance', coalesce(v_m.points_balance,0), 'stamps_balance', coalesce(v_m.stamps_balance,0),
    'mode', v_prog.mode, 'stamps_required', v_prog.stamps_required, 'points_per_currency', v_prog.points_per_currency);
end; $$;

-- Merchant: award points or a stamp
create or replace function public.award_loyalty(_token text, _store_id uuid, _amount numeric default null, _action text default 'points')
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_q public.qr_tokens; v_m public.memberships; v_prog public.loyalty_programs;
        v_points integer := 0; v_stamps integer := 0; v_notif_id uuid; v_store public.stores; v_unlocked boolean := false;
begin
  if not public.is_store_owner(_store_id) then raise exception 'UNAUTHORIZED_STORE'; end if;
  select * into v_store from public.stores where id = _store_id;
  select * into v_q from public.qr_tokens where token = _token and kind = 'customer';
  if v_q.id is null then raise exception 'INVALID_QR'; end if;
  if v_q.expires_at < now() then raise exception 'EXPIRED_QR'; end if;

  select * into v_prog from public.loyalty_programs where store_id = _store_id and is_active;
  if v_prog.id is null then raise exception 'NO_PROGRAM'; end if;

  select * into v_m from public.memberships where store_id = _store_id and customer_id = v_q.customer_id for update;
  if v_m.id is null then raise exception 'NOT_A_MEMBER'; end if;

  if _action = 'stamp' then
    if v_prog.mode <> 'stamps' then raise exception 'WRONG_MODE'; end if;
    v_stamps := 1;
  else
    if v_prog.mode <> 'points' then raise exception 'WRONG_MODE'; end if;
    if _amount is null or _amount <= 0 then raise exception 'INVALID_AMOUNT'; end if;
    v_points := floor(_amount * v_prog.points_per_currency)::integer;
  end if;

  update public.memberships set
    points_balance = points_balance + v_points,
    stamps_balance = stamps_balance + v_stamps,
    lifetime_points = lifetime_points + v_points,
    lifetime_stamps = lifetime_stamps + v_stamps,
    last_activity_at = now()
  where id = v_m.id returning * into v_m;

  insert into public.transactions (store_id, membership_id, customer_id, type, points_delta, stamps_delta, purchase_amount, actor_id)
  values (_store_id, v_m.id, v_m.customer_id, case when _action='stamp' then 'stamp_earned' else 'points_earned' end,
          v_points, v_stamps, _amount, auth.uid());

  update public.qr_tokens set used_at = now() where id = v_q.id;

  select exists (
    select 1 from public.rewards r where r.store_id = _store_id and r.is_active
      and (r.expires_at is null or r.expires_at > now())
      and ((v_prog.mode = 'points' and r.points_cost is not null and v_m.points_balance >= r.points_cost)
        or (v_prog.mode = 'stamps' and r.stamps_cost is not null and v_m.stamps_balance >= r.stamps_cost))
  ) into v_unlocked;

  insert into public.notifications (customer_id, store_id, event_type, payload)
  values (v_m.customer_id, _store_id,
    case when _action='stamp' then 'stamp_earned' else 'points_earned' end,
    jsonb_build_object('store_name', v_store.name, 'points', v_points, 'stamps', v_stamps,
      'points_balance', v_m.points_balance, 'stamps_balance', v_m.stamps_balance,
      'stamps_required', v_prog.stamps_required, 'reward_unlocked', v_unlocked))
  returning id into v_notif_id;

  insert into public.audit_logs (actor_id, store_id, action, meta)
  values (auth.uid(), _store_id, 'award_loyalty', jsonb_build_object('membership_id', v_m.id, 'points', v_points, 'stamps', v_stamps));

  return jsonb_build_object('membership_id', v_m.id, 'points_awarded', v_points, 'stamps_awarded', v_stamps,
    'points_balance', v_m.points_balance, 'stamps_balance', v_m.stamps_balance,
    'reward_unlocked', v_unlocked, 'notification_id', v_notif_id);
end; $$;

-- Customer: redeem a reward -> creates a pending redemption with a one-time token
create or replace function public.redeem_reward(_membership_id uuid, _reward_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_m public.memberships; v_r public.rewards; v_prog public.loyalty_programs; v_red public.redemptions; v_store public.stores;
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED'; end if;
  select * into v_m from public.memberships where id = _membership_id for update;
  if v_m.id is null or v_m.customer_id <> auth.uid() then raise exception 'UNAUTHORIZED'; end if;
  select * into v_r from public.rewards where id = _reward_id;
  if v_r.id is null or v_r.store_id <> v_m.store_id then raise exception 'INVALID_REWARD'; end if;
  if not v_r.is_active then raise exception 'REWARD_INACTIVE'; end if;
  if v_r.expires_at is not null and v_r.expires_at < now() then raise exception 'REWARD_EXPIRED'; end if;
  select * into v_prog from public.loyalty_programs where store_id = v_m.store_id and is_active;
  select * into v_store from public.stores where id = v_m.store_id;

  if v_prog.mode = 'points' then
    if v_r.points_cost is null or v_m.points_balance < v_r.points_cost then raise exception 'INSUFFICIENT_BALANCE'; end if;
    update public.memberships set points_balance = points_balance - v_r.points_cost, last_activity_at = now()
      where id = v_m.id returning * into v_m;
    insert into public.redemptions (store_id, membership_id, customer_id, reward_id, points_spent)
      values (v_m.store_id, v_m.id, auth.uid(), v_r.id, v_r.points_cost) returning * into v_red;
    insert into public.transactions (store_id, membership_id, customer_id, type, points_delta, reward_id, actor_id)
      values (v_m.store_id, v_m.id, auth.uid(), 'reward_claimed', -v_r.points_cost, v_r.id, auth.uid());
  else
    if v_r.stamps_cost is null or v_m.stamps_balance < v_r.stamps_cost then raise exception 'INSUFFICIENT_BALANCE'; end if;
    update public.memberships set stamps_balance = stamps_balance - v_r.stamps_cost, last_activity_at = now()
      where id = v_m.id returning * into v_m;
    insert into public.redemptions (store_id, membership_id, customer_id, reward_id, stamps_spent)
      values (v_m.store_id, v_m.id, auth.uid(), v_r.id, v_r.stamps_cost) returning * into v_red;
    insert into public.transactions (store_id, membership_id, customer_id, type, stamps_delta, reward_id, actor_id)
      values (v_m.store_id, v_m.id, auth.uid(), 'reward_claimed', -v_r.stamps_cost, v_r.id, auth.uid());
  end if;

  insert into public.notifications (customer_id, store_id, event_type, payload)
  values (auth.uid(), v_m.store_id, 'reward_unlocked', jsonb_build_object('store_name', v_store.name, 'reward_name', v_r.name));

  return jsonb_build_object('redemption_id', v_red.id, 'token', v_red.token, 'expires_at', v_red.expires_at,
    'reward_name', v_r.name, 'points_balance', v_m.points_balance, 'stamps_balance', v_m.stamps_balance);
end; $$;

-- Merchant: validate a reward QR
create or replace function public.validate_reward_token(_token text, _store_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_red public.redemptions; v_r public.rewards; v_p public.profiles; v_store public.stores;
begin
  if not public.is_store_owner(_store_id) then raise exception 'UNAUTHORIZED_STORE'; end if;
  select * into v_red from public.redemptions where token = _token;
  if v_red.id is null then raise exception 'INVALID_QR'; end if;
  if v_red.store_id <> _store_id then raise exception 'UNAUTHORIZED_STORE'; end if;
  select * into v_r from public.rewards where id = v_red.reward_id;
  select * into v_p from public.profiles where id = v_red.customer_id;
  select * into v_store from public.stores where id = _store_id;
  return jsonb_build_object('redemption_id', v_red.id, 'status', v_red.status,
    'expired', v_red.expires_at < now(), 'reward_name', v_r.name, 'reward_description', v_r.description,
    'customer_name', v_p.full_name, 'store_name', v_store.name, 'redeemed_at', v_red.redeemed_at);
end; $$;

-- Merchant: confirm redemption (single use)
create or replace function public.confirm_redemption(_token text, _store_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_red public.redemptions; v_r public.rewards; v_store public.stores; v_notif_id uuid;
begin
  if not public.is_store_owner(_store_id) then raise exception 'UNAUTHORIZED_STORE'; end if;
  select * into v_red from public.redemptions where token = _token for update;
  if v_red.id is null then raise exception 'INVALID_QR'; end if;
  if v_red.store_id <> _store_id then raise exception 'UNAUTHORIZED_STORE'; end if;
  if v_red.status = 'redeemed' then raise exception 'ALREADY_REDEEMED'; end if;
  if v_red.status <> 'pending' then raise exception 'INVALID_STATUS'; end if;
  if v_red.expires_at < now() then raise exception 'EXPIRED_QR'; end if;

  update public.redemptions set status = 'redeemed', redeemed_at = now(), redeemed_by = auth.uid()
    where id = v_red.id returning * into v_red;
  select * into v_r from public.rewards where id = v_red.reward_id;
  select * into v_store from public.stores where id = _store_id;

  insert into public.transactions (store_id, membership_id, customer_id, type, reward_id, actor_id, note)
  values (_store_id, v_red.membership_id, v_red.customer_id, 'reward_redeemed', v_r.id, auth.uid(), v_r.name);

  update public.memberships set last_activity_at = now() where id = v_red.membership_id;

  insert into public.notifications (customer_id, store_id, event_type, payload)
  values (v_red.customer_id, _store_id, 'reward_redeemed', jsonb_build_object('store_name', v_store.name, 'reward_name', v_r.name))
  returning id into v_notif_id;

  insert into public.audit_logs (actor_id, store_id, action, meta)
  values (auth.uid(), _store_id, 'confirm_redemption', jsonb_build_object('redemption_id', v_red.id));

  return jsonb_build_object('redemption_id', v_red.id, 'status', v_red.status, 'reward_name', v_r.name, 'notification_id', v_notif_id);
end; $$;

-- Merchant dashboard stats
create or replace function public.store_stats(_store_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.is_store_owner(_store_id) then raise exception 'UNAUTHORIZED_STORE'; end if;
  select jsonb_build_object(
    'total_members', (select count(*) from public.memberships where store_id = _store_id),
    'active_members', (select count(*) from public.memberships where store_id = _store_id and last_activity_at > now() - interval '30 days'),
    'points_issued', (select coalesce(sum(points_delta),0) from public.transactions where store_id = _store_id and points_delta > 0),
    'stamps_issued', (select coalesce(sum(stamps_delta),0) from public.transactions where store_id = _store_id and stamps_delta > 0),
    'rewards_redeemed', (select count(*) from public.redemptions where store_id = _store_id and status = 'redeemed')
  ) into v;
  return v;
end; $$;

grant execute on function public.issue_customer_qr() to authenticated;
grant execute on function public.get_store_by_join_token(text) to authenticated, anon;
grant execute on function public.join_store(text) to authenticated;
grant execute on function public.lookup_customer_qr(text, uuid) to authenticated;
grant execute on function public.award_loyalty(text, uuid, numeric, text) to authenticated;
grant execute on function public.redeem_reward(uuid, uuid) to authenticated;
grant execute on function public.validate_reward_token(text, uuid) to authenticated;
grant execute on function public.confirm_redemption(text, uuid) to authenticated;
grant execute on function public.store_stats(uuid) to authenticated;
