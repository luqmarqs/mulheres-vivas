export function normalizePhoneBR(value) {
  const digits = String(value || '').replace(/\D/g, '')

  if (!digits) return ''

  if (digits.length === 13 && digits.startsWith('55')) {
    return digits.slice(2)
  }

  if (digits.length === 12 && digits.startsWith('55')) {
    return digits.slice(2)
  }

  if (digits.length > 11) {
    return digits.slice(-11)
  }

  return digits
}

export function isValidPhoneBR(value) {
  const normalized = normalizePhoneBR(value)
  return normalized.length === 10 || normalized.length === 11
}

export function formatPhoneBR(value) {
  const normalized = normalizePhoneBR(value)

  if (!normalized) return ''
  if (normalized.length <= 2) return normalized
  if (normalized.length <= 6) return `(${normalized.slice(0, 2)}) ${normalized.slice(2)}`
  if (normalized.length <= 10) {
    return `(${normalized.slice(0, 2)}) ${normalized.slice(2, 6)}-${normalized.slice(6)}`
  }

  return `(${normalized.slice(0, 2)}) ${normalized.slice(2, 7)}-${normalized.slice(7)}`
}

export function toWhatsAppUrl(value) {
  const normalized = normalizePhoneBR(value)
  return normalized ? `https://wa.me/55${normalized}` : ''
}
