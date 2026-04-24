-- ============================================================
-- MULHERES VIVAS — Bancada Feminista do PSOL
-- Schema Supabase
-- ============================================================

-- LEADS
create table if not exists leads (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null check (char_length(nome) <= 150),
  telefone   text not null check (char_length(telefone) <= 30),
  email      text check (char_length(email) <= 255),
  cidade     text check (char_length(cidade) <= 100),
  uf         text check (char_length(uf) <= 2),
  nascimento date,
  intencao   text default 'participar' check (char_length(intencao) <= 50), -- 'participar' | 'convidar'
  novidades  boolean default true,
  origem     text check (char_length(origem) <= 100),
  created_at timestamptz default now()
);

-- PROPOSTAS DE AGENDA
create table if not exists propostas_agenda (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null check (char_length(nome) <= 150),
  telefone   text not null check (char_length(telefone) <= 30),
  email      text check (char_length(email) <= 255),
  cidade     text check (char_length(cidade) <= 100),
  uf         text check (char_length(uf) <= 2),
  mensagem   text check (char_length(mensagem) <= 2000),
  status     text default 'pendente' check (char_length(status) <= 50), -- 'pendente' | 'confirmado' | 'recusado'
  observacao text check (char_length(observacao) <= 1000),
  created_at timestamptz default now()
);

-- AGENDAS
-- (definida via migration separada ou pelo painel do Supabase)

-- ADMINS
create table if not exists admins (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  nome       text,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table leads          enable row level security;
alter table propostas_agenda enable row level security;
alter table admins         enable row level security;

-- LEADS: inserção pública, leitura/edição autenticada
create policy "leads_insert_public"   on leads for insert with check (true);
create policy "leads_select_auth"     on leads for select using (auth.role() = 'authenticated');
create policy "leads_update_auth"     on leads for update using (auth.role() = 'authenticated');
create policy "leads_delete_auth"     on leads for delete using (auth.role() = 'authenticated');

-- PROPOSTAS DE AGENDA
create policy "propostas_agenda_insert_public" on propostas_agenda for insert with check (true);
create policy "propostas_agenda_select_auth"   on propostas_agenda for select using (auth.role() = 'authenticated');
create policy "propostas_agenda_update_auth"   on propostas_agenda for update using (auth.role() = 'authenticated');
create policy "propostas_agenda_delete_auth"   on propostas_agenda for delete using (auth.role() = 'authenticated');

-- ADMINS
-- Qualquer autenticado pode ler (para checar se é admin)
create policy "admins_select_auth" on admins for select using (auth.role() = 'authenticated');
-- Apenas admins existentes podem inserir/deletar
create policy "admins_insert_auth" on admins for insert with check (
  exists (select 1 from admins where email = auth.email())
);
create policy "admins_delete_auth" on admins for delete using (
  exists (select 1 from admins where email = auth.email())
);

-- ============================================================
-- ÍNDICES
-- ============================================================

create index if not exists leads_cidade_idx     on leads (cidade);
create index if not exists leads_created_at_idx on leads (created_at desc);
