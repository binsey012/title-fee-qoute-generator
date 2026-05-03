import { useState, useEffect } from 'react'

function parseDollar(str) {
  return parseFloat(String(str || '').replace(/[,$]/g, '')) || 0
}

function fmtDisplay(raw) {
  const n = parseDollar(raw)
  if (!n && n !== 0) return ''
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function CurrencyInput({ label, value, onChange, placeholder = '0.00', hint, disabled = false }) {
  const [display, setDisplay] = useState('')
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) {
      setDisplay(value ? fmtDisplay(value) : '')
    }
  }, [value, focused])

  const handleFocus = () => {
    setFocused(true)
    // Strip formatting on focus so user can type raw numbers
    const raw = parseDollar(value)
    setDisplay(raw ? String(raw) : '')
  }

  const handleBlur = () => {
    setFocused(false)
    const parsed = parseDollar(display)
    setDisplay(parsed ? fmtDisplay(parsed) : '')
    onChange(String(parsed))
  }

  const handleChange = (e) => {
    // Allow digits, dot, comma
    const raw = e.target.value.replace(/[^0-9.,]/g, '')
    setDisplay(raw)
    const parsed = parseDollar(raw)
    onChange(String(parsed))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <label style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 500, letterSpacing: '0.02em' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
          color: 'var(--text-muted)', fontSize: '0.9rem', pointerEvents: 'none',
        }}>$</span>
        <input
          className="field-input"
          style={{ paddingLeft: '22px' }}
          value={display}
          placeholder={placeholder}
          disabled={disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          inputMode="decimal"
        />
      </div>
      {hint && <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{hint}</span>}
    </div>
  )
}
