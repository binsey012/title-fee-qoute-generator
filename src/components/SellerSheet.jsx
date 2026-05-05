import Accordion from './Accordion'
import CalculationTable from './CalculationTable'
import { WalletIcon } from './icons'

export default function SellerSheet({ result }) {
  if (!result) return <EmptyState />

  const { seller, salesPrice } = result
  const sd = seller.breakdown

  const deductionRows = [
    { label: 'Agent Commission', value: sd.agentCommission, negative: true, indent: true },
    { label: "Owner's Title Insurance", value: sd.ownersTitleInsurance, negative: true, indent: true },
    { label: 'Escrow Fee', value: sd.escrowFee, negative: true, indent: true },
    { label: 'Transfer Tax', value: sd.transferTax, negative: true, indent: true },
    { label: 'Recording Fee', value: sd.recordingFee, negative: true, indent: true },
    { label: 'Settlement Fee', value: sd.settlementFee, negative: true, indent: true },
    { label: 'Existing Mortgage Payoff', value: sd.existingMortgagePayoff, negative: true, indent: true },
    { label: 'Prorated Tax Credit (to Buyer)', value: sd.proratedTaxCredit, negative: true, indent: true },
    { label: 'Total Deductions', value: seller.totalDeductions, subtotal: true, negative: true },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <SectionHeader
        title="Seller Net Sheet"
        subtitle="Estimated proceeds after costs"
      />

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <CalculationTable rows={[
          { label: 'Sale Price', value: salesPrice, highlight: true },
        ]} />
      </div>

      <Accordion title="Seller Deductions" badge={`-$${seller.totalDeductions}`} defaultOpen={true}>
        <CalculationTable rows={deductionRows} />
      </Accordion>

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <CalculationTable rows={[
          { label: 'Estimated Net Proceeds', value: seller.estimatedNetProceeds, highlight: true },
        ]} />
      </div>
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
      <p style={{ fontSize: '0.9rem' }}>Enter a sales price to generate the seller's net sheet.</p>
    </div>
  )
}
