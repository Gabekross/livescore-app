// app/loading.tsx
// Root loading skeleton shown during page transitions.

export default function Loading() {
  return (
    <div
      style={{
        minHeight:      '50vh',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width:        '32px',
          height:       '32px',
          border:       '3px solid var(--color-border, #e5e7eb)',
          borderTop:    '3px solid var(--color-primary, #2563eb)',
          borderRadius: '50%',
          animation:    'spin 0.7s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
