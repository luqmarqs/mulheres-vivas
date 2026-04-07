import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { dsvFormat } from 'd3-dsv'

const CSV_PATH = '/mapa/SPDadosCriminais_2026.csv'
const GEOJSON_PATH = '/mapa/municipios.json'
const IBGE_POP_URL = 'https://servicodados.ibge.gov.br/api/v3/agregados/10089/periodos/2022/variaveis/93?localidades=N6&classificacao=2[6794]|58[95253]|2661[32776]|1[6795]&view=flat'

function getMarkerColor(value) {
  return value > 20 ? '#4a1575' :
         value > 10 ? '#6b2fa0' :
         value > 5  ? '#8b45c0' :
         value > 2  ? '#9b5fd4' :
         value > 1  ? '#b87fd8' :
         value > 0  ? '#d4a8e8' :
                      '#2a2040'
}

function getMarkerRadius(value) {
  return value > 20 ? 10 :
         value > 10 ? 9 :
         value > 5  ? 8 :
         value > 2  ? 7 :
         value > 1  ? 6 :
         value > 0  ? 5 :
                      4
}

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function normalizeIbge(value) {
  return String(value || '').replace(/\D/g, '')
}

function formatarInteiroBR(value) {
  if (!Number.isFinite(value)) return 'N/D'
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value)
}

function calcularTaxaPor100Mil(total, populacao) {
  if (!Number.isFinite(populacao) || populacao <= 0) return null
  return (Number(total || 0) * 100000) / populacao
}

function formatarTaxaPor100Mil(total, populacao) {
  const taxa = calcularTaxaPor100Mil(total, populacao)
  if (!Number.isFinite(taxa)) return 'N/D'
  return `${taxa.toFixed(2).replace('.', ',')}`
}

function parseNumeroIbge(value) {
  const limpo = String(value || '').replace(/\./g, '').replace(',', '.').trim()
  const n = Number(limpo)
  return Number.isFinite(n) ? n : null
}

async function carregarPopulacaoIbge(signal) {
  try {
    const res = await fetch(IBGE_POP_URL, { signal })
    if (!res.ok) throw new Error(`HTTP ${res.status} ao carregar população IBGE`)

    const rows = await res.json()
    const porMunicipio = {}
    let populacaoEstadoSP = 0

    ;(rows || []).slice(1).forEach((row) => {
      const ibge = normalizeIbge(row?.D1C || row?.D3C)
      if (!ibge || !ibge.startsWith('35')) return

      const populacao = parseNumeroIbge(row?.V)
      if (!Number.isFinite(populacao)) return

      porMunicipio[ibge] = populacao
      populacaoEstadoSP += populacao
    })

    return { porMunicipio, populacaoEstadoSP }
  } catch {
    return { porMunicipio: {}, populacaoEstadoSP: 0 }
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function limparCampo(value) {
  const texto = String(value || '').trim()
  if (!texto || texto === 'NULL') return ''
  if (texto.includes('VEDAÇÃO DA DIVULGAÇÃO')) return 'Não divulgado'
  return texto
}

function formatarData(value) {
  const texto = limparCampo(value)
  return texto || 'Data não informada'
}

function formatarHora(value) {
  const texto = limparCampo(value).replace('NULL', '').trim()
  return texto || 'Hora não informada'
}

function dataHoraOrdenavel(dataBr, hora) {
  const m = String(dataBr || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return Number.NEGATIVE_INFINITY
  const hh = String(hora || '').slice(0, 2)
  const mm = String(hora || '').slice(3, 5)
  const ss = String(hora || '').slice(6, 8)
  return new Date(
    Number(m[3]), Number(m[2]) - 1, Number(m[1]),
    Number.isFinite(Number(hh)) ? Number(hh) : 0,
    Number.isFinite(Number(mm)) ? Number(mm) : 0,
    Number.isFinite(Number(ss)) ? Number(ss) : 0
  ).getTime()
}

function valorMaisFrequente(valores) {
  const contagem = new Map()
  valores.filter(Boolean).forEach(v => contagem.set(v, (contagem.get(v) || 0) + 1))
  let melhor = '', melhorQtd = 0
  contagem.forEach((qtd, valor) => { if (qtd > melhorQtd) { melhor = valor; melhorQtd = qtd } })
  return { valor: melhor, qtd: melhorQtd }
}

function ehCasoFeminicidio(record) {
  const natureza = normalizeText(record['NATUREZA_APURADA'])
  const conduta = normalizeText(record['DESCR_CONDUTA'])
  const rubrica = normalizeText(record['RUBRICA'])
  return (
    natureza.includes('feminicidio') ||
    rubrica === 'feminicidio' ||
    conduta.includes('feminicidio-contra a mulher por razoes da condicao de sexo feminino')
  )
}

function montarCaso(record) {
  const natureza = String(record['NATUREZA_APURADA'] || '').toUpperCase()
  const tipo = natureza.includes('TENTATIVA') ? 'tentativa' : 'consumado'
  return {
    tipo,
    data: formatarData(record['DATA_OCORRENCIA_BO'] || record['DATA_REGISTRO']),
    hora: formatarHora(record['HORA_OCORRENCIA_BO']),
    bairro: limparCampo(record['BAIRRO']),
    local: limparCampo(record['DESCR_TIPOLOCAL']),
    subtipoLocal: limparCampo(record['DESCR_SUBTIPOLOCAL']),
    delegacia: limparCampo(record['NOME_DELEGACIA']),
    conduta: limparCampo(record['DESCR_CONDUTA']),
    natureza: limparCampo(record['NATUREZA_APURADA']),
    ordemTempo: dataHoraOrdenavel(
      formatarData(record['DATA_OCORRENCIA_BO'] || record['DATA_REGISTRO']),
      formatarHora(record['HORA_OCORRENCIA_BO'])
    )
  }
}

function gerarPerfilTags(casos) {
  const topLocal = valorMaisFrequente(casos.map(c => c.local))
  const topSubtipo = valorMaisFrequente(casos.map(c => c.subtipoLocal))
  const topBairro = valorMaisFrequente(casos.map(c => c.bairro))
  const topHora = valorMaisFrequente(
    casos.map(c => String(c.hora || '').slice(0, 2)).filter(h => /^\d{2}$/.test(h))
  )
  return [
    topLocal.valor ? `Local: ${topLocal.valor}` : '',
    topSubtipo.valor ? `Subtipo: ${topSubtipo.valor}` : '',
    (topBairro.valor && topBairro.qtd >= 3) ? `Bairro recorrente: ${topBairro.valor}` : '',
    topHora.valor ? `Horário recorrente: ${topHora.valor}h` : ''
  ].filter(Boolean)
}

function renderizarCaso(caso) {
  const titulo = caso.tipo === 'consumado' ? 'Caso consumado' : 'Tentativa'
  const linhas = [
    `<div class="mc-caso-linha"><b>Data:</b> ${escapeHtml(caso.data)}</div>`,
    `<div class="mc-caso-linha"><b>Hora:</b> ${escapeHtml(caso.hora)}</div>`,
    caso.bairro ? `<div class="mc-caso-linha"><b>Bairro:</b> ${escapeHtml(caso.bairro)}</div>` : '',
    caso.local ? `<div class="mc-caso-linha"><b>Local:</b> ${escapeHtml(caso.local)}${caso.subtipoLocal ? ` / ${escapeHtml(caso.subtipoLocal)}` : ''}</div>` : '',
    caso.delegacia ? `<div class="mc-caso-linha"><b>Delegacia:</b> ${escapeHtml(caso.delegacia)}</div>` : '',
    caso.conduta ? `<div class="mc-caso-linha"><b>Conduta:</b> ${escapeHtml(caso.conduta)}</div>` : '',
  ].filter(Boolean).join('')

  return `
    <div class="mc-caso mc-caso--${caso.tipo}">
      <div class="mc-caso-titulo">${titulo}</div>
      ${linhas}
    </div>
  `
}

function MapaFeminicidio() {
  const mapDivRef = useRef(null)
  const painelRef = useRef(null)
  const mapInstanceRef = useRef(null)

  useEffect(() => {
    if (!mapDivRef.current || !painelRef.current) return

    const container = mapDivRef.current
    const painel = painelRef.current
    let map = null
    let abortController = null
    let initialized = false

    function initMap() {
      if (initialized || mapInstanceRef.current) return

      initialized = true
      abortController = new AbortController()
      const signal = abortController.signal

      map = L.map(container, {
        zoomControl: false,
        attributionControl: false,
        dragging: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: false,
        keyboard: false,
        touchZoom: true,
        zoomSnap: 0.1,
      }).setView([-22.5, -48], 7)

      mapInstanceRef.current = map

    function atualizarPainelEstado(dataMap, totais, popIBGE) {
      const listaMunicipios = Object.entries(dataMap)
        .map(([ibge, d]) => {
          const populacao = popIBGE.porMunicipio?.[ibge] ?? null
          return {
            ibge,
            ...d,
            populacao,
            taxa100k: calcularTaxaPor100Mil(d.total, populacao),
          }
        })
        .sort((a, b) => b.total - a.total)

      const top5 = listaMunicipios
        .slice(0, 5)

      const todosCasos = Object.values(dataMap)
        .flatMap(d => [...d.casosConsumados, ...d.casosTentativa])
      const tags = gerarPerfilTags(todosCasos)

      const perfilHtml = tags.length ? `
        <div class="mc-perfil">
          <h4>Perfil do estado</h4>
          <div class="mc-tags">
            ${tags.map(t => `<span class="mc-tag">${escapeHtml(t)}</span>`).join('')}
          </div>
        </div>
      ` : ''

      const taxaEstado = formatarTaxaPor100Mil(totais.total, popIBGE.populacaoEstadoSP)

      const topHtml = top5.length ? `<ul class="mc-lista">
        ${top5.map(m => `<li><b>${escapeHtml(m.cidade || 'Município')}</b>: ${m.total} casos (${escapeHtml(formatarTaxaPor100Mil(m.total, m.populacao))}/100 mil) (C: ${m.consumado} | T: ${m.tentativa})</li>`).join('')}
      </ul>` : '<div class="mc-vazio">Sem dados para 2026.</div>'

      painel.innerHTML = `
        <h2 class="mc-painel-titulo">Estado de SP</h2>
        <p class="mc-meta">Ano: 2026 · Clique em um ponto para detalhar</p>
        <div class="mc-resumo">
          <div class="mc-chip"><strong>${totais.consumado}</strong><span>Consumados</span></div>
          <div class="mc-chip"><strong>${totais.tentativa}</strong><span>Tentativas</span></div>
          <div class="mc-chip"><strong>${totais.total}</strong><span>Total</span></div>
          <div class="mc-chip"><strong>${taxaEstado}</strong><span>por 100 mil</span></div>
        </div>
        <p class="mc-meta">População base: Censo 2022 (IBGE)</p>
        ${perfilHtml}
        <h3 class="mc-subtitulo">Municípios com mais casos</h3>
        ${topHtml}
      `
    }

    function atualizarPainelCidade(cidade, ibge, dados, dataMap, totais, popIBGE) {
      const consumados = [...dados.casosConsumados].sort((a, b) => b.ordemTempo - a.ordemTempo)
      const tentativas = [...dados.casosTentativa].sort((a, b) => b.ordemTempo - a.ordemTempo)
      const todos = [...consumados, ...tentativas]
      const tags = gerarPerfilTags(todos)
      const populacao = popIBGE.porMunicipio?.[ibge] ?? null
      const taxaCidade = formatarTaxaPor100Mil(dados.total, populacao)

      const perfilHtml = tags.length ? `
        <div class="mc-perfil">
          <h4>Perfil da cidade</h4>
          <div class="mc-tags">
            ${tags.map(t => `<span class="mc-tag">${escapeHtml(t)}</span>`).join('')}
          </div>
        </div>
      ` : ''

      const consumadosHtml = consumados.length
        ? consumados.map(renderizarCaso).join('')
        : '<div class="mc-vazio">Nenhum caso consumado registrado em 2026.</div>'
      const tentativasHtml = tentativas.length
        ? tentativas.map(renderizarCaso).join('')
        : '<div class="mc-vazio">Nenhuma tentativa registrada em 2026.</div>'

      painel.innerHTML = `
        <div class="mc-painel-topo">
          <h2 class="mc-painel-titulo">${escapeHtml(cidade)}</h2>
          <button id="mc-btn-voltar" class="mc-btn-voltar" type="button">← Voltar</button>
        </div>
        <p class="mc-meta">IBGE: ${escapeHtml(ibge)} · Ano: 2026 · População (IBGE/Censo 2022): ${escapeHtml(formatarInteiroBR(populacao))}</p>
        <div class="mc-resumo">
          <div class="mc-chip"><strong>${dados.consumado}</strong><span>Consumados</span></div>
          <div class="mc-chip"><strong>${dados.tentativa}</strong><span>Tentativas</span></div>
          <div class="mc-chip"><strong>${dados.total}</strong><span>Total</span></div>
          <div class="mc-chip"><strong>${taxaCidade}</strong><span>por 100 mil</span></div>
        </div>
        ${perfilHtml}
        <h3 class="mc-subtitulo">Casos consumados</h3>
        ${consumadosHtml}
        <h3 class="mc-subtitulo">Tentativas</h3>
        ${tentativasHtml}
      `

      document.getElementById('mc-btn-voltar')?.addEventListener('click', () => {
        atualizarPainelEstado(dataMap, totais, popIBGE)
      })
    }

    function checkOk(res, path) {
      if (!res.ok) throw new Error(`HTTP ${res.status} ao carregar ${path}`)
      return res
    }

    Promise.all([
      fetch(CSV_PATH, { signal })
        .then(r => checkOk(r, CSV_PATH))
        .then(r => r.text())
        .then(text => {
          // Remove BOM se presente
          const clean = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text
          return dsvFormat(';').parse(clean)
        }),
      fetch(GEOJSON_PATH, { signal })
        .then(r => checkOk(r, GEOJSON_PATH))
        .then(r => r.json()),
      carregarPopulacaoIbge(signal),
    ]).then(([csvData, geoData, popIBGE]) => {
      const dataMap = {}

      csvData.forEach(d => {
        if (String(d['ANO_ESTATISTICA'] || '') !== '2026') return
        if (!ehCasoFeminicidio(d)) return
        const ibge = normalizeIbge(d['COD IBGE'])
        if (!ibge) return

        if (!dataMap[ibge]) {
          dataMap[ibge] = {
            cidade: limparCampo(d['NOME_MUNICIPIO_CIRCUNSCRICAO']) || limparCampo(d['NOME_MUNICIPIO']) || 'Município',
            total: 0, consumado: 0, tentativa: 0,
            casosConsumados: [], casosTentativa: [],
          }
        }

        const natureza = String(d['NATUREZA_APURADA'] || '').toUpperCase()
        if (natureza.includes('TENTATIVA')) {
          dataMap[ibge].tentativa += 1
          dataMap[ibge].casosTentativa.push(montarCaso(d))
        } else if (natureza.includes('HOMIC') && natureza.includes('DOLOSO')) {
          dataMap[ibge].consumado += 1
          dataMap[ibge].casosConsumados.push(montarCaso(d))
        }
        dataMap[ibge].total += 1
      })

      const totais = Object.values(dataMap).reduce(
        (acc, item) => ({ total: acc.total + item.total, consumado: acc.consumado + item.consumado, tentativa: acc.tentativa + item.tentativa }),
        { total: 0, consumado: 0, tentativa: 0 }
      )

      atualizarPainelEstado(dataMap, totais, popIBGE)

      // Garante dimensões corretas antes de qualquer projeção de coordenadas
      map.invalidateSize({ animate: false })

      // Filtra features com geometria inválida antes de passar ao Leaflet
      const validFeatures = geoData.features.filter(f => {
        if (!f.geometry?.coordinates?.length) return false
        try {
          const b = L.geoJson(f).getBounds()
          return b.isValid()
        } catch {
          return false
        }
      })
      const cleanGeoData = { ...geoData, features: validFeatures }

      const municipiosLayer = L.geoJson(cleanGeoData, {
        style: () => ({
          fillColor: '#1a1228',
          weight: 0.9,
          color: 'rgba(107, 47, 160, 0.4)',
          fillOpacity: 0.95,
        }),
      }).addTo(map)

      const pontosLayer = L.layerGroup().addTo(map)

      validFeatures.forEach(feature => {
        const cidade = feature.properties?.name || 'Cidade'
        const ibge = normalizeIbge(feature.properties?.id)
        const dados = dataMap[ibge] || { total: 0, consumado: 0, tentativa: 0, casosConsumados: [], casosTentativa: [] }
        if (dados.total <= 0) return

        let centro
        try {
          centro = L.geoJson(feature).getBounds().getCenter()
        } catch {
          return
        }
        if (!centro || !isFinite(centro.lat) || !isFinite(centro.lng)) return

        const marker = L.circleMarker(centro, {
          radius: getMarkerRadius(dados.total),
          color: '#3d0f6e',
          weight: 1.2,
          fillColor: getMarkerColor(dados.total),
          fillOpacity: 0.92,
        }).addTo(pontosLayer)

        marker.bindPopup(
          `<b>${escapeHtml(cidade)}</b><br>` +
          `Consumados: ${dados.consumado}<br>` +
          `Tentativas: ${dados.tentativa}<br>` +
          `Total: ${dados.total}<br>` +
          `Taxa: ${formatarTaxaPor100Mil(dados.total, popIBGE.porMunicipio?.[ibge] ?? null)}/100 mil`
        )

        marker.on('click', () => {
          atualizarPainelCidade(cidade, ibge, dados, dataMap, totais, popIBGE)
        })
      })

      try {
        if (municipiosLayer.getBounds().isValid()) {
          const spBounds = municipiosLayer.getBounds()
          map.fitBounds(spBounds, { padding: [2, 2] })
          const fixedZoom = map.getZoom()
          if (isFinite(fixedZoom)) {
            map.setZoom(fixedZoom)
            map.setMinZoom(fixedZoom)
          }
          map.setMaxZoom(14)
          map.setMaxBounds(spBounds.pad(0.05))
          map.options.maxBoundsViscosity = 1.0
        }
      } catch (e) {
        console.warn('[MapaFeminicidio] fitBounds falhou, tentando novamente:', e.message)
        // Tenta novamente após o browser finalizar o layout
        requestAnimationFrame(() => {
          if (!mapInstanceRef.current) return
          try {
            map.invalidateSize({ animate: false })
            const b = municipiosLayer.getBounds()
            if (b.isValid()) {
              map.fitBounds(b, { padding: [2, 2] })
              map.setMaxZoom(14)
            }
          } catch (e2) {
            console.warn('[MapaFeminicidio] fitBounds retry falhou:', e2.message)
          }
        })
      }
    }).catch(err => {
      if (err.name === 'AbortError' || signal.aborted) return
      console.error('[MapaFeminicidio] Erro:', err.message, err)
      if (painel) {
        painel.innerHTML = `<p class="mc-meta" style="color:#ff6b6b">Erro ao carregar os dados: ${err.message}</p>`
      }
    })
    } // fim initMap

    // ResizeObserver: tenta inicializar quando o container tiver dimensões reais,
    // e recalcula o tamanho do mapa em rotações/resize posteriores
    const resizeObserver = new ResizeObserver(() => {
      if (!initialized) {
        initMap()
      } else if (map) {
        map.invalidateSize({ animate: false })
      }
    })
    resizeObserver.observe(container)

    // Tenta imediatamente (desktop já tem dimensões no primeiro render)
    initMap()

    return () => {
      resizeObserver.disconnect()
      if (abortController) abortController.abort()
      if (map) {
        map.remove()
        mapInstanceRef.current = null
      }
      initialized = false
    }
  }, [])

  return (
    <div className="mc-wrapper">
      <div className="mc-layout">
        <div className="mc-map-wrapper">
          <div ref={mapDivRef} className="mc-map" />
          <div className="mc-zoom-hint">
            🔍 Dê zoom para aproximar dos municípios
          </div>
        </div>
        <div ref={painelRef} className="mc-painel">
          <p className="mc-meta">Carregando dados…</p>
        </div>
      </div>
      <div className="mc-legenda">
        <span className="mc-legenda-titulo">Casos por município:</span>
        {[
          { cor: '#4a1575', label: '> 20' },
          { cor: '#6b2fa0', label: '11–20' },
          { cor: '#9b5fd4', label: '3–10' },
          { cor: '#d4a8e8', label: '1–2' },
        ].map(({ cor, label }) => (
          <span key={label} className="mc-legenda-item">
            <span className="mc-legenda-dot" style={{ background: cor }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default MapaFeminicidio
