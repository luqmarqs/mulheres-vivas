/**
 * Formata uma string de data 'YYYY-MM-DD' sem offset de timezone.
 * @param {string} dataStr - ex: '2026-04-10'
 * @param {Intl.DateTimeFormatOptions} opts - opções para toLocaleDateString
 */
export function formatarData(dataStr, opts = { weekday: 'long', day: 'numeric', month: 'long' }) {
  const [ano, mes, dia] = dataStr.split('-')
  return new Date(Number(ano), Number(mes) - 1, Number(dia)).toLocaleDateString('pt-BR', opts)
}

export function formatarDataCurta(dataStr) {
  return formatarData(dataStr, { day: '2-digit', month: '2-digit', year: 'numeric' })
}
