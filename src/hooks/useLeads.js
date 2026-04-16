import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { insertLead as _insertLead } from '../lib/leads'

export function useLeads({ search = '', cidade = '', intencao = '' } = {}) {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    setError(null)

    let query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })

    if (search) {
      query = query.or(`nome.ilike.%${search}%,email.ilike.%${search}%,telefone.ilike.%${search}%`)
    }
    if (cidade) query = query.ilike('cidade', `%${cidade}%`)
    if (intencao) query = query.eq('intencao', intencao)

    const { data, error } = await query
    if (error) setError(error.message)
    else setLeads(data ?? [])

    setLoading(false)
  }, [search, cidade, intencao])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  return { leads, loading, error, refetch: fetchLeads }
}

export { _insertLead as insertLead }
