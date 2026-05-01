'use client'

import { useState, useRef, useEffect } from 'react'
import styles from '@/styles/components/HelpSystem.module.scss'

interface Props {
  text:       string
  label?:     string   // defaults to "?"
  position?:  'above' | 'below'
}

export default function HelpTooltip({ text, label = '?', position = 'above' }: Props) {
  const [show, setShow] = useState(false)
  const wrapperRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!show) return
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShow(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [show])

  const isTextLabel = label.length > 1

  return (
    <span className={styles.tooltipWrapper} ref={wrapperRef}>
      <button
        className={isTextLabel ? styles.tooltipTriggerText : styles.tooltipTrigger}
        onClick={() => setShow(v => !v)}
        aria-label={`Help: ${text}`}
        type="button"
      >
        {label}
      </button>
      {show && (
        <div
          className={`${styles.tooltipPopover} ${position === 'below' ? styles.tooltipPopoverBelow : ''}`}
          role="tooltip"
        >
          {text}
        </div>
      )}
    </span>
  )
}
