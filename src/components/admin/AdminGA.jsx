import { Line, Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  Tooltip, Filler, ArcElement, Legend,
} from 'chart.js'
import { useGAMetrics } from '../../hooks/useGAMetrics'

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement,
  Tooltip, Filler, ArcElement, Legend,
)

function StatCard({ label, value, sub }) {
  return (
    <div className="adm-stat-card">
      <div className="adm-stat-value">{value ?? '—'}</div>
      <div className="adm-stat-label">{label}</div>
      {sub && <div className="adm-stat-sub">{sub}</div>}
    </div>
  )
}

function fmtSec(sec) {
  if (!sec) return '—'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function AdminGA() {
  const { data, loading, error } = useGAMetrics()

  if (loading) return <div className="adm-loading">Carregando métricas do Google Analytics…</div>
  if (error)   return (
    <div className="adm-ga-error">
      <p className="adm-error">Erro ao carregar métricas: {error}</p>
      <p className="adm-section-desc">
        Verifique se as variáveis de ambiente <code>GA_PROPERTY_ID</code> e{' '}
        <code>GA_SERVICE_ACCOUNT_JSON</code> estão configuradas no painel do Supabase
        e se a Edge Function <code>ga-metrics</code> foi publicada.
      </p>
    </div>
  )

  const { resumo7, resumo30, porDia, porPagina, porDispositivo } = data

  // Gráfico de linha — sessões por dia
  const lineData = {
    labels: porDia.map(d => d.date),
    datasets: [
      {
        label: 'Sessões',
        data: porDia.map(d => d.sessions),
        fill: true,
        tension: 0.4,
        borderColor: '#9b5fd4',
        backgroundColor: 'rgba(107,47,160,0.12)',
        pointBackgroundColor: '#9b5fd4',
        pointRadius: 2,
        pointHoverRadius: 5,
      },
      {
        label: 'Usuários',
        data: porDia.map(d => d.activeUsers),
        fill: false,
        tension: 0.4,
        borderColor: '#c49eea',
        backgroundColor: 'transparent',
        pointRadius: 2,
        pointHoverRadius: 5,
        borderDash: [4, 3],
      },
    ],
  }

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#c4b8d8', font: { size: 11 }, padding: 12, boxWidth: 10 } },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: {
        grid: { color: 'rgba(107,47,160,0.08)' },
        ticks: { color: '#c4b8d8', font: { size: 10 }, maxTicksLimit: 10 },
      },
      y: {
        grid: { color: 'rgba(107,47,160,0.08)' },
        ticks: { color: '#c4b8d8', stepSize: 1 },
        beginAtZero: true,
      },
    },
  }

  // Gráfico de dispositivos (donut)
  const deviceTotal = porDispositivo.reduce((s, d) => s + d.sessions, 0)
  const deviceColors = ['#9b5fd4', '#c49eea', '#6b2fa0']
  const DEVICE_LABEL = { mobile: 'Mobile', desktop: 'Desktop', tablet: 'Tablet' }

  const donutData = {
    labels: porDispositivo.map(d => DEVICE_LABEL[d.device] ?? d.device),
    datasets: [{
      data: porDispositivo.map(d => d.sessions),
      backgroundColor: deviceColors,
      borderWidth: 0,
      hoverOffset: 6,
    }],
  }

  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#c4b8d8', font: { size: 12 }, padding: 16, boxWidth: 12 } },
    },
    cutout: '68%',
  }

  // Gráfico de barras — top páginas
  const barData = {
    labels: porPagina.map(p => p.path),
    datasets: [{
      label: 'Visualizações',
      data: porPagina.map(p => p.pageViews),
      backgroundColor: 'rgba(107,47,160,0.6)',
      borderRadius: 6,
      borderSkipped: false,
    }],
  }

  const barOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { mode: 'index' } },
    scales: {
      x: {
        grid: { color: 'rgba(107,47,160,0.08)' },
        ticks: { color: '#c4b8d8', font: { size: 11 } },
        beginAtZero: true,
      },
      y: {
        grid: { display: false },
        ticks: { color: '#c4b8d8', font: { size: 12 } },
      },
    },
  }

  return (
    <div className="adm-dashboard">
      <h2 className="adm-section-title">Google Analytics</h2>
      <p className="adm-section-desc">
        Dados do site nos últimos 7 e 30 dias via GA4 Data API.
      </p>

      {/* STAT CARDS — 7 dias */}
      <p className="adm-ga-periodo">Últimos 7 dias</p>
      <div className="adm-stats-grid adm-stats-grid--5">
        <StatCard label="Sessões"         value={resumo7?.sessions?.toLocaleString('pt-BR')} />
        <StatCard label="Usuários ativos" value={resumo7?.activeUsers?.toLocaleString('pt-BR')} />
        <StatCard label="Visualizações"   value={resumo7?.pageViews?.toLocaleString('pt-BR')} />
        <StatCard label="Taxa de rejeição" value={resumo7?.bounceRate != null ? `${resumo7.bounceRate}%` : '—'} />
        <StatCard label="Tempo médio"     value={fmtSec(resumo7?.avgSessionSec)} sub="por sessão" />
      </div>

      {/* STAT CARDS — 30 dias */}
      <p className="adm-ga-periodo" style={{ marginTop: 20 }}>Últimos 30 dias</p>
      <div className="adm-stats-grid adm-stats-grid--3">
        <StatCard label="Sessões"         value={resumo30?.sessions?.toLocaleString('pt-BR')} />
        <StatCard label="Usuários ativos" value={resumo30?.activeUsers?.toLocaleString('pt-BR')} />
        <StatCard label="Visualizações"   value={resumo30?.pageViews?.toLocaleString('pt-BR')} />
      </div>

      {/* GRÁFICO DE LINHA */}
      <div className="adm-chart-card" style={{ marginTop: 24 }}>
        <h3>Sessões e usuários por dia — últimos 30 dias</h3>
        <div style={{ height: 220 }}>
          <Line data={lineData} options={lineOptions} />
        </div>
      </div>

      {/* DISPOSITIVOS + TOP PÁGINAS */}
      <div className="adm-dash-row">
        <div className="adm-chart-card" style={{ flex: 1 }}>
          <h3>Dispositivos</h3>
          {deviceTotal === 0 ? (
            <p className="adm-empty">Nenhum dado.</p>
          ) : (
            <div style={{ height: 220, position: 'relative' }}>
              <Doughnut data={donutData} options={donutOptions} />
            </div>
          )}
        </div>

        <div className="adm-chart-card" style={{ flex: 1 }}>
          <h3>Top páginas</h3>
          {porPagina.length === 0 ? (
            <p className="adm-empty">Nenhum dado.</p>
          ) : (
            <div style={{ height: 220 }}>
              <Bar data={barData} options={barOptions} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminGA
