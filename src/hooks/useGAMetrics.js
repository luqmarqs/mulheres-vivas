import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Extrai o valor de uma métrica do row da GA4 Data API
function metricVal(row, index = 0) {
  return row?.metricValues?.[index]?.value ?? '0'
}

// Converte data GA4 "YYYYMMDD" → "DD/MM"
function formatDate(yyyymmdd) {
  return `${yyyymmdd.slice(6, 8)}/${yyyymmdd.slice(4, 6)}`
}

function parseResumo(report) {
  const row = report?.rows?.[0]
  if (!row) return null
  return {
    sessions:         parseInt(metricVal(row, 0)),
    activeUsers:      parseInt(metricVal(row, 1)),
    pageViews:        parseInt(metricVal(row, 2)),
    bounceRate:       parseFloat(metricVal(row, 3) * 100).toFixed(1),
    avgSessionSec:    Math.round(parseFloat(metricVal(row, 4))),
  }
}

function parsePorDia(report) {
  return (report?.rows ?? []).map(row => ({
    date:        formatDate(row.dimensionValues[0].value),
    sessions:    parseInt(metricVal(row, 0)),
    activeUsers: parseInt(metricVal(row, 1)),
  }))
}

function parsePorPagina(report) {
  return (report?.rows ?? []).map(row => ({
    path:      row.dimensionValues[0].value,
    pageViews: parseInt(metricVal(row, 0)),
  }))
}

function parsePorDispositivo(report) {
  return (report?.rows ?? []).map(row => ({
    device:   row.dimensionValues[0].value,
    sessions: parseInt(metricVal(row, 0)),
  }))
}

export function useGAMetrics() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setError('Não autenticado'); setLoading(false); return }

      const res = await supabase.functions.invoke('ga-metrics', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (res.error) {
        const detail = res.data?.error ?? res.error.message
        setError(detail)
        setLoading(false)
        return
      }

      const raw = res.data
      setData({
        resumo7:        parseResumo(raw.resumo7),
        resumo30:       parseResumo(raw.resumo30),
        porDia:         parsePorDia(raw.porDia),
        porPagina:      parsePorPagina(raw.porPagina),
        porDispositivo: parsePorDispositivo(raw.porDispositivo),
      })
      setLoading(false)
    }

    fetch()
  }, [])

  return { data, loading, error }
}
