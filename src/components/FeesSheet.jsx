import { useState } from 'react'
import CalculationTable from './CalculationTable'
import { ReceiptIcon } from './icons'

const FEE_KEYS = [
  { key: 'ownersTitleInsurance', label: "Owner's Title Insurance" },
  { key: 'lendersTitleInsurance', label: "Lender's Title Insurance" },
  { key: 'escrowFee', label: 'Escrow / Closing Fee' },
  { key: 'settlementFee', label: 'Settlement Fee' },
  { key: 'recordingFee', label: 'Recording Fee' },
  { key: 'transferTax', label: 'Transfer / Documentary Tax' },
]

export default function FeesSheet({ result }) {
  const [enabled, setEnabled] = useState(() =>
    Object.fromEntries(FEE_KEYS.map(f => [f.key, true]))
  )

  if (!result) return <EmptyState />

  const { fees } = result

  const toggle = (key) => setEnabled(p => ({ ...p, [key]: !p[key] }))

  const activeRows = FEE_KEYS.filter(f => enabled[f.key])
  const totalCents = activeRows.reduce((sum, f) => {
    const val = parseFloat((fees[f.key] || '0').replace(/,/g, ''))
    return sum + Math.round(val * 100)
  }, 0)
  const totalFormatted = (totalCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <SectionHeader />

      <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Toggle fees to include / exclude
        </p>
        {FEE_KEYS.map(({ key, label }) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Toggle checked={enabled[key]} onChange={() => toggle(key)} />
              <span style={{ color: enabled[key] ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '0.875rem', transition: 'color 0.2s' }}>
                {label}
              </span>
            </div>
            <span style={{
              color: enabled[key] ? 'var(--text-secondary)' : 'var(--text-muted)',
              fontSize: '0.875rem',
              fontVariantNumeric: 'tabular-nums',
              textDecoration: enabled[key] ? 'none' : 'line-through',
            }}>
              ${fees[key] || '0.00'}
            </span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px' }}>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.95rem' }}>Selected Total</span>
          <span style={{ color: 'var(--accent-blue-bright)', fontWeight: 700, fontSize: '1rem', fontVariantNumeric: 'tabular-nums' }}>
            ${totalFormatted}
          </span>
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
        width: '36px', height: '20px', borderRadius: '999px',
        background: checked ? 'linear-gradient(135deg, var(--accent-brown), var(--accent-green))' : 'rgba(148,163,184,0.2)',
        border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: '2px',
        left: checked ? '18px' : '2px',
        width: '16px', height: '16px', borderRadius: '50%',
        background: 'white', transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </button>
  )
}

function SectionHeader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0' }}>
      <div className="sheet-icon-wrap">
        <ReceiptIcon size={18} color="var(--accent-green-bright)" />
      </div>
      <div>
        <h3 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.05rem' }}>Title &amp; Escrow Fee Estimate</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Toggle individual fees to customize the estimate</p>
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
