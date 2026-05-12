import { useState, useEffect } from 'react'
import { ReceiptIcon } from './icons'

const FEE_DEFS = [
  { key: 'ownersTitleInsurance',  label: "Owner's Title Insurance" },
  { key: 'lendersTitleInsurance', label: "Lender's Title Insurance" },
  { key: 'escrowFee',             label: 'Escrow / Closing Fee' },
  { key: 'settlementFee',         label: 'Settlement Fee' },
  { key: 'recordingFee',          label: 'Recording Fee' },
  { key: 'transferTax',           label: 'Transfer / Documentary Tax' },
]

function parseDollar(str) {
  if (!str && str !== 0) return 0
  return parseFloat(String(str).replace(/[,$]/g, '')) || 0
}

function fmtDollar(num) {
  const n = typeof num === 'number' ? num : parseFloat(num)
  if (isNaN(n)) return '0.00'
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// All fees start at zero — manual entry
const ZERO_VALUES = Object.fromEntries(FEE_DEFS.map(({ key }) => [key, '0.00']))

export default function FeesSheet({ result, onTotalChange, salesPrice }) {
  const [enabled, setEnabled] = useState(() => Object.fromEntries(FEE_DEFS.map(f => [f.key, true])))
  const [values, setValues]   = useState(ZERO_VALUES)
  const [modes, setModes]     = useState(() => Object.fromEntries(FEE_DEFS.map(f => [f.key, 'dollar'])))
  const [pcts, setPcts]       = useState(() => Object.fromEntries(FEE_DEFS.map(f => [f.key, ''])))

  // Recalculate pct-mode fees when salesPrice changes
  useEffect(() => {
    const sp = parseDollar(salesPrice)
    if (!sp) return
    setValues(prev => {
      const next = { ...prev }
      FEE_DEFS.forEach(({ key }) => {
        if (modes[key] === 'pct' && pcts[key]) {
          const pct = parseFloat(pcts[key]) / 100
          if (!isNaN(pct)) next[key] = fmtDollar(pct * sp)
        }
      })
      return next
    })
  }, [salesPrice]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── All calculations must happen before any early return (Rules of Hooks) ──
  const totalCents = FEE_DEFS.reduce((sum, { key }) => {
    if (!enabled[key]) return sum
    return sum + Math.round(parseDollar(values[key]) * 100)
  }, 0)
  const totalFormatted = fmtDollar(totalCents / 100)

  useEffect(() => {
    if (result && onTotalChange) onTotalChange(totalFormatted)
  }, [totalFormatted, result]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!result) return <EmptyState />

  const toggle      = (key) => setEnabled(p => ({ ...p, [key]: !p[key] }))
  const updateValue = (key, val) => setValues(p => ({ ...p, [key]: val }))

  const toggleMode = (key) => {
    const newMode = modes[key] === 'dollar' ? 'pct' : 'dollar'
    if (newMode === 'pct') {
      const sp = parseDollar(salesPrice)
      if (sp > 0) {
        const d = parseDollar(values[key])
        const p = (d / sp) * 100
        setPcts(prev => ({ ...prev, [key]: p > 0 ? parseFloat(p.toFixed(4)).toString() : '' }))
      } else {
        setPcts(prev => ({ ...prev, [key]: '' }))
      }
    }
    setModes(prev => ({ ...prev, [key]: newMode }))
  }

  const onPctChange = (key, raw) => {
    const v = raw.replace(/[^0-9.]/g, '')
    setPcts(prev => ({ ...prev, [key]: v }))
    const sp = parseDollar(salesPrice)
    if (sp > 0) {
      const pct = parseFloat(v) / 100
      updateValue(key, !isNaN(pct) ? fmtDollar(pct * sp) : '0.00')
    }
  }

  return (
    <div className="sheet-wrap">
      <SectionHeader />
      <div className="glass-card sheet-grid">
        <div style={{ padding: '7px 14px 4px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Toggle, edit, or enter % of sales price
          </span>
        </div>

        {FEE_DEFS.map(({ key, label }) => {
          const isOn   = enabled[key]
          const mode   = modes[key]
          const pctVal = pcts[key]
          return (
            <div key={key} className="cr-row" style={{ paddingLeft: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Toggle checked={isOn} onChange={() => toggle(key)} />
                <span className="cr-label" style={{ color: isOn ? 'var(--text-primary)' : 'var(--text-muted)', transition: 'color 0.2s' }}>
                  {label}
                </span>
              </div>
              <div className="cr-right">
                <button
                  className={`mode-pill${mode === 'pct' ? ' mode-pill-pct' : ''}`}
                  onClick={() => toggleMode(key)}
                  disabled={!isOn}
                  title={mode === 'dollar' ? 'Switch to % of sales price' : 'Switch to flat $'}
                  style={{ opacity: isOn ? 1 : 0.4 }}
                >
                  {mode === 'dollar' ? '$' : '%'}
                </button>
                {mode === 'dollar' ? (
                  <>
                    <span className="cr-sign" style={{
                      color: isOn ? 'var(--text-secondary)' : 'var(--text-muted)',
                      textDecoration: isOn ? 'none' : 'line-through',
                    }}>$</span>
                    <input
                      className="cr-input"
                      value={values[key]}
                      onChange={e => updateValue(key, e.target.value.replace(/[^0-9.,]/g, ''))}
                      inputMode="decimal"
                      disabled={!isOn}
                      style={{
                        color: isOn ? 'var(--text-secondary)' : 'var(--text-muted)',
                        textDecoration: isOn ? 'none' : 'line-through',
                        background: isOn ? 'rgba(255,255,255,0.06)' : 'transparent',
                        borderColor: isOn ? 'var(--border-glass)' : 'transparent',
                        cursor: isOn ? 'text' : 'not-allowed',
                      }}
                    />
                  </>
                ) : (
                  <>
                    <input
                      className="cr-input cr-pct-input"
                      value={pctVal}
                      onChange={e => onPctChange(key, e.target.value)}
                      inputMode="decimal"
                      disabled={!isOn}
                      placeholder="0.0"
                      style={{ opacity: isOn ? 1 : 0.5 }}
                    />
                    <span className="cr-pct-sym">%</span>
                    <span className="cr-pct-result">= ${values[key]}</span>
                  </>
                )}
              </div>
            </div>
          )
        })}

        <div className="sheet-total-row" style={{ borderRadius: '0 0 14px 14px' }}>
          <span className="sheet-total-label">Selected Total</span>
          <span className="sheet-total-value">${totalFormatted}</span>
        </div>
      </div>
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      style={{
        width: '30px', height: '17px', borderRadius: '999px',
        background: checked ? 'linear-gradient(135deg, var(--accent-brown), var(--accent-green))' : 'rgba(148,163,184,0.2)',
        border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: '2px',
        left: checked ? '15px' : '2px',
        width: '13px', height: '13px', borderRadius: '50%',
        background: 'white', transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </button>
  )
}

function SectionHeader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '2px 0 8px' }}>
      <div className="sheet-icon-wrap" style={{ width: '28px', height: '28px' }}>
        <ReceiptIcon size={15} color="var(--accent-green-bright)" />
      </div>
      <div>
        <h3 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.95rem' }}>Title &amp; Escrow Fee Estimate</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>Toggle, enter flat $ or % of sales price</p>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
      <div className="sheet-icon-wrap" style={{ width: '52px', height: '52px', margin: '0 auto 12px' }}>
        <ReceiptIcon size={24} color="var(--accent-green-bright)" />
      </div>
      <p style={{ fontSize: '0.9rem' }}>Enter a sales price to generate the fee estimate.</p>
    </div>
  )
}
