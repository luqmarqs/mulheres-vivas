import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

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
    .eq('telefone', lead.telefone.replace(/\D/g, ''))
    .maybeSingle()

  if (existente) return { error: 'Telefone já cadastrado.' }

  const { error } = await supabase.from('leads').insert({
    ...lead,
    telefone: lead.telefone.replace(/\D/g, ''),
    comite_id,
    origem: lead.origem ?? 'form_abaixo_assinado',
  })

  return { error: error?.message ?? null }
}

export async function insertComiteELead(form) {
  // Criar comitê
  const { data: comite, error: errComite } = await supabase
    .from('comites')
    .insert({
      nome: `Comitê Mulheres Vivas — ${form.cidade}`,
      cidade: form.cidade,
      estado: form.uf,
      responsavel_nome: form.nome,
      responsavel_telefone: form.telefone.replace(/\D/g, ''),
      whatsapp_link: form.whatsapp_link ?? null,
      ativo: true,
    })
    .select('id')
    .single()

  if (errComite) return { error: errComite.message }

  // Inserir coordenador em membros_comite
  await supabase.from('membros_comite').insert({
    nome: form.nome,
    telefone: form.telefone.replace(/\D/g, ''),
    email: form.email,
    comite_id: comite.id,
    papel: 'coordenador',
  })

  // Inserir lead
  const { error: errLead } = await supabase.from('leads').insert({
    nome: form.nome,
    telefone: form.telefone.replace(/\D/g, ''),
    email: form.email,
    cidade: form.cidade,
    uf: form.uf,
    nascimento: form.nascimento || null,
    comite_id: comite.id,
    intencao: 'organizar',
    novidades: form.novidades,
  })

  return { error: errLead?.message ?? null, comite_id: comite.id }
}
