-- ============================================================
-- MIGRATION: Remove toda a lógica de comitês
-- Rodar no SQL Editor do Supabase
-- ============================================================

-- 1. Remover índices dependentes de comite_id e comites
drop index if exists leads_comite_idx;
drop index if exists comites_cidade_idx;

-- 2. Remover coluna comite_id de leads
--    (a foreign key constraint é derrubada junto com o drop column)
alter table leads drop column if exists comite_id;

-- 3. Atualizar leads com intencao 'organizar' para 'participar'
update leads set intencao = 'participar' where intencao = 'organizar';

-- 4. Atualizar leads com origem 'form_comite' para 'form_agenda'
update leads set origem = 'form_agenda' where origem = 'form_comite';

-- 5. Remover tabela membros_comite (tem FK para comites)
drop table if exists membros_comite cascade;

-- 6. Remover tabela propostas_comite
drop table if exists propostas_comite cascade;

-- 7. Remover tabela comites (por último, após remover dependências)
drop table if exists comites cascade;
