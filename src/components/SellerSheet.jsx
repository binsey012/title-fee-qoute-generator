import { useState, useEffect } from 'react'
import { WalletIcon } from './icons'

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseDollar(str) {
  if (!str && str !== 0) return 0
  return parseFloat(String(str).replace(/[,$]/g, '')) || 0
}

function fmtDollar(num) {
  const n = typeof num === 'number' ? num : parseFloat(num)
  if (isNaN(n)) return '0.00'
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function sumKeys(obj, keys) {
  return keys.reduce((total, k) => total + parseDollar(obj[k]), 0)
}

// All deduction rows start at zero — no auto-population from API
const ZERO_FEES = {
  agentCommission: '0.00', ownersTitleInsurance: '0.00', escrowFee: '0.00',
  transferTax: '0.00', recordingFee: '0.00', settlementFee: '0.00',
  existingMortgagePayoff: '0.00', proratedTaxCredit: '0.00',
}

const DEDUCTION_KEYS = ['agentCommission','ownersTitleInsurance','escrowFee','transferTax','recordingFee','settlementFee','existingMortgagePayoff','proratedTaxCredit']

// ─── Component ───────────────────────────────────────────────────────────────

export default function SellerSheet({ result, concession, onTotalChange, salesPrice }) {
  const [fees, setFees] = useState(ZERO_FEES)

  const update = (key, val) => setFees(prev => ({ ...prev, [key]: val }))

  // ── All calculations must happen before any early return (Rules of Hooks) ──
  const totalDeductions = sumKeys(fees, DEDUCTION_KEYS) + parseDollar(concession)
  const salesPriceAmt   = parseDollar(result?.salesPrice)
  const netProceeds     = salesPriceAmt - totalDeductions

  useEffect(() => {
    if (result && onTotalChange) onTotalChange(fmtDollar(netProceeds))
  }, [netProceeds, result]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!result) return <EmptyState />

  const { salesPrice: sp } = result
  const concessionAmt = parseDollar(concession)

  return (
    <div className="sheet-wrap">
      <SectionHeader title="Seller Net Sheet" subtitle="Estimated proceeds after costs" />

      <div className="glass-card sheet-grid">
        {/* Sale Price header row */}
        <div className="info-row" style={{ background: 'rgba(20,164,77,0.04)' }}>
          <span className="info-label" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Sale Price</span>
          <span className="info-value" style={{ fontWeight: 700, color: 'var(--accent-green-dark)' }}>${sp}</span>
        </div>

        {/* Deductions header */}
        <div style={{ padding: '7px 14px 3px', borderTop: '1px solid var(--border-glass)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Seller Deductions &nbsp;
            <span style={{ color: 'var(--red)', fontWeight: 600 }}>-${fmtDollar(totalDeductions)}</span>
          </span>
        </div>

        {[
          { key: 'agentCommission',        label: 'Agent Commission' },
          { key: 'ownersTitleInsurance',   label: "Owner's Title Insurance" },
          { key: 'escrowFee',              label: 'Escrow Fee' },
          { key: 'transferTax',            label: 'Transfer Tax' },
          { key: 'recordingFee',           label: 'Recording Fee' },
          { key: 'settlementFee',          label: 'Settlement Fee' },
          { key: 'existingMortgagePayoff', label: 'Mortgage Payoff' },
          { key: 'proratedTaxCredit',      label: 'Prorated Tax Credit' },
        ].map(({ key, label }) => (
          <EditableRow key={key} label={label} value={fees[key]} onChange={v => update(key, v)} isNegative salesPrice={salesPrice} />
        ))}

        {concessionAmt > 0 && (
          <div className="cr-row">
            <span className="cr-label">Seller Concession</span>
            <span style={{ color: 'var(--red)', fontSize: '0.8rem', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>-${fmtDollar(concessionAmt)}</span>
          </div>
        )}

        <div className="subtotal-row">
          <span className="subtotal-label">Total Deductions</span>
          <span className="subtotal-value" style={{ color: 'var(--red)' }}>-${fmtDollar(totalDeductions)}</span>
        </div>

        {/* Net Proceeds */}
        <div className="sheet-total-row">
          <span className="sheet-total-label">Estimated Net Proceeds</span>
          <span className="sheet-total-value" style={{ color: netProceeds >= 0 ? '#fff' : '#fca5a5' }}>
            ${fmtDollar(netProceeds)}
          </span>
        </div>
      </div>
    </div>
  )
}

function EditableRow({ label, value, onChange, isNegative, salesPrice }) {
  const [mode, setMode] = useState('dollar')
  const [pctInput, setPctInput] = useState('')

  useEffect(() => {
    if (mode !== 'pct' || !pctInput) return
    const sp = parseDollar(salesPrice)
    if (sp <= 0) return
    const pct = parseFloat(pctInput) / 100
    if (!isNaN(pct)) onChange(fmtDollar(pct * sp))
  }, [salesPrice]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleMode = () => {
    if (mode === 'dollar') {
      const sp = parseDollar(salesPrice)
      if (sp > 0) {
        const d = parseDollar(value)
        const p = (d / sp) * 100
        setPctInput(p > 0 ? parseFloat(p.toFixed(4)).toString() : '')
      } else { setPctInput('') }
      setMode('pct')
    } else { setMode('dollar') }
  }

  const onPctChange = (raw) => {
    const v = raw.replace(/[^0-9.]/g, '')
    setPctInput(v)
    const sp = parseDollar(salesPrice)
    if (sp > 0) {
      const pct = parseFloat(v) / 100
      onChange(!isNaN(pct) ? fmtDollar(pct * sp) : '0.00')
    }
  }

  const color   = isNegative ? 'var(--red)' : 'var(--text-secondary)'
  const signStr = isNegative ? '-$' : '$'

  return (
    <div className="cr-row" style={{ paddingLeft: '14px' }}>
      <span className="cr-label">{label}</span>
      <div className="cr-right">
        <button
          className={`mode-pill${mode === 'pct' ? ' mode-pill-pct' : ''}`}
          onClick={toggleMode}
          title={mode === 'dollar' ? 'Switch to % of sales price' : 'Switch to flat $'}
        >
          {mode === 'dollar' ? '$' : '%'}
        </button>
        {mode === 'dollar' ? (
          <>
            <span className="cr-sign" style={{ color }}>{signStr}</span>
            <input
              className="cr-input"
              value={value}
              onChange={e => onChange(e.target.value.replace(/[^0-9.,]/g, ''))}
              inputMode="decimal"
              style={{ color }}
            />
          </>
        ) : (
          <>
            <input
              className="cr-input cr-pct-input"
              value={pctInput}
              onChange={e => onPctChange(e.target.value)}
              inputMode="decimal"
              placeholder="0.0"
            />
            <span className="cr-pct-sym">%</span>
            <span className="cr-pct-result" style={{ color }}>= {signStr}{value}</span>
          </>
        )}
      </div>
    </div>
  )
}

function SubtotalRow({ label, value, negative }) {
  return (
    <div className="subtotal-row">
      <span className="subtotal-label">{label}</span>
      <span className="subtotal-value" style={{ color: negative ? 'var(--red)' : 'var(--text-primary)' }}>
        {negative ? '-' : ''}${fmtDollar(value)}
      </span>
    </div>
  )
}

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '2px 0 8px' }}>
      <div className="sheet-icon-wrap" style={{ width: '28px', height: '28px' }}>
        <WalletIcon size={15} color="var(--accent-green-bright)" />
      </div>
      <div>
        <h3 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.95rem' }}>{title}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>{subtitle}</p>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
      <div className="sheet-icon-wrap" style={{ width: '52px', height: '52px', margin: '0 auto 12px' }}>
        <WalletIcon size={24} color="var(--accent-green-bright)" />
      </div>
      <p style={{ fontSize: '0.9rem' }}>Enter a sales price to generate the seller net sheet.</p>
    </div>
  )
}
