import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { normalizePhoneBR } from '../utils/phone'

export function useLeads({ search = '', cidade = '', comiteId = '', intencao = '' } = {}) {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    setError(null)

    let query = supabase
      .from('leads')
      .select('*, comites(nome, cidade)')
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`nome.ilike.%${search}%,email.ilike.%${search}%,telefone.ilike.%${search}%`)
    }
    if (cidade) query = query.ilike('cidade', `%${cidade}%`)
    if (comiteId) query = query.eq('comite_id', comiteId)
    if (intencao) query = query.eq('intencao', intencao)

    const { data, error } = await query
    if (error) setError(error.message)
    else setLeads(data ?? [])

    setLoading(false)
  }, [search, cidade, comiteId, intencao])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  return { leads, loading, error, refetch: fetchLeads }
}

export async function insertLead(lead) {
  const telefone = normalizePhoneBR(lead.telefone)

  // Associar comitê automaticamente pela cidade
  let comite_id = null
  if (lead.cidade) {
    const { data } = await supabase
      .from('comites')
      .select('id')
      .ilike('cidade', lead.cidade)
      .eq('ativo', true)
      .limit(1)
      .maybeSingle()
    comite_id = data?.id ?? null
  }

  // Evitar duplicidade por telefone
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

  return { error: error?.message ?? null }
}
