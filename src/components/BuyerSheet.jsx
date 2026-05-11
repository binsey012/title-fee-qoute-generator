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

function initFees(result) {
  if (!result) return {}
  const bd = result.buyer.breakdown
  const credits = result.buyer.creditsBreakdown || {}
  return {
    loanOrigination:         bd.loanOrigination         || '0.00',
    appraisalFee:            bd.appraisalFee            || '0.00',
    underwritingFee:         bd.underwritingFee         || '0.00',
    prepaidInterest:         bd.prepaidInterest         || '0.00',
    homeownersInsurance:     bd.homeownersInsurance     || '0.00',
    initialEscrowDeposit:    bd.initialEscrowDeposit    || '0.00',
    upfrontMip:              bd.upfrontMip              || '0.00',
    vaFundingFee:            bd.vaFundingFee            || '0.00',
    taxServiceFee:           bd.taxServiceFee           || '0.00',
    taxReserve:              bd.taxReserve              || '0.00',
    ownersTitleInsurance:    bd.ownersTitleInsurance    || '0.00',
    lendersTitleInsurance:   bd.lendersTitleInsurance   || '0.00',
    escrowFee:               bd.escrowFee               || '0.00',
    settlementFee:           bd.settlementFee           || '0.00',
    closingProtectionLetter: bd.closingProtectionLetter || '0.00',
    inspectionFee:           bd.inspectionFee           || '0.00',
    surveyFee:               bd.surveyFee               || '0.00',
    hoaEstoppelFee:          bd.hoaEstoppelFee          || '0.00',
    earnestMoneyDeposit:     credits.earnestMoneyDeposit  || '0.00',
    proratedTaxCredit:       credits.proratedTaxCredit    || '0.00',
    lenderCredit:            credits.lenderCredit         || '0.00',
    deedRecording:           bd.deedRecording           || '0.00',
    mortgageRecording:       bd.mortgageRecording       || '0.00',
    transferTaxBuyerSide:    bd.transferTaxBuyerSide    || '0.00',
  }
}

const LOANS_KEYS     = ['loanOrigination','appraisalFee','underwritingFee','prepaidInterest','homeownersInsurance','initialEscrowDeposit','upfrontMip','vaFundingFee']
const TAXES_KEYS     = ['taxServiceFee','taxReserve']
const TITLE_KEYS     = ['ownersTitleInsurance','lendersTitleInsurance','escrowFee','settlementFee','closingProtectionLetter']
const COSTS_KEYS     = ['inspectionFee','surveyFee','hoaEstoppelFee']
const CREDITS_KEYS   = ['earnestMoneyDeposit','proratedTaxCredit','lenderCredit']
const RECORDING_KEYS = ['deedRecording','mortgageRecording','transferTaxBuyerSide']

// ─── Component ───────────────────────────────────────────────────────────────

export default function BuyerSheet({ result, concession, onTotalChange }) {
  const [open, setOpen] = useState({ loans: false, taxes: false, title: false, credits: false, recording: false })
  const [fees, setFees] = useState(() => initFees(result))

  useEffect(() => { setFees(initFees(result)) }, [result])

  const update = (key, val) => setFees(prev => ({ ...prev, [key]: val }))
  const toggle = (key) => setOpen(prev => ({ ...prev, [key]: !prev[key] }))

  if (!result) return <EmptyState />

  const { salesPrice, loanAmount, downPayment, earnestMoneyDeposit, propertyLocation, closingDate, transactionType, loanType } = result

  const loansTotal     = sumKeys(fees, LOANS_KEYS)
  const taxesTotal     = sumKeys(fees, TAXES_KEYS)
  const titleTotal     = sumKeys(fees, TITLE_KEYS)
  const costsTotal     = sumKeys(fees, COSTS_KEYS)
  const creditsTotal   = sumKeys(fees, CREDITS_KEYS) + parseDollar(concession)
  const recordingTotal = sumKeys(fees, RECORDING_KEYS)
  const downPaymentAmt = parseDollar(downPayment)
  const cashToClose    = downPaymentAmt + loansTotal + taxesTotal + titleTotal + costsTotal + recordingTotal - creditsTotal

  useEffect(() => {
    if (onTotalChange) onTotalChange(fmtDollar(cashToClose))
  }, [cashToClose]) // eslint-disable-line react-hooks/exhaustive-deps

  const concessionAmt = parseDollar(concession)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <SectionHeader title="Buyer Close Sheet" subtitle="Estimated funds required to close" />
      <div className="glass-card buyer-sheet-grid" style={{ overflow: 'hidden' }}>

        <InfoRow label="Property Location"     value={propertyLocation || 'Not selected'} />
        <InfoRow label="Estimated Close Date"  value={closingDate} />
        <InfoRow label="Transaction Type"      value={transactionType === 'sale_purchase_cash' ? 'Sale Purchase with Cash' : 'Sale Purchase with Mortgage'} />
        <InfoRow label="Sales Price"           value={`$${salesPrice}`} />
        <InfoRow label="Loan Type"             value={loanType?.toUpperCase()} />
        <InfoRow label="Earnest Money Deposit" value={`$${earnestMoneyDeposit || '0.00'}`} />
        <InfoRow label="Loan Amount"           value={`$${loanAmount}`} />
        <InfoRow label="Down Payment">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="buyer-value">${downPayment}</span>
            <span className="buyer-meta">{result.downPaymentPct}%</span>
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
            <EditableRow key={key} label={label} value={fees[key]} onChange={v => update(key, v)} isNegative indent />
          ))}
          <SubtotalRow label="Loans & Prepaids Subtotal" value={loansTotal} negative />
        </AccordionRow>

        <AccordionRow label="Property Taxes" value={`$${fmtDollar(taxesTotal)}`} isOpen={open.taxes} onToggle={() => toggle('taxes')}>
          {[
            { key: 'taxServiceFee', label: 'Tax Service Fee' },
            { key: 'taxReserve',    label: 'Tax Reserve Escrow' },
          ].map(({ key, label }) => (
            <EditableRow key={key} label={label} value={fees[key]} onChange={v => update(key, v)} isNegative indent />
          ))}
          <SubtotalRow label="Tax Section Subtotal" value={taxesTotal} negative />
        </AccordionRow>

        <AccordionRow label="Title & Escrow" value={`$${fmtDollar(titleTotal)}`} isOpen={open.title} onToggle={() => toggle('title')}>
          {[
            { key: 'ownersTitleInsurance',    label: "Owner's Title Insurance" },
            { key: 'lendersTitleInsurance',   label: "Lender's Title Insurance" },
            { key: 'escrowFee',               label: 'Escrow Fee' },
            { key: 'settlementFee',           label: 'Settlement Fee' },
            { key: 'closingProtectionLetter', label: 'Closing Protection Letter' },
          ].map(({ key, label }) => (
            <EditableRow key={key} label={label} value={fees[key]} onChange={v => update(key, v)} isNegative indent />
          ))}
          <SubtotalRow label="Title & Escrow Subtotal" value={titleTotal} negative />
        </AccordionRow>

        <AccordionRow label="Closing Costs and Credits" value={`$${fmtDollar(costsTotal)}`} isOpen={open.credits} onToggle={() => toggle('credits')}>
          {[
            { key: 'inspectionFee',  label: 'Inspection Fee' },
            { key: 'surveyFee',      label: 'Survey Fee' },
            { key: 'hoaEstoppelFee', label: 'HOA Estoppel Fee' },
          ].map(({ key, label }) => (
            <EditableRow key={key} label={label} value={fees[key]} onChange={v => update(key, v)} isNegative indent />
          ))}
          <SubtotalRow label="Section Subtotal" value={costsTotal} negative />
          <EditableRow label="Earnest Money Credit" value={fees.earnestMoneyDeposit} onChange={v => update('earnestMoneyDeposit', v)} isCredit indent />
          <EditableRow label="Tax Proration Credit" value={fees.proratedTaxCredit}   onChange={v => update('proratedTaxCredit', v)}   isCredit indent />
          <EditableRow label="Lender Credit"        value={fees.lenderCredit}        onChange={v => update('lenderCredit', v)}        isCredit indent />
          {concessionAmt > 0 && (
            <StaticCreditRow label="Seller Concession" value={fmtDollar(concessionAmt)} />
          )}
        </AccordionRow>

        <AccordionRow label="Recording Fees and Taxes" value={`$${fmtDollar(recordingTotal)}`} isOpen={open.recording} onToggle={() => toggle('recording')}>
          {[
            { key: 'deedRecording',        label: 'Deed Recording' },
            { key: 'mortgageRecording',    label: 'Mortgage Recording' },
            { key: 'transferTaxBuyerSide', label: 'Transfer Taxes' },
          ].map(({ key, label }) => (
            <EditableRow key={key} label={label} value={fees[key]} onChange={v => update(key, v)} isNegative indent />
          ))}
          <SubtotalRow label="Recording and Taxes Subtotal" value={recordingTotal} negative />
        </AccordionRow>

        <div className="buyer-total-row">
          <span className="buyer-total-label">Estimated Cash to Close</span>
          <span className="buyer-total-value">${fmtDollar(cashToClose)}</span>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, children }) {
  return (
    <div className="buyer-row buyer-row-static">
      <span className="buyer-label">{label}</span>
      {children ? children : <span className="buyer-value">{value}</span>}
    </div>
  )
}

function AccordionRow({ label, value, isOpen, onToggle, children }) {
  return (
    <div className="buyer-row-wrap">
      <button className="buyer-row buyer-row-btn" onClick={onToggle}>
        <span className="buyer-label">{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="buyer-value">{value}</span>
          <ChevronIcon size={16} color="#94a3b8" open={isOpen} />
        </div>
      </button>
      {isOpen && <div className="buyer-row-content">{children}</div>}
    </div>
  )
}

function EditableRow({ label, value, onChange, indent, isNegative, isCredit }) {
  const color  = isNegative ? 'var(--red)' : isCredit ? 'var(--green)' : 'var(--text-secondary)'
  const prefix = isNegative ? '-$' : isCredit ? '+$' : '$'
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

function StaticCreditRow({ label, value }) {
  return (
    <div className="calc-row" style={{ paddingLeft: '28px' }}>
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{label}</span>
      <span style={{ color: 'var(--green)', fontSize: '0.875rem', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>+${value}</span>
    </div>
  )
}

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0' }}>
      <div className="sheet-icon-wrap">
        <BuildingIcon size={18} color="var(--accent-green-bright)" />
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
        <BuildingIcon size={24} color="var(--accent-green-bright)" />
      </div>
      <p style={{ fontSize: '0.9rem' }}>Enter a sales price to generate the buyer close sheet.</p>
    </div>
  )
}
