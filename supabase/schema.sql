-- ============================================================
--  ร้านนักเรียนไอที — ระบบเอกสาร (Quotation / Receipt)
--  Schema สำหรับ Supabase (PostgreSQL)
--  รันไฟล์นี้ใน Supabase Dashboard > SQL Editor
-- ============================================================

-- ---------- 1. ตั้งค่าร้าน (มีแถวเดียว) ----------
create table if not exists public.shop_settings (
  id            int primary key default 1,
  name          text not null default 'ร้านนักเรียนไอที',
  tagline       text default '',
  address       text default '',
  phone         text default '',
  email         text default '',
  line_id       text default '',
  tax_id        text default '',
  logo_url      text default '/logo.png',
  accent_color  text not null default '#f6c145',   -- สีแถบบนเอกสาร (เหลืองทองตามโลโก้)
  bank_name     text default '',
  bank_account  text default '',
  bank_holder   text default '',
  promptpay     text default '',
  quotation_terms text default '',
  receipt_note    text default '',
  updated_at    timestamptz not null default now(),
  constraint shop_settings_singleton check (id = 1)
);

insert into public.shop_settings (id) values (1) on conflict (id) do nothing;

-- ---------- 2. ลูกค้า ----------
create table if not exists public.customers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  company     text default '',
  phone       text default '',
  email       text default '',
  address     text default '',
  tax_id      text default '',
  note        text default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists customers_name_idx on public.customers (name);

-- ---------- 3. สินค้า / บริการที่ใช้บ่อย ----------
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text default '',
  unit        text default 'ชิ้น',
  unit_price  numeric(12,2) not null default 0,
  category    text default '',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists products_active_idx on public.products (is_active, name);

-- ---------- 4. เอกสาร (ใบเสนอราคา / ใบเสร็จรับเงิน) ----------
do $$ begin
  create type public.doc_type as enum ('quotation', 'receipt');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.doc_status as enum ('draft', 'sent', 'accepted', 'rejected', 'paid', 'cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.documents (
  id                 uuid primary key default gen_random_uuid(),
  doc_type           public.doc_type not null,
  doc_number         text not null unique,
  status             public.doc_status not null default 'draft',

  issue_date         date not null default current_date,
  valid_until        date,                    -- ใบเสนอราคา: ยืนราคาถึงวันที่

  -- snapshot ข้อมูลลูกค้า ณ วันที่ออกเอกสาร (ไม่เปลี่ยนตามการแก้ทะเบียนลูกค้า)
  customer_id        uuid references public.customers(id) on delete set null,
  customer_name      text not null default '',
  customer_company   text default '',
  customer_phone     text default '',
  customer_email     text default '',
  customer_address   text default '',
  customer_tax_id    text default '',

  subtotal           numeric(12,2) not null default 0,
  discount           numeric(12,2) not null default 0,
  total              numeric(12,2) not null default 0,

  -- เฉพาะใบเสร็จ
  payment_method     text default '',          -- เงินสด / โอน / พร้อมเพย์ ฯลฯ
  paid_at            date,
  source_document_id uuid references public.documents(id) on delete set null, -- ใบเสนอราคาต้นทาง

  notes              text default '',
  terms              text default '',

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists documents_type_date_idx on public.documents (doc_type, issue_date desc);
create index if not exists documents_customer_idx  on public.documents (customer_id);
create index if not exists documents_number_idx    on public.documents (doc_number);

-- ---------- 5. รายการในเอกสาร ----------
create table if not exists public.document_items (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid not null references public.documents(id) on delete cascade,
  position     int  not null default 0,
  description  text not null default '',
  detail       text default '',
  unit         text default '',
  quantity     numeric(12,2) not null default 1,
  unit_price   numeric(12,2) not null default 0,
  amount       numeric(12,2) not null default 0
);

create index if not exists document_items_doc_idx on public.document_items (document_id, position);

-- ---------- 6. เลขที่เอกสารอัตโนมัติ (กันชนกัน) ----------
create table if not exists public.document_counters (
  doc_type  public.doc_type not null,
  year      int not null,
  last_no   int not null default 0,
  primary key (doc_type, year)
);

-- คืนค่าเลขถัดไป เช่น QT-2026-0001 / RC-2026-0001
create or replace function public.next_doc_number(p_type public.doc_type)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year   int := extract(year from current_date)::int;
  v_next   int;
  v_prefix text := case p_type when 'quotation' then 'QT' else 'RC' end;
begin
  insert into public.document_counters (doc_type, year, last_no)
  values (p_type, v_year, 1)
  on conflict (doc_type, year)
  do update set last_no = public.document_counters.last_no + 1
  returning last_no into v_next;

  return v_prefix || '-' || v_year::text || '-' || lpad(v_next::text, 4, '0');
end;
$$;

-- ---------- 7. updated_at อัตโนมัติ ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists customers_touch on public.customers;
create trigger customers_touch before update on public.customers
  for each row execute function public.touch_updated_at();

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

drop trigger if exists documents_touch on public.documents;
create trigger documents_touch before update on public.documents
  for each row execute function public.touch_updated_at();

drop trigger if exists shop_settings_touch on public.shop_settings;
create trigger shop_settings_touch before update on public.shop_settings
  for each row execute function public.touch_updated_at();

-- ---------- 8. migration สำหรับฐานข้อมูลที่สร้างไว้ก่อนหน้า ----------
-- create table if not exists ข้างบนจะข้ามตารางที่มีอยู่แล้ว คอลัมน์ที่เพิ่มทีหลัง
-- จึงต้องมาต่อท้ายตรงนี้ (รันซ้ำได้ ไม่มีผลข้างเคียง)
alter table public.shop_settings
  add column if not exists accent_color text not null default '#f6c145';
