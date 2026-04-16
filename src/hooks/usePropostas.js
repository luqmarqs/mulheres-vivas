import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { normalizePhoneBR } from '../utils/phone'
import { upsertLead } from '../lib/leads'

// ---- Inserções públicas ----

export async function insertPropostaAgenda(form) {
  const telefone = normalizePhoneBR(form.telefone)

  const [{ error }] = await Promise.all([
    supabase.from('propostas_agenda').insert({
      nome: form.nome,
      telefone,
      email: form.email || null,
      cidade: form.cidade || null,
      uf: form.uf || null,
      mensagem: form.mensagem || null,
      status: 'pendente',
    }),
    upsertLead(form, 'convidar'),
  ])
  return { error: error?.message ?? null }
}

// ---- Hooks admin ----

function usePropostas(tabela, { search = '', status = '' } = {}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    let query = supabase.from(tabela).select('*').order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)
    if (search) query = query.or(`nome.ilike.%${search}%,cidade.ilike.%${search}%`)

    const { data, error } = await query
    if (error) setError(error.message)
    else setItems(data ?? [])
    setLoading(false)
  }, [tabela, search, status])

  useEffect(() => { fetch() }, [fetch])

  async function atualizarStatus(id, novoStatus, observacao = '') {
    const { error } = await supabase
      .from(tabela)
      .update({ status: novoStatus, observacao: observacao || null })
      .eq('id', id)
    if (!error) await fetch()
    return error?.message ?? null
  }

  async function remover(id) {
    await supabase.from(tabela).delete().eq('id', id)
    await fetch()
  }

  return { items, loading, error, atualizarStatus, remover, refetch: fetch }
}

export function usePropostasAgenda(filtros) {
  return usePropostas('propostas_agenda', filtros)
}
