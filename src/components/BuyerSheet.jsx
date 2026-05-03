import { useState } from 'react'
import CalculationTable from './CalculationTable'
import { BuildingIcon, ChevronIcon } from './icons'

export default function BuyerSheet({ result }) {
  if (!result) return <EmptyState />

  const { buyer, salesPrice, loanAmount, downPayment, earnestMoneyDeposit, propertyLocation, closingDate, transactionType, loanType } = result
  const bd = buyer.breakdown
  const sections = buyer.sectionTotals || {}
  const credits = buyer.creditsBreakdown || {}
  const [open, setOpen] = useState({
    loans: false,
    taxes: false,
    title: false,
    credits: false,
    recording: false,
  })

  const toggle = (key) => setOpen((prev) => ({ ...prev, [key]: !prev[key] }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <SectionHeader title="Buyer Close Sheet" subtitle="Estimated funds required to close" />

      <div className="glass-card buyer-sheet-grid" style={{ overflow: 'hidden' }}>
        <div className="buyer-row buyer-row-static">
          <span className="buyer-label">Property Location</span>
          <span className="buyer-value">{propertyLocation || 'Not selected'}</span>
        </div>
        <div className="buyer-row buyer-row-static">
          <span className="buyer-label">Estimated Close Date</span>
          <span className="buyer-value">{closingDate}</span>
        </div>
        <div className="buyer-row buyer-row-static">
          <span className="buyer-label">Transaction Type</span>
          <span className="buyer-value">
            {transactionType === 'sale_purchase_cash' ? 'Sale Purchase with Cash' : 'Sale Purchase with Mortgage'}
          </span>
        </div>
        <div className="buyer-row buyer-row-static">
          <span className="buyer-label">Sales Price</span>
          <span className="buyer-value">${salesPrice}</span>
        </div>
        <div className="buyer-row buyer-row-static">
          <span className="buyer-label">Loan Type</span>
          <span className="buyer-value" style={{ textTransform: 'uppercase' }}>{loanType}</span>
        </div>
        <div className="buyer-row buyer-row-static">
          <span className="buyer-label">Earnest Money Deposit</span>
          <span className="buyer-value">${earnestMoneyDeposit || '0.00'}</span>
        </div>
        <div className="buyer-row buyer-row-static">
          <span className="buyer-label">Loan Amount</span>
          <span className="buyer-value">${loanAmount}</span>
        </div>
        <div className="buyer-row buyer-row-static">
          <span className="buyer-label">Down Payment</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="buyer-value">${downPayment}</span>
            <span className="buyer-meta">{result.downPaymentPct}%</span>
          </div>
        </div>

        <SheetAccordionRow
          label="Loans & Prepaids"
          value={`$${sections.loansAndPrepaids || '0.00'}`}
          isOpen={open.loans}
          onToggle={() => toggle('loans')}
        >
          <CalculationTable rows={[
            { label: 'Loan Origination', value: bd.loanOrigination, negative: true, indent: true },
            { label: 'Appraisal Fee', value: bd.appraisalFee, negative: true, indent: true },
            { label: 'Underwriting Fee', value: bd.underwritingFee, negative: true, indent: true },
            { label: 'Prepaid Interest', value: bd.prepaidInterest, negative: true, indent: true },
            { label: "Homeowner's Insurance", value: bd.homeownersInsurance, negative: true, indent: true },
            { label: 'Initial Escrow Deposit', value: bd.initialEscrowDeposit, negative: true, indent: true },
            { label: 'Upfront MIP (FHA)', value: bd.upfrontMip, negative: true, indent: true },
            { label: 'VA Funding Fee', value: bd.vaFundingFee, negative: true, indent: true },
            { label: 'Loans & Prepaids Subtotal', value: sections.loansAndPrepaids, subtotal: true, negative: true },
          ]} />
        </SheetAccordionRow>

        <SheetAccordionRow
          label="Property Taxes"
          value={`$${sections.propertyTaxes || '0.00'}`}
          isOpen={open.taxes}
          onToggle={() => toggle('taxes')}
        >
          <CalculationTable rows={[
            { label: 'Tax Service Fee', value: bd.taxServiceFee, negative: true, indent: true },
            { label: 'Tax Reserve Escrow', value: bd.taxReserve, negative: true, indent: true },
            { label: 'Tax Section Subtotal', value: sections.propertyTaxes, subtotal: true, negative: true },
          ]} />
        </SheetAccordionRow>

        <SheetAccordionRow
          label="Title & Escrow"
          value={`$${sections.titleAndEscrow || '0.00'}`}
          isOpen={open.title}
          onToggle={() => toggle('title')}
        >
          <CalculationTable rows={[
            { label: "Owner's Title Insurance", value: bd.ownersTitleInsurance, negative: true, indent: true },
            { label: "Lender's Title Insurance", value: bd.lendersTitleInsurance, negative: true, indent: true },
            { label: 'Escrow Fee', value: bd.escrowFee, negative: true, indent: true },
            { label: 'Settlement Fee', value: bd.settlementFee, negative: true, indent: true },
            { label: 'Closing Protection Letter', value: bd.closingProtectionLetter, negative: true, indent: true },
            { label: 'Title & Escrow Subtotal', value: sections.titleAndEscrow, subtotal: true, negative: true },
          ]} />
        </SheetAccordionRow>

        <SheetAccordionRow
          label="Closing Costs and Credits"
          value={`$${sections.closingCostsAndCredits || '0.00'}`}
          isOpen={open.credits}
          onToggle={() => toggle('credits')}
        >
          <CalculationTable rows={[
            { label: 'Inspection Fee', value: bd.inspectionFee, negative: true, indent: true },
            { label: 'Survey Fee', value: bd.surveyFee, negative: true, indent: true },
            { label: 'HOA Estoppel Fee', value: bd.hoaEstoppelFee, negative: true, indent: true },
            { label: 'Section Subtotal', value: sections.closingCostsAndCredits, subtotal: true, negative: true },
            { label: 'Earnest Money Credit', value: credits.earnestMoneyDeposit, credit: true, indent: true },
            { label: 'Tax Proration Credit', value: credits.proratedTaxCredit, credit: true, indent: true },
            { label: 'Lender Credit', value: credits.lenderCredit, credit: true, indent: true },
          ]} />
        </SheetAccordionRow>

        <SheetAccordionRow
          label="Recording Fees and Taxes"
          value={`$${sections.recordingFeesAndTaxes || '0.00'}`}
          isOpen={open.recording}
          onToggle={() => toggle('recording')}
        >
          <CalculationTable rows={[
            { label: 'Deed Recording', value: bd.deedRecording, negative: true, indent: true },
            { label: 'Mortgage Recording', value: bd.mortgageRecording, negative: true, indent: true },
            { label: 'Transfer Taxes', value: bd.transferTaxBuyerSide, negative: true, indent: true },
            { label: 'Recording and Taxes Subtotal', value: sections.recordingFeesAndTaxes, subtotal: true, negative: true },
          ]} />
        </SheetAccordionRow>

        <div className="buyer-total-row">
          <span className="buyer-total-label">Estimated Cash to Close</span>
          <span className="buyer-total-value">${buyer.estimatedCashToClose}</span>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0' }}>
      <div className="sheet-icon-wrap">
        <BuildingIcon size={18} color="#60a5fa" />
      </div>
      <div>
        <h3 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.05rem' }}>{title}</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{subtitle}</p>
      </div>
    </div>
  )
}

function SheetAccordionRow({ label, value, isOpen, onToggle, children }) {
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

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
      <div className="sheet-icon-wrap" style={{ width: '52px', height: '52px', margin: '0 auto 12px' }}>
        <BuildingIcon size={24} color="#60a5fa" />
      </div>
      <p style={{ fontSize: '0.9rem' }}>Enter a sales price to generate the buyer's close sheet.</p>
    </div>
  )
}
