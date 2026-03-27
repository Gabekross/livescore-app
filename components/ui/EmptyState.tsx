// components/ui/EmptyState.tsx
// Renders a centred placeholder when a list is empty or loading.

import styles from '@/styles/components/EmptyState.module.scss'

interface Props {
  icon?:        string   // emoji, default ⚽
  title:        string
  description?: string
  compact?:     boolean
}

export default function EmptyState({
  icon = '⚽',
  title,
  description,
  compact,
}: Props) {
  return (
    <div className={`${styles.wrapper} ${compact ? styles.compact : ''}`} role="status">
      <span className={styles.icon} aria-hidden="true">{icon}</span>
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
    </div>
  )
}
