import { useState, useCallback, useRef } from 'react'
import * as XLSX from 'xlsx'
import { useLeads } from '../../hooks/useLeads'
import { formatPhoneBR, toWhatsAppUrl } from '../../utils/phone'

function useDebounce(fn, delay) {
  const timer = useRef(null)
  return useCallback((...args) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => fn(...args), delay)
  }, [fn, delay])
}

function buildRows(leads) {
  return leads.map(l => ({
    Nome: l.nome,
    Telefone: formatPhoneBR(l.telefone),
    Email: l.email ?? '',
    Cidade: l.cidade ?? '',
    UF: l.uf ?? '',
    Origem: l.origem ?? '',
    'Intenção': l.intencao === 'convidar' ? 'Convidar Bancada' : 'Participar',
    Data: new Date(l.created_at).toLocaleDateString('pt-BR'),
  }))
}

function exportCSV(leads) {
  const rows = buildRows(leads)
  const ws = XLSX.utils.json_to_sheet(rows)
  const csv = XLSX.utils.sheet_to_csv(ws)
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function exportExcel(leads) {
  const rows = buildRows(leads)
  const ws = XLSX.utils.json_to_sheet(rows)

  // Larguras das colunas
  ws['!cols'] = [
    { wch: 30 }, { wch: 16 }, { wch: 30 }, { wch: 20 },
    { wch: 6 },  { wch: 18 }, { wch: 22 }, { wch: 12 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Leads')
  XLSX.writeFile(wb, `leads-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

function AdminLeads() {
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [cidade, setCidade] = useState('')
  const [intencao, setIntencao] = useState('')

  const { leads, loading, error, refetch } = useLeads({ search, cidade, intencao })

  const applySearch = useDebounce((val) => setSearch(val), 400)

  return (
    <div className="adm-leads">
      <div className="adm-section-header">
        <h2 className="adm-section-title">Leads</h2>
        <div className="adm-export-btns">
          <button className="adm-btn adm-btn-outline" title="Baixar lista filtrada em CSV (abre no Excel)" onClick={() => exportCSV(leads)}>↓ CSV</button>
          <button className="adm-btn adm-btn-outline" title="Baixar lista filtrada em planilha Excel" onClick={() => exportExcel(leads)}>↓ Excel</button>
        </div>
      </div>
      <p className="adm-section-desc">Todos os contatos que preencheram qualquer aba do formulário do site. Use os filtros para segmentar por nome, cidade ou intenção. O telefone é um link direto para o WhatsApp da pessoa.</p>

      <div className="adm-filters">
        <input
          className="adm-input"
          placeholder="Buscar nome, email, telefone…"
          value={searchInput}
          onChange={e => { setSearchInput(e.target.value); applySearch(e.target.value) }}
        />
        <input
          className="adm-input"
          placeholder="Filtrar por cidade…"
          value={cidade}
          onChange={e => setCidade(e.target.value)}
        />
        <select className="adm-input" value={intencao} onChange={e => setIntencao(e.target.value)}>
          <option value="">Todas as intenções</option>
          <option value="participar">Participar</option>
          <option value="convidar">Convidar Bancada</option>
        </select>
      </div>

      {error && <p className="adm-error">{error}</p>}

      {loading ? (
        <div className="adm-loading">Carregando…</div>
      ) : leads.length === 0 ? (
        <div className="adm-empty">Nenhum lead encontrado.</div>
      ) : (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Email</th>
                <th>Cidade / UF</th>
                <th>Origem</th>
              <th>Intenção</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(l => (
                <tr key={l.id}>
                  <td>{l.nome}</td>
                  <td>
                    <a href={toWhatsAppUrl(l.telefone)} target="_blank" rel="noopener noreferrer" className="adm-link">
                      {formatPhoneBR(l.telefone)}
                    </a>
                  </td>
                  <td>{l.email ?? '—'}</td>
                  <td>{[l.cidade, l.uf].filter(Boolean).join(' / ') || '—'}</td>
                  <td>
                    <span className="adm-badge adm-badge--origem">
                      {l.origem ?? '—'}
                    </span>
                  </td>
                  <td>
                    <span className={`adm-badge adm-badge--${l.intencao}`}>
                      {l.intencao === 'convidar' ? 'Convidar' : 'Participar'}
                    </span>
                  </td>
                  <td>{new Date(l.created_at).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="adm-count">{leads.length} resultado{leads.length !== 1 ? 's' : ''}</p>
    </div>
  )
}

export default AdminLeads
