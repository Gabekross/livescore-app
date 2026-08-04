const VISITOR_KEY = 'kolusports_visitor_id'

function createVisitorId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `anon_${crypto.randomUUID()}`
  }
  return `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`
}

export function getAnonymousVisitorId() {
  try {
    const existing = window.localStorage.getItem(VISITOR_KEY)
    if (existing) return existing
    const next = createVisitorId()
    window.localStorage.setItem(VISITOR_KEY, next)
    return next
  } catch {
    return createVisitorId()
  }
}
