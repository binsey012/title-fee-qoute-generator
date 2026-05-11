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

function initFees(result) {
  if (!result) return {}
  const sd = result.seller.breakdown
  return {
    agentCommission:       sd.agentCommission        || '0.00',
    ownersTitleInsurance:  sd.ownersTitleInsurance   || '0.00',
    escrowFee:             sd.escrowFee              || '0.00',
    transferTax:           sd.transferTax            || '0.00',
    recordingFee:          sd.recordingFee           || '0.00',
    settlementFee:         sd.settlementFee          || '0.00',
    existingMortgagePayoff:sd.existingMortgagePayoff || '0.00',
    proratedTaxCredit:     sd.proratedTaxCredit      || '0.00',
  }
}

const DEDUCTION_KEYS = ['agentCommission','ownersTitleInsurance','escrowFee','transferTax','recordingFee','settlementFee','existingMortgagePayoff','proratedTaxCredit']

// ─── Component ───────────────────────────────────────────────────────────────

export default function SellerSheet({ result, concession, onTotalChange }) {
  const [fees, setFees] = useState(() => initFees(result))

  useEffect(() => { setFees(initFees(result)) }, [result])

  const update = (key, val) => setFees(prev => ({ ...prev, [key]: val }))

  if (!result) return <EmptyState />

  const { salesPrice } = result
  const salesPriceAmt   = parseDollar(salesPrice)
  const totalDeductions = sumKeys(fees, DEDUCTION_KEYS) + parseDollar(concession)
  const netProceeds     = salesPriceAmt - totalDeductions

  useEffect(() => {
    if (onTotalChange) onTotalChange(fmtDollar(netProceeds))
  }, [netProceeds]) // eslint-disable-line react-hooks/exhaustive-deps

  const concessionAmt = parseDollar(concession)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <SectionHeader title="Seller Net Sheet" subtitle="Estimated proceeds after costs" />

      {/* Sale Price */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div className="calc-row">
          <span style={{ color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 600 }}>Sale Price</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums', minWidth: '100px', textAlign: 'right' }}>
            ${salesPrice}
          </span>
        </div>
      </div>

      {/* Seller Deductions */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px 4px', borderBottom: '1px solid var(--border-glass)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
          { key: 'existingMortgagePayoff', label: 'Existing Mortgage Payoff' },
          { key: 'proratedTaxCredit',      label: 'Prorated Tax Credit (to Buyer)' },
        ].map(({ key, label }) => (
          <EditableRow key={key} label={label} value={fees[key]} onChange={v => update(key, v)} isNegative indent />
        ))}
        {concessionAmt > 0 && (
          <EditableStaticRow label="Seller Concession" value={fmtDollar(concessionAmt)} />
        )}
        <SubtotalRow label="Total Deductions" value={totalDeductions} negative />
      </div>

      {/* Net Proceeds */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <div className="calc-row">
          <span style={{ color: 'var(--text-primary)', fontSize: '0.875rem', fontWeight: 600 }}>Estimated Net Proceeds</span>
          <span style={{ color: netProceeds >= 0 ? 'var(--accent-green-bright)' : 'var(--red)', fontWeight: 700, fontSize: '0.875rem', fontVariantNumeric: 'tabular-nums', minWidth: '100px', textAlign: 'right' }}>
            ${fmtDollar(netProceeds)}
          </span>
        </div>
      </div>
    </div>
  )
}

function EditableRow({ label, value, onChange, indent, isNegative }) {
  const color  = isNegative ? 'var(--red)' : 'var(--text-secondary)'
  const prefix = isNegative ? '-$' : '$'
  return (
    <div className="calc-row" style={indent ? { paddingLeft: '28px' } : undefined}>
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
        <span style={{ color, fontSize: '0.875rem', fontWeight: 500, whiteSpace: 'nowrap' }}>{prefix}</span>
        <input
          value={value}
          onChange={e => onChange(e.target.value.replace(/[^0-9.,]/g, ''))}
          inputMode="decimal"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid var(--border-glass)',
            borderRadius: '4px',
            color,
            fontSize: '0.875rem',
            fontVariantNumeric: 'tabular-nums',
            width: '96px',
            textAlign: 'right',
            outline: 'none',
            padding: '2px 6px',
          }}
        />
      </div>
    </div>
  )
}

function EditableStaticRow({ label, value }) {
  return (
    <div className="calc-row" style={{ paddingLeft: '28px' }}>
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{label}</span>
      <span style={{ color: 'var(--red)', fontSize: '0.875rem', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>-${value}</span>
    </div>
  )
}

function SubtotalRow({ label, value, negative }) {
  return (
    <div className="calc-row subtotal">
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', fontWeight: 600 }}>{label}</span>
      <span style={{ color: negative ? 'var(--red)' : 'var(--text-primary)', fontWeight: 700, fontSize: '1rem', fontVariantNumeric: 'tabular-nums', minWidth: '100px', textAlign: 'right' }}>
        {negative ? '-' : ''}${fmtDollar(value)}
      </span>
    </div>
  )
}

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0' }}>
      <div className="sheet-icon-wrap">
        <WalletIcon size={18} color="var(--accent-green-bright)" />
      </div>
      <div>
        <h3 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.05rem' }}>{title}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{subtitle}</p>
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
