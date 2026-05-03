import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

function addSection(doc, title, rows, startY) {
  doc.setFontSize(11)
  doc.setTextColor(40, 80, 160)
  doc.text(title, 14, startY)

  autoTable(doc, {
    startY: startY + 4,
    head: [['Description', 'Amount']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [245, 247, 255] },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  })

  return doc.lastAutoTable.finalY + 8
}

export function exportToPDF(result, form, meta = {}) {
  if (!result) return

  const doc = new jsPDF({ unit: 'mm', format: 'letter' })
  const pageW = doc.internal.pageSize.getWidth()

  // ── Header ──────────────────────────────────────────────────────────────
  doc.setFillColor(37, 99, 235)
  doc.rect(0, 0, pageW, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('Title & Fee Quote Generator', 14, 12)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 20)
  doc.text(`Closing Date: ${result.closingDate}`, pageW - 14, 20, { align: 'right' })

  doc.setTextColor(30, 30, 30)

  let y = 36

  // ── Transaction Summary ──────────────────────────────────────────────────
  const summaryRows = [
    ['Property Location', result.propertyLocation || 'Not provided'],
    ['Sales Price', `$${result.salesPrice}`],
    ['Loan Amount', `$${result.loanAmount}`],
    ['Down Payment', `$${result.downPayment} (${result.downPaymentPct}%)`],
    ['Earnest Money Deposit', `$${result.earnestMoneyDeposit || '0.00'}`],
    ['Transaction Type', result.transactionType === 'sale_purchase_cash' ? 'Sale Purchase with Cash' : 'Sale Purchase with Mortgage'],
    ['Loan Type', (result.loanType || '').toUpperCase()],
  ]
  y = addSection(doc, 'Transaction Summary', summaryRows, y)

  const profileRows = [
    ['Borrower Name(s)', meta.borrowerNames || 'Not provided'],
    ['Property Street Address', meta.propertyStreetAddress || 'Not provided'],
    ['Prepared By', meta.preparedByName || 'Not provided'],
    ['Prepared By Company', meta.preparedByCompany || 'Not provided'],
    ['Prepared By Email', meta.preparedByEmail || 'Not provided'],
    ['Prepared For', meta.preparedForName || 'Not provided'],
    ['Prepared For Company', meta.preparedForCompany || 'Not provided'],
    ['Prepared For Email', meta.preparedForEmail || 'Not provided'],
  ]
  y = addSection(doc, 'Estimate Parties', profileRows, y)

  // ── Buyer Close Sheet ──────────────────────────────────────────────────
  const bd = result.buyer.breakdown
  const st = result.buyer.sectionTotals || {}
  const cb = result.buyer.creditsBreakdown || {}
  const buyerRows = [
    ['Down Payment', `$${result.downPayment}`],
    ['Loans & Prepaids Subtotal', `$${st.loansAndPrepaids || '0.00'}`],
    ['Loan Origination', `$${bd.loanOrigination}`],
    ['Appraisal Fee', `$${bd.appraisalFee}`],
    ['Underwriting Fee', `$${bd.underwritingFee || '0.00'}`],
    ['Prepaid Interest', `$${bd.prepaidInterest}`],
    ['Initial Escrow Deposit', `$${bd.initialEscrowDeposit || '0.00'}`],
    ['Upfront MIP / VA Funding', `$${bd.upfrontMip || '0.00'}`],
    ['Property Taxes Subtotal', `$${st.propertyTaxes || '0.00'}`],
    ['Tax Service Fee', `$${bd.taxServiceFee || '0.00'}`],
    ['Tax Reserve', `$${bd.taxReserve || '0.00'}`],
    ['Title & Escrow Subtotal', `$${st.titleAndEscrow || '0.00'}`],
    ["Lender's Title Insurance", `$${bd.lendersTitleInsurance}`],
    ["Owner's Title Insurance", `$${bd.ownersTitleInsurance}`],
    ['Escrow Fee', `$${bd.escrowFee}`],
    ['Settlement Fee', `$${bd.settlementFee || '0.00'}`],
    ['Closing Protection Letter', `$${bd.closingProtectionLetter || '0.00'}`],
    ['Closing Costs Subtotal', `$${st.closingCostsAndCredits || '0.00'}`],
    ['Inspection Fee', `$${bd.inspectionFee}`],
    ['Survey Fee', `$${bd.surveyFee || '0.00'}`],
    ['Recording & Taxes Subtotal', `$${st.recordingFeesAndTaxes || '0.00'}`],
    ['Deed Recording', `$${bd.deedRecording || '0.00'}`],
    ['Mortgage Recording', `$${bd.mortgageRecording || '0.00'}`],
    ['Buyer Transfer Taxes', `$${bd.transferTaxBuyerSide || '0.00'}`],
    ['Earnest Money Credit', `-$${cb.earnestMoneyDeposit || '0.00'}`],
    ['Tax Proration Credit', `-$${cb.proratedTaxCredit || '0.00'}`],
    ['Lender Credit', `-$${cb.lenderCredit || '0.00'}`],
    ['ESTIMATED CASH TO CLOSE', `$${result.buyer.estimatedCashToClose}`],
  ]
  y = addSection(doc, 'Buyer Close Sheet — Estimated Cash to Close', buyerRows, y)

  // ── Seller Net Sheet ──────────────────────────────────────────────────
  if (y > 220) { doc.addPage(); y = 20 }
  const sd = result.seller.breakdown
  const sellerRows = [
    ['Sale Price', `$${result.salesPrice}`],
    ['Agent Commission', `-$${sd.agentCommission}`],
    ["Owner's Title Insurance", `-$${sd.ownersTitleInsurance}`],
    ['Escrow Fee', `-$${sd.escrowFee}`],
    ['Transfer Tax', `-$${sd.transferTax}`],
    ['Recording Fee', `-$${sd.recordingFee}`],
    ['Settlement Fee', `-$${sd.settlementFee}`],
    ['Existing Mortgage Payoff', `-$${sd.existingMortgagePayoff}`],
    ['Prorated Tax Credit', `-$${sd.proratedTaxCredit}`],
    ['ESTIMATED NET PROCEEDS', `$${result.seller.estimatedNetProceeds}`],
  ]
  y = addSection(doc, 'Seller Net Sheet — Estimated Net Proceeds', sellerRows, y)

  // ── Title & Escrow Fees ──────────────────────────────────────────────
  if (y > 220) { doc.addPage(); y = 20 }
  const feeRows = [
    ["Owner's Title Insurance", `$${result.fees.ownersTitleInsurance}`],
    ["Lender's Title Insurance", `$${result.fees.lendersTitleInsurance}`],
    ['Escrow Fee', `$${result.fees.escrowFee}`],
    ['Settlement Fee', `$${result.fees.settlementFee}`],
    ['Recording Fee', `$${result.fees.recordingFee}`],
    ['Transfer Tax', `$${result.fees.transferTax}`],
    ['TOTAL TITLE & ESCROW', `$${result.fees.totalTitleAndEscrow}`],
  ]
  y = addSection(doc, 'Title & Escrow Fee Estimate', feeRows, y)

  // ── Footer disclaimer ──────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight()
  doc.setFontSize(7)
  doc.setTextColor(150, 150, 150)
  doc.text(
    'This estimate is for informational purposes only and does not constitute a binding commitment. Actual fees may vary.',
    14, pageH - 10
  )

  doc.save(`title-fee-quote-${result.closingDate}.pdf`)
}
