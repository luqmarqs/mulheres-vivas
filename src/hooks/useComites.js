import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

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
    const { error } = await supabase.from('comites').insert({
      nome: form.nome,
      cidade: form.cidade || null,
      estado: form.estado || null,
      responsavel_nome: form.responsavel_nome || null,
      responsavel_telefone: form.responsavel_telefone || null,
      whatsapp_link: form.whatsapp_link || null,
      ativo: form.ativo ?? true,
    })
    if (error) return error.message
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
    const { data } = await supabase
      .from('membros_comite')
      .select('*')
      .eq('comite_id', id)
      .order('papel')
    setMembros(data ?? [])
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
      comite_id: id, nome, telefone, email: email || null, papel,
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
