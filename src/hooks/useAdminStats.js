import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useAdminStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const sete = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const trinta = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      const [
        { count: totalLeads },
        { count: totalAgendas },
        { count: propostasAgenda },
        { data: leadsRecentes7 },
        { data: leadsRecentes30 },
        { data: leadsPorCidade },
        { data: leadsPorIntencao },
        { data: ultimosLeads },
      ] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }),
        supabase.from('agendas').select('*', { count: 'exact', head: true }).eq('publicado', true),
        supabase.from('propostas_agenda').select('*', { count: 'exact', head: true }).eq('status', 'pendente'),
        supabase.from('leads').select('created_at').gte('created_at', sete).order('created_at'),
        supabase.from('leads').select('created_at').gte('created_at', trinta).order('created_at'),
        supabase.from('leads').select('cidade').not('cidade', 'is', null),
        supabase.from('leads').select('intencao'),
        supabase.from('leads').select('nome, cidade, uf, intencao, created_at').order('created_at', { ascending: false }).limit(5),
      ])

      // leads por dia — últimos 7 dias
      const porDia = {}
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        porDia[d.toISOString().slice(0, 10)] = 0
      }
      ;(leadsRecentes7 ?? []).forEach(l => {
        const key = l.created_at.slice(0, 10)
        if (key in porDia) porDia[key]++
      })

      // leads por dia — últimos 30 dias
      const porDia30 = {}
      for (let i = 29; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        porDia30[d.toISOString().slice(0, 10)] = 0
      }
      ;(leadsRecentes30 ?? []).forEach(l => {
        const key = l.created_at.slice(0, 10)
        if (key in porDia30) porDia30[key]++
      })

      // top cidades
      const cidadeMap = {}
      ;(leadsPorCidade ?? []).forEach(l => {
        const c = l.cidade || 'Não informado'
        cidadeMap[c] = (cidadeMap[c] || 0) + 1
      })
      const topCidades = Object.entries(cidadeMap).sort((a, b) => b[1] - a[1]).slice(0, 7)

      // por intenção
      const intencaoMap = { participar: 0, convidar: 0 }
      ;(leadsPorIntencao ?? []).forEach(l => {
        if (l.intencao in intencaoMap) intencaoMap[l.intencao]++
      })

      setStats({
        totalLeads,
        totalAgendas,
        propostasAgenda,
        leads7dias: (leadsRecentes7 ?? []).length,
        leads30dias: (leadsRecentes30 ?? []).length,
        porDia,
        porDia30,
        topCidades,
        intencaoMap,
        ultimosLeads: ultimosLeads ?? [],
      })
      setLoading(false)
    }

    fetch()
  }, [])

  return { stats, loading }
}
