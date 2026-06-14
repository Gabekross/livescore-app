'use client'

import { formatLocalDateTime, type LocalDateTimeVariant } from '@/lib/utils/dateTime'

interface Props {
  iso: string
  variant?: LocalDateTimeVariant
  className?: string
}

export default function LocalMatchTime({ iso, variant = 'time', className }: Props) {
  return (
    <span className={className} suppressHydrationWarning>
      {formatLocalDateTime(iso, variant)}
    </span>
  )
}
