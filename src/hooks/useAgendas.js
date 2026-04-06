import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useAgendasSemana() {
  const [agendas, setAgendas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)

      const fimSemana = new Date(hoje)
      fimSemana.setDate(hoje.getDate() + 7)

      const { data } = await supabase
        .from('agendas')
        .select('*')
        .gte('data', hoje.toISOString().slice(0, 10))
        .lte('data', fimSemana.toISOString().slice(0, 10))
        .eq('publicado', true)
        .order('data')
        .order('hora')

      setAgendas(data ?? [])
      setLoading(false)
    }
    fetch()
  }, [])

  return { agendas, loading }
}

export function useAgendasAdmin({ search = '' } = {}) {
  const [agendas, setAgendas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAgendas = useCallback(async () => {
    setLoading(true)
    setError(null)

    let query = supabase
      .from('agendas')
      .select('*')
      .order('data', { ascending: false })
      .order('hora')

    if (search) query = query.ilike('titulo', `%${search}%`)

    const { data, error } = await query
    if (error) setError(error.message)
    else setAgendas(data ?? [])
    setLoading(false)
  }, [search])

  useEffect(() => { fetchAgendas() }, [fetchAgendas])

  async function togglePublicado(id, atual) {
    await supabase.from('agendas').update({ publicado: !atual }).eq('id', id)
    fetchAgendas()
  }

  async function remover(id, imagemUrl) {
    // Remove imagem do storage se existir
    if (imagemUrl) {
      const path = imagemUrl.split('/agendas/')[1]
      if (path) await supabase.storage.from('agendas').remove([path])
    }
    await supabase.from('agendas').delete().eq('id', id)
    fetchAgendas()
  }

  async function salvar(form, imagemFile, editandoId = null) {
    let imagem_url = form.imagem_url ?? null

    if (imagemFile) {
      const ext = imagemFile.name.split('.').pop()
      const path = `${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('agendas')
        .upload(path, imagemFile, { upsert: true })

      if (uploadError) return uploadError.message

      const { data: urlData } = supabase.storage.from('agendas').getPublicUrl(path)
      imagem_url = urlData.publicUrl
    }

    const payload = {
      titulo: form.titulo,
      data: form.data,
      hora: form.hora || null,
      local_nome: form.local_nome || null,
      local_endereco: form.local_endereco || null,
      local_maps_url: form.local_maps_url || null,
      local_place_id: form.local_place_id || null,
      descricao: form.descricao || null,
      imagem_url,
      publicado: form.publicado ?? false,
    }

    if (editandoId) {
      const { error } = await supabase.from('agendas').update(payload).eq('id', editandoId)
      if (error) return error.message
    } else {
      const { error } = await supabase.from('agendas').insert(payload)
      if (error) return error.message
    }

    fetchAgendas()
    return null
  }

  return { agendas, loading, error, togglePublicado, remover, salvar }
}
