export type LocalDateTimeVariant =
  | 'time'
  | 'shortDate'
  | 'shortDateTime'
  | 'mediumDateTime'
  | 'longDate'

function getDate(iso: string) {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatLocalDateTime(
  iso: string,
  variant: LocalDateTimeVariant = 'time',
) {
  const date = getDate(iso)
  if (!date) return ''

  const time = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)

  if (variant === 'time') return time

  if (variant === 'longDate') {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  if (variant === 'mediumDateTime') {
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date)
  }

  const parts = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
  }).formatToParts(date)
  const day = parts.find((part) => part.type === 'day')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const shortDate = [day, month].filter(Boolean).join(' ')

  return variant === 'shortDateTime' ? `${shortDate} ${time}` : shortDate
}

/**
 * Human heading for a local date key ("YYYY-MM-DD"):
 * "Today", "Yesterday", or e.g. "Saturday, July 12, 2026".
 */
export function formatDateHeading(dateKey: string, now: Date = new Date()) {
  const [year, month, day] = dateKey.split('-').map(Number)
  if (!year || !month || !day) return ''

  if (dateKey === localDateKey(now)) return 'Today'

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (dateKey === localDateKey(yesterday)) return 'Yesterday'

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(year, month - 1, day))
}

export function localDateKey(isoOrDate: string | Date) {
  const date = typeof isoOrDate === 'string' ? getDate(isoOrDate) : isoOrDate
  if (!date || Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
