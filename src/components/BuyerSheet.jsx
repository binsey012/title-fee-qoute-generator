import { useState, useEffect } from 'react'
import { BuildingIcon, ChevronIcon } from './icons'

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

// All manual-entry sections start at zero — no auto-population from API
const ZERO_FEES = {
  loanOrigination: '0.00', appraisalFee: '0.00', underwritingFee: '0.00',
  prepaidInterest: '0.00', homeownersInsurance: '0.00', initialEscrowDeposit: '0.00',
  upfrontMip: '0.00', vaFundingFee: '0.00',
  taxServiceFee: '0.00', taxReserve: '0.00',
  ownersTitleInsurance: '0.00', lendersTitleInsurance: '0.00', escrowFee: '0.00',
  settlementFee: '0.00', closingProtectionLetter: '0.00',
  inspectionFee: '0.00', surveyFee: '0.00', hoaEstoppelFee: '0.00',
  earnestMoneyDeposit: '0.00', proratedTaxCredit: '0.00', lenderCredit: '0.00',
  deedRecording: '0.00', mortgageRecording: '0.00', transferTaxBuyerSide: '0.00',
}

const LOANS_KEYS     = ['loanOrigination','appraisalFee','underwritingFee','prepaidInterest','homeownersInsurance','initialEscrowDeposit','upfrontMip','vaFundingFee']
const TAXES_KEYS     = ['taxServiceFee','taxReserve']
const TITLE_KEYS     = ['ownersTitleInsurance','lendersTitleInsurance','escrowFee','settlementFee','closingProtectionLetter']
const COSTS_KEYS     = ['inspectionFee','surveyFee','hoaEstoppelFee']
const CREDITS_KEYS   = ['earnestMoneyDeposit','proratedTaxCredit','lenderCredit']
const RECORDING_KEYS = ['deedRecording','mortgageRecording','transferTaxBuyerSide']

// ─── Component ───────────────────────────────────────────────────────────────

export default function BuyerSheet({ result, concession, onTotalChange, salesPrice }) {
  const [open, setOpen] = useState({ loans: false, taxes: false, title: false, credits: false, recording: false })
  const [fees, setFees] = useState(ZERO_FEES)

  const update = (key, val) => setFees(prev => ({ ...prev, [key]: val }))
  const toggle = (key) => setOpen(prev => ({ ...prev, [key]: !prev[key] }))

  // ── All calculations must happen before any early return (Rules of Hooks) ──
  const loansTotal     = sumKeys(fees, LOANS_KEYS)
  const taxesTotal     = sumKeys(fees, TAXES_KEYS)
  const titleTotal     = sumKeys(fees, TITLE_KEYS)
  const costsTotal     = sumKeys(fees, COSTS_KEYS)
  const creditsTotal   = sumKeys(fees, CREDITS_KEYS) + parseDollar(concession)
  const recordingTotal = sumKeys(fees, RECORDING_KEYS)
  const downPaymentAmt = parseDollar(result?.downPayment)
  const cashToClose    = downPaymentAmt + loansTotal + taxesTotal + titleTotal + costsTotal + recordingTotal - creditsTotal

  useEffect(() => {
    if (result && onTotalChange) onTotalChange(fmtDollar(cashToClose))
  }, [cashToClose, result]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!result) return <EmptyState />

  const { loanAmount, downPayment, earnestMoneyDeposit, propertyLocation, closingDate, transactionType, loanType } = result
  const sp = result.salesPrice
  const concessionAmt = parseDollar(concession)

  return (
    <div className="sheet-wrap">
      <SectionHeader title="Buyer Close Sheet" subtitle="Estimated funds required to close" />
      <div className="glass-card sheet-grid">

        <InfoRow label="Property Location"     value={propertyLocation || 'Not selected'} />
        <InfoRow label="Close Date"            value={closingDate} />
        <InfoRow label="Transaction"           value={transactionType === 'sale_purchase_cash' ? 'Cash Purchase' : 'Mortgage Purchase'} />
        <InfoRow label="Sales Price"           value={`$${sp}`} />
        <InfoRow label="Loan Type / Amount"    value={`${loanType?.toUpperCase()} · $${loanAmount}`} />
        <InfoRow label="Earnest Money"         value={`$${earnestMoneyDeposit || '0.00'}`} />
        <InfoRow label="Down Payment">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="info-value">${downPayment}</span>
            <span className="badge-pill">{result.downPaymentPct}%</span>
          </div>
        </InfoRow>

        <AccordionRow label="Loans & Prepaids" value={`$${fmtDollar(loansTotal)}`} isOpen={open.loans} onToggle={() => toggle('loans')}>
          {[
            { key: 'loanOrigination',      label: 'Loan Origination' },
            { key: 'appraisalFee',         label: 'Appraisal Fee' },
            { key: 'underwritingFee',      label: 'Underwriting Fee' },
            { key: 'prepaidInterest',      label: 'Prepaid Interest' },
            { key: 'homeownersInsurance',  label: "Homeowner's Insurance" },
            { key: 'initialEscrowDeposit', label: 'Initial Escrow Deposit' },
            { key: 'upfrontMip',           label: 'Upfront MIP (FHA)' },
            { key: 'vaFundingFee',         label: 'VA Funding Fee' },
          ].map(({ key, label }) => (
            <EditableRow key={key} label={label} value={fees[key]} onChange={v => update(key, v)} isNegative indent salesPrice={salesPrice} />
          ))}
          <SubtotalRow label="Loans & Prepaids" value={loansTotal} negative />
        </AccordionRow>

        <AccordionRow label="Property Taxes" value={`$${fmtDollar(taxesTotal)}`} isOpen={open.taxes} onToggle={() => toggle('taxes')}>
          {[
            { key: 'taxServiceFee', label: 'Tax Service Fee' },
            { key: 'taxReserve',    label: 'Tax Reserve Escrow' },
          ].map(({ key, label }) => (
            <EditableRow key={key} label={label} value={fees[key]} onChange={v => update(key, v)} isNegative indent salesPrice={salesPrice} />
          ))}
          <SubtotalRow label="Tax Section" value={taxesTotal} negative />
        </AccordionRow>

        <AccordionRow label="Title & Escrow" value={`$${fmtDollar(titleTotal)}`} isOpen={open.title} onToggle={() => toggle('title')}>
          {[
            { key: 'ownersTitleInsurance',    label: "Owner's Title Ins." },
            { key: 'lendersTitleInsurance',   label: "Lender's Title Ins." },
            { key: 'escrowFee',               label: 'Escrow Fee' },
            { key: 'settlementFee',           label: 'Settlement Fee' },
            { key: 'closingProtectionLetter', label: 'Closing Protection Letter' },
          ].map(({ key, label }) => (
            <EditableRow key={key} label={label} value={fees[key]} onChange={v => update(key, v)} isNegative indent salesPrice={salesPrice} />
          ))}
          <SubtotalRow label="Title & Escrow" value={titleTotal} negative />
        </AccordionRow>

        <AccordionRow label="Closing Costs & Credits" value={`$${fmtDollar(costsTotal - creditsTotal)}`} isOpen={open.credits} onToggle={() => toggle('credits')}>
          {[
            { key: 'inspectionFee',  label: 'Inspection Fee' },
            { key: 'surveyFee',      label: 'Survey Fee' },
            { key: 'hoaEstoppelFee', label: 'HOA Estoppel Fee' },
          ].map(({ key, label }) => (
            <EditableRow key={key} label={label} value={fees[key]} onChange={v => update(key, v)} isNegative indent salesPrice={salesPrice} />
          ))}
          <SubtotalRow label="Costs Subtotal" value={costsTotal} negative />
          <EditableRow label="Earnest Money Credit" value={fees.earnestMoneyDeposit} onChange={v => update('earnestMoneyDeposit', v)} isCredit indent salesPrice={salesPrice} />
          <EditableRow label="Tax Proration Credit" value={fees.proratedTaxCredit}   onChange={v => update('proratedTaxCredit', v)}   isCredit indent salesPrice={salesPrice} />
          <EditableRow label="Lender Credit"        value={fees.lenderCredit}        onChange={v => update('lenderCredit', v)}        isCredit indent salesPrice={salesPrice} />
          {concessionAmt > 0 && (
            <StaticCreditRow label="Seller Concession" value={fmtDollar(concessionAmt)} />
          )}
        </AccordionRow>

        <AccordionRow label="Recording Fees & Taxes" value={`$${fmtDollar(recordingTotal)}`} isOpen={open.recording} onToggle={() => toggle('recording')}>
          {[
            { key: 'deedRecording',        label: 'Deed Recording' },
            { key: 'mortgageRecording',     label: 'Mortgage Recording' },
            { key: 'transferTaxBuyerSide',  label: 'Transfer Taxes' },
          ].map(({ key, label }) => (
            <EditableRow key={key} label={label} value={fees[key]} onChange={v => update(key, v)} isNegative indent salesPrice={salesPrice} />
          ))}
          <SubtotalRow label="Recording & Taxes" value={recordingTotal} negative />
        </AccordionRow>

        <div className="sheet-total-row">
          <span className="sheet-total-label">Estimated Cash to Close</span>
          <span className="sheet-total-value">${fmtDollar(cashToClose)}</span>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, children }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      {children ? children : <span className="info-value">{value}</span>}
    </div>
  )
}

function AccordionRow({ label, value, isOpen, onToggle, children }) {
  return (
    <div className="acc-wrap">
      <button className="acc-header" onClick={onToggle}>
        <span className="acc-label">{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="acc-value">{value}</span>
          <ChevronIcon size={14} color="#94a3b8" open={isOpen} />
        </div>
      </button>
      {isOpen && <div className="acc-body">{children}</div>}
    </div>
  )
}

function EditableRow({ label, value, onChange, indent, isNegative, isCredit, salesPrice }) {
  const [mode, setMode] = useState('dollar')
  const [pctInput, setPctInput] = useState('')

  // Recalculate dollar when salesPrice changes while in pct mode
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

  const color    = isNegative ? 'var(--red)' : isCredit ? 'var(--green)' : 'var(--text-secondary)'
  const signStr  = isNegative ? '-$' : isCredit ? '+$' : '$'

  return (
    <div className="cr-row" style={indent ? { paddingLeft: '20px' } : undefined}>
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

function StaticCreditRow({ label, value }) {
  return (
    <div className="cr-row" style={{ paddingLeft: '20px' }}>
      <span className="cr-label">{label}</span>
      <span style={{ color: 'var(--green)', fontSize: '0.8rem', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>+${value}</span>
    </div>
  )
}

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '2px 0 8px' }}>
      <div className="sheet-icon-wrap" style={{ width: '28px', height: '28px' }}>
        <BuildingIcon size={15} color="var(--accent-green-bright)" />
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
        <BuildingIcon size={24} color="var(--accent-green-bright)" />
      </div>
      <p style={{ fontSize: '0.9rem' }}>Enter a sales price to generate the buyer close sheet.</p>
    </div>
  )
}
