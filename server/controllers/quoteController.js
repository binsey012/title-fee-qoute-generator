'use strict'

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Parse a dollar string / number → integer cents, safe against floats */
function toCents(value) {
  const n = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : Number(value)
  if (!isFinite(n)) return 0
  return Math.round(n * 100)
}

/** Format integer cents → "1,234.56" string */
function fmtCents(cents) {
  const abs = Math.abs(cents)
  const dollars = Math.floor(abs / 100)
  const pennies = abs % 100
  const formatted =
    dollars.toLocaleString('en-US') + '.' + String(pennies).padStart(2, '0')
  return cents < 0 ? '-' + formatted : formatted
}

function fmtPercent(value) {
  const n = Number(value)
  if (!isFinite(n)) return '0'
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

/**
 * calculateProrations
 * Returns prorated property tax owed from Jan 1 through closingDate.
 * The seller owes taxes up to but not including the closing date.
 * Returns cents (positive = seller credit to buyer).
 */
function calculateProrations({ annualTaxCents, closingDate }) {
  const closing = new Date(closingDate)
  const year = closing.getFullYear()
  const startOfYear = new Date(year, 0, 1)

  // Days in the year (handle leap years)
  const startOfNextYear = new Date(year + 1, 0, 1)
  const daysInYear = Math.round((startOfNextYear - startOfYear) / 86_400_000)

  // Days seller owned (Jan 1 up to but not including closing day)
  const daysOwed = Math.round((closing - startOfYear) / 86_400_000)

  const dailyRateCents = annualTaxCents / daysInYear
  return Math.round(dailyRateCents * daysOwed)
}

// ─── Fee Tables (all in cents) ───────────────────────────────────────────────

function getTitleInsurance(salesPriceCents) {
  // ALTA owner's title insurance: tiered rate
  const sp = salesPriceCents
  if (sp <= 10000_00) return Math.round(sp * 0.0175)
  if (sp <= 100000_00) return 175_00 + Math.round((sp - 10000_00) * 0.0150)
  if (sp <= 1000000_00) return 175_00 + 1350_00 + Math.round((sp - 100000_00) * 0.0100)
  return 175_00 + 1350_00 + 9000_00 + Math.round((sp - 1000000_00) * 0.0080)
}

function getLenderTitleInsurance(loanAmountCents) {
  if (loanAmountCents <= 0) return 0
  return Math.round(loanAmountCents * 0.0025) + 25_00 // simultaneous issue rate
}

function getEscrowFee(salesPriceCents) {
  return 350_00 + Math.round(salesPriceCents * 0.001)
}

function getRecordingFee(transactionType) {
  return transactionType === 'sale_purchase_cash' ? 95_00 : 125_00
}

function getTransferTax(salesPriceCents, locationData = {}) {
  // Default: state documentary stamp tax 0.70 per $100
  const rate = locationData.transferTaxRate != null ? locationData.transferTaxRate : 0.007
  return Math.round(salesPriceCents * rate)
}

// ─── Main Controller ─────────────────────────────────────────────────────────

function generateQuote(req, res) {
  try {
    const {
      salesPrice,
      loanAmount,
      downPayment,
      earnestMoneyDeposit = 0,
      loanType = 'conventional',
      closingDate = new Date().toISOString().split('T')[0],
      annualPropertyTax = 0,
      propertyLocation = '',
      locationData = {},
      transactionType = 'sale_purchase_mortgage',
      // Seller-side inputs
      agentCommissionRate = 0.06,
      existingMortgageBalance = 0,
      // Optional overrides
      buyerCreditsCents: buyerCreditsOverride,
      sellerCreditsCents: sellerCreditsOverride,
    } = req.body

    // ── Convert to cents ────────────────────────────────────────────────────
    const salesPriceCents = toCents(salesPrice)
    const providedLoanAmountCents = toCents(loanAmount)
    const annualTaxCents = toCents(annualPropertyTax)
    const earnestMoneyCents = toCents(earnestMoneyDeposit)
    const existingMortgageCents = toCents(existingMortgageBalance)

    const isCashTransaction = transactionType === 'sale_purchase_cash' || loanType === 'cash'
    const loanAmountCents = isCashTransaction ? 0 : providedLoanAmountCents
    const downPaymentCents = isCashTransaction
      ? salesPriceCents
      : (toCents(downPayment) || Math.max(0, salesPriceCents - loanAmountCents))

    if (salesPriceCents <= 0) {
      return res.status(400).json({ error: 'salesPrice must be a positive number' })
    }

    // ── Prorations ──────────────────────────────────────────────────────────
    const proratedTaxCents = annualTaxCents > 0
      ? calculateProrations({ annualTaxCents, closingDate })
      : 0

    // ── Shared fee schedule ─────────────────────────────────────────────────
    const ownersTitleCents = getTitleInsurance(salesPriceCents)
    const lendersTitleCents = getLenderTitleInsurance(loanAmountCents)
    const escrowFeeCents = getEscrowFee(salesPriceCents)
    const recordingFeeCents = getRecordingFee(transactionType)
    const transferTaxCents = getTransferTax(salesPriceCents, locationData)
    const settlementFeeCents = 295_00

    // ── Buyer close sheet sections ──────────────────────────────────────────
    const rateByLoanType = {
      conventional: 0.0675,
      fha: 0.0625,
      va: 0.06,
      cash: 0,
    }
    const noteRate = rateByLoanType[loanType] ?? rateByLoanType.conventional

    // Loans & prepaids
    const loanOriginationCents = isCashTransaction ? 0 : Math.round(loanAmountCents * 0.0075)
    const appraisalFeeCents = isCashTransaction ? 0 : 550_00
    const underwritingFeeCents = isCashTransaction ? 0 : 795_00
    const homeownersInsuranceCents = Math.round(salesPriceCents * 0.0045)
    const prepaidInterestCents = isCashTransaction
      ? 0
      : Math.round((loanAmountCents * noteRate) / 365 * 15)
    const initialEscrowDepositCents = isCashTransaction
      ? 0
      : Math.round((annualTaxCents / 12) * 3 + (homeownersInsuranceCents / 12) * 2)
    const upfrontMipCents = loanType === 'fha' ? Math.round(loanAmountCents * 0.0175) : 0
    const vaFundingFeeCents = loanType === 'va' ? Math.round(loanAmountCents * 0.0215) : 0

    const loansAndPrepaidsSubtotal =
      loanOriginationCents +
      appraisalFeeCents +
      underwritingFeeCents +
      homeownersInsuranceCents +
      prepaidInterestCents +
      initialEscrowDepositCents +
      upfrontMipCents +
      vaFundingFeeCents

    // Property taxes
    const taxServiceFeeCents = 85_00
    const taxReserveCents = isCashTransaction ? 0 : Math.round((annualTaxCents / 12) * 2)
    const propertyTaxesSubtotal = taxServiceFeeCents + taxReserveCents

    // Title & escrow
    const closingProtectionLetterCents = isCashTransaction ? 60_00 : 120_00
    const titleEscrowSubtotal =
      ownersTitleCents +
      lendersTitleCents +
      escrowFeeCents +
      settlementFeeCents +
      closingProtectionLetterCents

    // Closing costs and credits
    const inspectionFeeCents = 450_00
    const surveyFeeCents = 325_00
    const hoaEstoppelFeeCents = locationData.hoaEstoppelFeeCents != null ? toCents(locationData.hoaEstoppelFeeCents) : 0
    const lenderCreditCents = locationData.lenderCreditCents != null ? toCents(locationData.lenderCreditCents) : 0
    const closingCostsSubtotal = inspectionFeeCents + surveyFeeCents + hoaEstoppelFeeCents

    // Recording fees and taxes
    const deedRecordingCents = 95_00
    const mortgageRecordingCents = isCashTransaction ? 0 : 125_00
    const buyerTransferTaxRate = locationData.buyerTransferTaxRate != null ? locationData.buyerTransferTaxRate : 0.001
    const buyerTransferTaxCents = Math.round(salesPriceCents * buyerTransferTaxRate)
    const recordingTaxesSubtotal = deedRecordingCents + mortgageRecordingCents + buyerTransferTaxCents

    const buyerCreditsTotal = buyerCreditsOverride != null
      ? toCents(buyerCreditsOverride)
      : (earnestMoneyCents + proratedTaxCents + lenderCreditCents)

    const buyerClosingCosts =
      loansAndPrepaidsSubtotal +
      propertyTaxesSubtotal +
      titleEscrowSubtotal +
      closingCostsSubtotal +
      recordingTaxesSubtotal

    const estimatedCashToClose =
      downPaymentCents + buyerClosingCosts - buyerCreditsTotal

    // ── Seller net sheet ────────────────────────────────────────────────────
    const commissionCents = Math.round(salesPriceCents * agentCommissionRate)
    const sellerCreditsTotal = sellerCreditsOverride != null
      ? toCents(sellerCreditsOverride)
      : proratedTaxCents

    const sellerTotalDeductions =
      commissionCents +
      ownersTitleCents +
      escrowFeeCents +
      transferTaxCents +
      recordingFeeCents +
      settlementFeeCents +
      existingMortgageCents +
      sellerCreditsTotal

    const estimatedNetProceeds = salesPriceCents - sellerTotalDeductions

    // ── Response ────────────────────────────────────────────────────────────
    res.json({
      transactionType,
      loanType,
      propertyLocation,
      closingDate,
      salesPrice: fmtCents(salesPriceCents),
      loanAmount: fmtCents(loanAmountCents),
      downPayment: fmtCents(downPaymentCents),
      earnestMoneyDeposit: fmtCents(earnestMoneyCents),
      downPaymentPct: salesPriceCents > 0
        ? fmtPercent((downPaymentCents / salesPriceCents) * 100)
        : '0',

      buyer: {
        estimatedCashToClose: fmtCents(estimatedCashToClose),
        downPayment: fmtCents(downPaymentCents),
        closingCosts: fmtCents(buyerClosingCosts),
        credits: fmtCents(buyerCreditsTotal),
        sectionTotals: {
          loansAndPrepaids: fmtCents(loansAndPrepaidsSubtotal),
          propertyTaxes: fmtCents(propertyTaxesSubtotal),
          titleAndEscrow: fmtCents(titleEscrowSubtotal),
          closingCostsAndCredits: fmtCents(closingCostsSubtotal),
          recordingFeesAndTaxes: fmtCents(recordingTaxesSubtotal),
        },
        creditsBreakdown: {
          earnestMoneyDeposit: fmtCents(earnestMoneyCents),
          proratedTaxCredit: fmtCents(proratedTaxCents),
          lenderCredit: fmtCents(lenderCreditCents),
        },
        breakdown: {
          loanOrigination: fmtCents(loanOriginationCents),
          appraisalFee: fmtCents(appraisalFeeCents),
          underwritingFee: fmtCents(underwritingFeeCents),
          inspectionFee: fmtCents(inspectionFeeCents),
          surveyFee: fmtCents(surveyFeeCents),
          hoaEstoppelFee: fmtCents(hoaEstoppelFeeCents),
          lendersTitleInsurance: fmtCents(lendersTitleCents),
          ownersTitleInsurance: fmtCents(ownersTitleCents),
          escrowFee: fmtCents(escrowFeeCents),
          settlementFee: fmtCents(settlementFeeCents),
          closingProtectionLetter: fmtCents(closingProtectionLetterCents),
          recordingFee: fmtCents(recordingFeeCents),
          deedRecording: fmtCents(deedRecordingCents),
          mortgageRecording: fmtCents(mortgageRecordingCents),
          transferTaxBuyerSide: fmtCents(buyerTransferTaxCents),
          prepaidInterest: fmtCents(prepaidInterestCents),
          homeownersInsurance: fmtCents(homeownersInsuranceCents),
          initialEscrowDeposit: fmtCents(initialEscrowDepositCents),
          upfrontMip: fmtCents(upfrontMipCents),
          vaFundingFee: fmtCents(vaFundingFeeCents),
          taxServiceFee: fmtCents(taxServiceFeeCents),
          taxReserve: fmtCents(taxReserveCents),
          lenderCredit: fmtCents(lenderCreditCents),
          earnestMoneyDeposit: fmtCents(earnestMoneyCents),
          proratedTaxCredit: fmtCents(proratedTaxCents),
        },
      },

      seller: {
        estimatedNetProceeds: fmtCents(estimatedNetProceeds),
        salePrice: fmtCents(salesPriceCents),
        totalDeductions: fmtCents(sellerTotalDeductions),
        breakdown: {
          agentCommission: fmtCents(commissionCents),
          ownersTitleInsurance: fmtCents(ownersTitleCents),
          escrowFee: fmtCents(escrowFeeCents),
          transferTax: fmtCents(transferTaxCents),
          recordingFee: fmtCents(recordingFeeCents),
          settlementFee: fmtCents(settlementFeeCents),
          existingMortgagePayoff: fmtCents(existingMortgageCents),
          proratedTaxCredit: fmtCents(sellerCreditsTotal),
        },
      },

      fees: {
        ownersTitleInsurance: fmtCents(ownersTitleCents),
        lendersTitleInsurance: fmtCents(lendersTitleCents),
        escrowFee: fmtCents(escrowFeeCents),
        settlementFee: fmtCents(settlementFeeCents),
        recordingFee: fmtCents(recordingFeeCents),
        transferTax: fmtCents(transferTaxCents),
        totalTitleAndEscrow: fmtCents(
          ownersTitleCents + lendersTitleCents + escrowFeeCents + settlementFeeCents + recordingFeeCents
        ),
      },

      prorations: {
        annualPropertyTax: fmtCents(annualTaxCents),
        closingDate,
        proratedAmount: fmtCents(proratedTaxCents),
      },
    })
  } catch (err) {
    console.error('[quoteController]', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

module.exports = { generateQuote }
