import { useState } from 'react'

export default function Accordion({ title, badge, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-glass)' }}>
      <div className="accordion-header" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-3">
          <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.9rem' }}>
            {title}
          </span>
          {badge && (
            <span style={{
              background: 'rgba(59,130,246,0.15)',
              color: 'var(--accent-blue-bright)',
              fontSize: '0.75rem',
              padding: '2px 8px',
              borderRadius: '999px',
              border: '1px solid rgba(59,130,246,0.25)',
            }}>
              {badge}
            </span>
          )}
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="var(--text-muted)" strokeWidth="2"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {open && (
        <div style={{ borderTop: '1px solid var(--border-glass)' }}>
          {children}
        </div>
      )}
    </div>
  )
}
