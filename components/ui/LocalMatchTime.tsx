'use client'

import { useEffect, useState } from 'react'
import { formatLocalDateTime, type LocalDateTimeVariant } from '@/lib/utils/dateTime'

interface Props {
  iso: string
  variant?: LocalDateTimeVariant
  className?: string
}

export default function LocalMatchTime({ iso, variant = 'time', className }: Props) {
  const [label, setLabel] = useState('')

  useEffect(() => {
    setLabel(formatLocalDateTime(iso, variant))
  }, [iso, variant])

  return (
    <span className={className}>
      {label}
    </span>
  )
}
