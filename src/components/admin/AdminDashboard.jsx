import { useState } from 'react'
import { Line, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Tooltip, Filler, ArcElement, Legend,
} from 'chart.js'
import { useAdminStats } from '../../hooks/useAdminStats'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler, ArcElement, Legend)

const INTENCAO_LABEL = { participar: 'Abaixo-assinado', organizar: 'Organizar comitê', convidar: 'Convidar Bancada' }
const INTENCAO_COLORS = ['#9b5fd4', '#6b2fa0', '#c49eea']

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="adm-stat-card">
      <div className="adm-stat-value" style={accent ? { color: accent } : {}}>{value ?? '—'}</div>
      <div className="adm-stat-label">{label}</div>
      {sub && <div className="adm-stat-sub">{sub}</div>}
    </div>
  )
}

function AdminDashboard() {
  const { stats, loading } = useAdminStats()
  const [periodo, setPeriodo] = useState(7)

  if (loading) return <div className="adm-loading">Carregando…</div>

  const porDia = periodo === 7 ? stats.porDia : stats.porDia30
  const dias = Object.keys(porDia)
  const valores = Object.values(porDia)

  const chartLine = {
    labels: dias.map(d => {
      const [, m, day] = d.split('-')
      return `${day}/${m}`
    }),
    datasets: [{
      label: 'Leads',
      data: valores,
      fill: true,
      tension: 0.4,
      borderColor: '#9b5fd4',
      backgroundColor: 'rgba(107, 47, 160, 0.12)',
      pointBackgroundColor: '#9b5fd4',
      pointRadius: 3,
      pointHoverRadius: 5,
    }],
  }

  const chartLineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
    scales: {
      x: {
        grid: { color: 'rgba(107,47,160,0.08)' },
        ticks: { color: '#c4b8d8', font: { size: 11 }, maxTicksLimit: periodo === 30 ? 10 : 7 },
      },
      y: {
        grid: { color: 'rgba(107,47,160,0.08)' },
        ticks: { color: '#c4b8d8', stepSize: 1 },
        beginAtZero: true,
      },
    },
  }

  const intencaoEntries = Object.entries(stats.intencaoMap)
  const chartDoughnut = {
    labels: intencaoEntries.map(([k]) => INTENCAO_LABEL[k] ?? k),
    datasets: [{
      data: intencaoEntries.map(([, v]) => v),
      backgroundColor: INTENCAO_COLORS,
      borderWidth: 0,
      hoverOffset: 6,
    }],
  }

  const chartDoughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#c4b8d8', font: { size: 12 }, padding: 16, boxWidth: 12 } },
    },
    cutout: '68%',
  }

  const totalIntenção = intencaoEntries.reduce((s, [, v]) => s + v, 0)

  return (
    <div className="adm-dashboard">
      <h2 className="adm-section-title">Dashboard</h2>

      {/* STAT CARDS */}
      <div className="adm-stats-grid adm-stats-grid--6">
        <StatCard label="Total de leads" value={stats.totalLeads} />
        <StatCard label="Últimos 7 dias" value={stats.leads7dias} sub="novos leads" />
        <StatCard label="Últimos 30 dias" value={stats.leads30dias} sub="novos leads" />
        <StatCard label="Comitês ativos" value={stats.totalComites} />
        <StatCard label="Agendas publicadas" value={stats.totalAgendas} />
        <StatCard
          label="Propostas"
          value={(stats.propostasComite ?? 0) + (stats.propostasAgenda ?? 0)}
          sub={`${stats.propostasComite} comitê · ${stats.propostasAgenda} agenda`}
          accent="#c49eea"
        />
      </div>

      {/* GRÁFICO DE LINHA */}
      <div className="adm-chart-card">
        <div className="adm-chart-header">
          <h3>Leads por dia</h3>
          <div className="adm-periodo-toggle">
            <button
              className={periodo === 7 ? 'active' : ''}
              onClick={() => setPeriodo(7)}
            >7 dias</button>
            <button
              className={periodo === 30 ? 'active' : ''}
              onClick={() => setPeriodo(30)}
            >30 dias</button>
          </div>
        </div>
        <div style={{ height: 220 }}>
          <Line data={chartLine} options={chartLineOptions} />
        </div>
      </div>

      {/* LINHA: INTENÇÃO + TOP CIDADES */}
      <div className="adm-dash-row">

        {/* DONUT */}
        <div className="adm-chart-card" style={{ flex: 1 }}>
          <h3>Distribuição por intenção</h3>
          {totalIntenção === 0 ? (
            <p className="adm-empty">Nenhum dado ainda.</p>
          ) : (
            <div style={{ height: 220, position: 'relative' }}>
              <Doughnut data={chartDoughnut} options={chartDoughnutOptions} />
            </div>
          )}
        </div>

        {/* TOP CIDADES */}
        <div className="adm-chart-card" style={{ flex: 1 }}>
          <h3>Top cidades</h3>
          {stats.topCidades.length === 0 ? (
            <p className="adm-empty">Nenhum dado ainda.</p>
          ) : (
            <div className="adm-top-cidades">
              {stats.topCidades.map(([cidade, qtd]) => (
                <div key={cidade} className="adm-cidade-row">
                  <span>{cidade}</span>
                  <div className="adm-cidade-bar-wrap">
                    <div
                      className="adm-cidade-bar"
                      style={{ width: `${(qtd / stats.topCidades[0][1]) * 100}%` }}
                    />
                  </div>
                  <span className="adm-cidade-qtd">{qtd}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ÚLTIMOS LEADS */}
      {stats.ultimosLeads.length > 0 && (
        <div className="adm-chart-card">
          <h3>Últimas entradas</h3>
          <div className="adm-table-wrap" style={{ marginTop: 12 }}>
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Cidade / UF</th>
                  <th>Intenção</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {stats.ultimosLeads.map((l, i) => (
                  <tr key={i}>
                    <td>{l.nome}</td>
                    <td>{[l.cidade, l.uf].filter(Boolean).join(' / ') || '—'}</td>
                    <td>
                      <span className={`adm-badge adm-badge--${l.intencao}`}>
                        {INTENCAO_LABEL[l.intencao] ?? l.intencao}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {new Date(l.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
