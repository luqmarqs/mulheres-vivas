import { supabase } from './supabase'
import { normalizePhoneBR } from '../utils/phone'

/**
 * Busca o id do comitê ativo para uma cidade, ou null se não existir.
 */
export async function comiteIdPorCidade(cidade) {
  if (!cidade) return null
  const { data } = await supabase
    .from('comites')
    .select('id')
    .ilike('cidade', cidade)
    .eq('ativo', true)
    .limit(1)
    .maybeSingle()
  return data?.id ?? null
}

/**
 * Insere um lead evitando duplicidade por telefone.
 * Retorna { error: string | null }
 */
export async function insertLead(lead) {
  const telefone = normalizePhoneBR(lead.telefone)
  const comite_id = await comiteIdPorCidade(lead.cidade)

  const { data: existente } = await supabase
    .from('leads')
    .select('id')
    .eq('telefone', telefone)
    .maybeSingle()

  if (existente) return { error: 'Telefone já cadastrado.' }

  const { error } = await supabase.from('leads').insert({
    ...lead,
    telefone,
    comite_id,
    origem: lead.origem ?? 'form_abaixo_assinado',
  })

  // trata unique constraint caso race condition vença o check acima
  if (error?.code === '23505') return { error: 'Telefone já cadastrado.' }
  return { error: error?.message ?? null }
}

const RANK_INTENCAO = { organizar: 3, convidar: 2, participar: 1 }

/**
 * Insere ou atualiza um lead.
 * Se já existir, sobe a intenção se a nova for mais relevante.
 */
export async function upsertLead(form, intencao) {
  const telefone = normalizePhoneBR(form.telefone)
  const comite_id = await comiteIdPorCidade(form.cidade)

  const { data: existente } = await supabase
    .from('leads')
    .select('id, intencao')
    .eq('telefone', telefone)
    .maybeSingle()

  if (existente) {
    if ((RANK_INTENCAO[intencao] ?? 0) > (RANK_INTENCAO[existente.intencao] ?? 0)) {
      await supabase.from('leads').update({ intencao, comite_id }).eq('id', existente.id)
    }
    return
  }

  await supabase.from('leads').insert({
    nome: form.nome,
    telefone,
    email: form.email || null,
    cidade: form.cidade || null,
    uf: form.uf || null,
    nascimento: form.nascimento || null,
    comite_id,
    intencao,
    novidades: form.novidades ?? true,
    origem: intencao === 'organizar' ? 'form_comite' : 'form_agenda',
  })
}
