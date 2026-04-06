-- ============================================================
-- MULHERES VIVAS — Bancada Feminista do PSOL
-- Schema Supabase
-- ============================================================

-- COMITÊS (criado antes, leads referencia)
create table if not exists comites (
  id                   uuid primary key default gen_random_uuid(),
  nome                 text not null,
  cidade               text not null,
  estado               text,
  responsavel_nome     text,
  responsavel_telefone text,
  whatsapp_link        text,
  ativo                boolean default true,
  created_at           timestamptz default now()
);

-- LEADS
create table if not exists leads (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  telefone   text not null,
  email      text,
  cidade     text,
  uf         text,
  nascimento date,
  comite_id  uuid references comites(id),
  intencao   text default 'participar', -- 'participar' | 'organizar'
  novidades  boolean default true,
  created_at timestamptz default now()
);

-- MEMBROS DOS COMITÊS
create table if not exists membros_comite (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  telefone   text,
  email      text,
  comite_id  uuid references comites(id) on delete cascade,
  papel      text default 'membro',     -- 'coordenador' | 'membro'
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table leads          enable row level security;
alter table comites        enable row level security;
alter table membros_comite enable row level security;

-- LEADS: inserção pública, leitura/edição autenticada
create policy "leads_insert_public"   on leads for insert with check (true);
create policy "leads_select_auth"     on leads for select using (auth.role() = 'authenticated');
create policy "leads_update_auth"     on leads for update using (auth.role() = 'authenticated');
create policy "leads_delete_auth"     on leads for delete using (auth.role() = 'authenticated');

-- COMITÊS: leitura pública, escrita autenticada
-- (inserção é liberada para o formulário público criar comitê)
create policy "comites_select_public" on comites for select using (true);
create policy "comites_insert_public" on comites for insert with check (true);
create policy "comites_update_auth"   on comites for update using (auth.role() = 'authenticated');
create policy "comites_delete_auth"   on comites for delete using (auth.role() = 'authenticated');

-- MEMBROS: inserção pública (coordenador criado pelo form), resto autenticado
create policy "membros_select_auth"   on membros_comite for select using (auth.role() = 'authenticated');
create policy "membros_insert_public" on membros_comite for insert with check (true);
create policy "membros_update_auth"   on membros_comite for update using (auth.role() = 'authenticated');
create policy "membros_delete_auth"   on membros_comite for delete using (auth.role() = 'authenticated');

-- PROPOSTAS DE COMITÊ
create table if not exists propostas_comite (
  id             uuid primary key default gen_random_uuid(),
  nome           text not null,
  telefone       text not null,
  email          text,
  cidade         text,
  uf             text,
  whatsapp_link  text,
  status         text default 'pendente', -- 'pendente' | 'aprovado' | 'recusado'
  observacao     text,
  created_at     timestamptz default now()
);

alter table propostas_comite enable row level security;
create policy "propostas_comite_insert_public" on propostas_comite for insert with check (true);
create policy "propostas_comite_select_auth"   on propostas_comite for select using (auth.role() = 'authenticated');
create policy "propostas_comite_update_auth"   on propostas_comite for update using (auth.role() = 'authenticated');
create policy "propostas_comite_delete_auth"   on propostas_comite for delete using (auth.role() = 'authenticated');

-- PROPOSTAS DE AGENDA
create table if not exists propostas_agenda (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  telefone   text not null,
  email      text,
  cidade     text,
  uf         text,
  mensagem   text,
  status     text default 'pendente', -- 'pendente' | 'confirmado' | 'recusado'
  observacao text,
  created_at timestamptz default now()
);

alter table propostas_agenda enable row level security;
create policy "propostas_agenda_insert_public" on propostas_agenda for insert with check (true);
create policy "propostas_agenda_select_auth"   on propostas_agenda for select using (auth.role() = 'authenticated');
create policy "propostas_agenda_update_auth"   on propostas_agenda for update using (auth.role() = 'authenticated');
create policy "propostas_agenda_delete_auth"   on propostas_agenda for delete using (auth.role() = 'authenticated');

-- ADMINS
create table if not exists admins (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  nome       text,
  created_at timestamptz default now()
);

alter table admins enable row level security;

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
create index if not exists leads_comite_idx     on leads (comite_id);
create index if not exists comites_cidade_idx   on comites (cidade);
