import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useAdmins() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAdmins = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .order('created_at')
    if (error) setError(error.message)
    else setAdmins(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAdmins() }, [fetchAdmins])

  async function adicionarAdmin(email, nome) {
    const { error } = await supabase.from('admins').insert({ email: email.toLowerCase().trim(), nome: nome.trim() || null })
    if (error) return error.message
    await fetchAdmins()
    return null
  }

  async function removerAdmin(id, emailAtual) {
    // Impede auto-remoção
    const admin = admins.find(a => a.id === id)
    if (admin?.email === emailAtual) return 'Você não pode remover a si mesmo.'
    if (admins.length <= 1) return 'Deve existir pelo menos um admin.'
    const { error } = await supabase.from('admins').delete().eq('id', id)
    if (error) return error.message
    await fetchAdmins()
    return null
  }

  return { admins, loading, error, adicionarAdmin, removerAdmin }
}

export async function isAdmin(email) {
  if (!email) return false
  const { data } = await supabase
    .from('admins')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle()
  return Boolean(data)
}
