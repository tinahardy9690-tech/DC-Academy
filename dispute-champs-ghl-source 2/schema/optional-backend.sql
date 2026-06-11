-- Optional permanent storage model.
-- The GoHighLevel-ready build works without this database.

create table if not exists letter_templates (
  id uuid primary key default gen_random_uuid(),
  template_name text not null,
  template_category text not null,
  template_description text not null default '',
  template_body text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bureau_addresses (
  id uuid primary key default gen_random_uuid(),
  bureau text not null check (bureau in ('Experian', 'TransUnion', 'Equifax')),
  department text not null,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  state text not null,
  zip text not null,
  is_active boolean not null default true
);

create table if not exists generated_letters (
  id uuid primary key default gen_random_uuid(),
  client_id text not null,
  template_id uuid references letter_templates(id) on delete set null,
  bureau_address_id uuid references bureau_addresses(id) on delete set null,
  generated_content text not null,
  pdf_url text,
  created_at timestamptz not null default now()
);

create index if not exists generated_letters_client_id_idx
  on generated_letters(client_id);

create index if not exists letter_templates_active_category_idx
  on letter_templates(is_active, template_category);
