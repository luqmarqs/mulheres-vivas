import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { normalizePhoneBR } from '../utils/phone'

export function useComites({ search = '', apenasAtivos = true } = {}) {
  const [comites, setComites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchComites = useCallback(async () => {
    setLoading(true)
    setError(null)

    let query = supabase
      .from('comites')
      .select('*, membros_comite(count)')
      .order('created_at', { ascending: false })

    if (apenasAtivos) query = query.eq('ativo', true)
    if (search) query = query.ilike('cidade', `%${search}%`)

    const { data, error } = await query
    if (error) setError(error.message)
    else setComites(data ?? [])

    setLoading(false)
  }, [search, apenasAtivos])

  useEffect(() => { fetchComites() }, [fetchComites])

  async function criar(form) {
    const responsavelTelefone = normalizePhoneBR(form.responsavel_telefone)
    const telefoneValido = responsavelTelefone.length === 10 || responsavelTelefone.length === 11

    const { data: comite, error } = await supabase.from('comites').insert({
      nome: form.nome,
      cidade: form.cidade || null,
      estado: form.estado || null,
      responsavel_nome: form.responsavel_nome || null,
      responsavel_telefone: responsavelTelefone || null,
      whatsapp_link: form.whatsapp_link || null,
      ativo: form.ativo ?? true,
    }).select('id').single()
    if (error) return error.message

    if (telefoneValido) {
      const { data: lead } = await supabase
        .from('leads')
        .select('nome, email, telefone')
        .eq('telefone', responsavelTelefone)
        .maybeSingle()

      const nomeMembro = lead?.nome || form.responsavel_nome || null

      if (nomeMembro) {
        const { error: membroError } = await supabase.from('membros_comite').insert({
          comite_id: comite.id,
          nome: nomeMembro,
          telefone: responsavelTelefone,
          email: lead?.email || null,
          papel: 'coordenadora',
        })

        if (membroError) return membroError.message
      }
    }

    fetchComites()
    return null
  }

  return { comites, loading, error, refetch: fetchComites, criar }
}

export function useComiteDetalhe(id) {
  const [comite, setComite] = useState(null)
  const [membros, setMembros] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchMembros = useCallback(async () => {
    const [{ data: membrosData }, { data: leadsData }] = await Promise.all([
      supabase
        .from('membros_comite')
        .select('*')
        .eq('comite_id', id)
        .order('papel'),
      supabase
        .from('leads')
        .select('id, nome, telefone, email, intencao, created_at')
        .eq('comite_id', id)
        .eq('intencao', 'organizar')
        .order('created_at', { ascending: true }),
    ])

    const membrosPersistidos = (membrosData ?? []).map((membro) => ({
      ...membro,
      origem_membro: 'membros_comite',
    }))

    const chavesExistentes = new Set(
      membrosPersistidos.map((membro) => `${membro.telefone || ''}|${(membro.email || '').toLowerCase()}`)
    )

    const membrosDerivados = (leadsData ?? [])
      .filter((lead) => !chavesExistentes.has(`${lead.telefone || ''}|${(lead.email || '').toLowerCase()}`))
      .map((lead) => ({
        id: `lead-${lead.id}`,
        nome: lead.nome,
        telefone: lead.telefone,
        email: lead.email,
        papel: 'coordenadora',
        origem_membro: 'lead',
      }))

    setMembros([...membrosPersistidos, ...membrosDerivados])
  }, [id])

  useEffect(() => {
    if (!id) return
    async function fetch() {
      setLoading(true)
      const [{ data: c }] = await Promise.all([
        supabase.from('comites').select('*').eq('id', id).single(),
      ])
      setComite(c)
      await fetchMembros()
      setLoading(false)
    }
    fetch()
  }, [id, fetchMembros])

  async function adicionarMembro({ nome, telefone, email, papel }) {
    const { error } = await supabase.from('membros_comite').insert({
      comite_id: id, nome, telefone: normalizePhoneBR(telefone), email: email || null, papel,
    })
    if (error) return error.message
    await fetchMembros()
    return null
  }

  async function removerMembro(membroId) {
    await supabase.from('membros_comite').delete().eq('id', membroId)
    await fetchMembros()
  }

  return { comite, membros, loading, adicionarMembro, removerMembro }
}
