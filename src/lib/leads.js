import { supabase } from './supabase'
import { normalizePhoneBR } from '../utils/phone'

/**
 * Insere um lead evitando duplicidade por telefone.
 * Retorna { error: string | null }
 */
export async function insertLead(lead) {
  const telefone = normalizePhoneBR(lead.telefone)

  const { data: existente } = await supabase
    .from('leads')
    .select('id')
    .eq('telefone', telefone)
    .maybeSingle()

  if (existente) return { error: 'Telefone já cadastrado.' }

  const { error } = await supabase.from('leads').insert({
    ...lead,
    telefone,
    origem: lead.origem ?? 'form_abaixo_assinado',
  })

  // trata unique constraint caso race condition vença o check acima
  if (error?.code === '23505') return { error: 'Telefone já cadastrado.' }
  return { error: error?.message ?? null }
}

const RANK_INTENCAO = { convidar: 2, participar: 1 }

/**
 * Insere ou atualiza um lead.
 * Se já existir, sobe a intenção se a nova for mais relevante.
 */
export async function upsertLead(form, intencao) {
  const telefone = normalizePhoneBR(form.telefone)

  const { data: existente } = await supabase
    .from('leads')
    .select('id, intencao')
    .eq('telefone', telefone)
    .maybeSingle()

  if (existente) {
    if ((RANK_INTENCAO[intencao] ?? 0) > (RANK_INTENCAO[existente.intencao] ?? 0)) {
      await supabase.from('leads').update({ intencao }).eq('id', existente.id)
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
    intencao,
    novidades: form.novidades ?? true,
    origem: 'form_agenda',
  })
}
