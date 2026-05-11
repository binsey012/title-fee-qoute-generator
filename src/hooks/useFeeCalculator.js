import { useState, useCallback, useRef } from 'react'
import axios from 'axios'

// Always use a relative path so API calls go to the same host (works on
// Vercel, local Vite proxy, etc.). Override with VITE_API_BASE_URL if needed.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const DEFAULT_FORM = {
  propertyLocation: '',
  salesPrice: '',
  loanAmount: '',
  downPayment: '',
  downPaymentPct: '',
  earnestMoneyDeposit: '',
  loanType: 'conventional',
  closingDate: new Date().toISOString().split('T')[0],
  annualPropertyTax: '5000',
  agentCommissionRate: '6',
  existingMortgageBalance: '',
  concession: '',
  transactionType: 'sale_purchase_mortgage',
  locationData: {},
}

function parseDollar(str) {
  if (!str && str !== 0) return 0
  return parseFloat(String(str).replace(/[,$]/g, '')) || 0
}

function fmtDollar(num) {
  if (!num && num !== 0) return ''
  const n = parseFloat(num)
  if (isNaN(n)) return ''
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtPercent(num) {
  const n = Number(num)
  if (!isFinite(n)) return ''
  return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function toErrorMessage(err) {
  const responseData = err?.response?.data
  const rawError = responseData?.error

  if (typeof rawError === 'string' && rawError.trim()) return rawError
  if (typeof responseData === 'string' && responseData.trim()) return responseData
  if (rawError && typeof rawError === 'object') {
    if (typeof rawError.message === 'string' && rawError.message.trim()) return rawError.message
    if (typeof rawError.code === 'string' && rawError.code.trim()) return rawError.code
  }
  if (typeof err?.message === 'string' && err.message.trim()) return err.message

  return 'Calculation error. Check inputs.'
}

export function useFeeCalculator() {
  const [activeTab, setActiveTab] = useState('buyer') // buyer | seller | fees
  const [form, setForm] = useState(DEFAULT_FORM)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const debounceRef = useRef(null)

  /** Called whenever form changes — debounces API call by 600ms */
  const scheduleCalculate = useCallback((nextForm) => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const sp = parseDollar(nextForm.salesPrice)
      if (sp <= 0) return

      setLoading(true)
      setError(null)
      try {
        const payload = {
          salesPrice: sp,
          loanAmount: parseDollar(nextForm.loanAmount),
          downPayment: parseDollar(nextForm.downPayment),
          earnestMoneyDeposit: parseDollar(nextForm.earnestMoneyDeposit),
          loanType: nextForm.loanType,
          closingDate: nextForm.closingDate,
          annualPropertyTax: parseDollar(nextForm.annualPropertyTax),
          agentCommissionRate: parseFloat(nextForm.agentCommissionRate) / 100 || 0.06,
          existingMortgageBalance: parseDollar(nextForm.existingMortgageBalance),
          transactionType: nextForm.transactionType,
          propertyLocation: nextForm.propertyLocation,
          locationData: nextForm.locationData,
        }
        const { data } = await axios.post(`${API_BASE_URL}/api/quote/generate`, payload)
        setResult(data)
      } catch (err) {
        setResult(null)
        setError(toErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }, 600)
  }, [])

  /**
   * handleChange — smart field updater that syncs:
   *   salesPrice   ↔  loanAmount / downPayment / downPaymentPct
   *   downPayment  ↔  downPaymentPct
   *   downPaymentPct ↔  downPayment
   */
  const handleChange = useCallback((field, value) => {
    setForm(prev => {
      let next = { ...prev, [field]: value }

      const sp = parseDollar(field === 'salesPrice' ? value : prev.salesPrice)

      if (field === 'salesPrice') {
        // Re-derive down payment dollar if pct already set
        if (prev.downPaymentPct) {
          const pct = Math.min(1, Math.max(0, parseFloat(prev.downPaymentPct) / 100 || 0))
          const dp = sp * pct
          next.downPayment = fmtDollar(dp)
          next.loanAmount = fmtDollar(sp - dp)
        } else if (prev.downPayment) {
          const dp = Math.min(sp, Math.max(0, parseDollar(prev.downPayment)))
          next.loanAmount = fmtDollar(sp - dp)
          next.downPaymentPct = sp > 0 ? fmtPercent((dp / sp) * 100) : ''
        }
      }

      if (field === 'transactionType') {
        const isCash = value === 'sale_purchase_cash'
        if (isCash) {
          next.loanType = 'cash'
          next.loanAmount = '0.00'
          next.downPayment = fmtDollar(sp)
          next.downPaymentPct = sp > 0 ? '100' : ''
        } else if (next.loanType === 'cash') {
          next.loanType = 'conventional'
          const dp = Math.min(sp, Math.max(0, parseDollar(next.downPayment)))
          next.loanAmount = fmtDollar(Math.max(0, sp - dp))
          next.downPaymentPct = sp > 0 ? fmtPercent((dp / sp) * 100) : ''
        }
      }

      if (field === 'loanType') {
        if (value === 'cash') {
          next.transactionType = 'sale_purchase_cash'
          next.loanAmount = '0.00'
          next.downPayment = fmtDollar(sp)
          next.downPaymentPct = sp > 0 ? '100' : ''
        } else if (next.transactionType === 'sale_purchase_cash') {
          next.transactionType = 'sale_purchase_mortgage'
          const dp = Math.min(sp, Math.max(0, parseDollar(next.downPayment)))
          next.loanAmount = fmtDollar(Math.max(0, sp - dp))
          next.downPaymentPct = sp > 0 ? fmtPercent((dp / sp) * 100) : ''
        }
      }

      if (field === 'downPayment' && sp > 0) {
        const dp = Math.min(sp, Math.max(0, parseDollar(value)))
        next.downPaymentPct = dp > 0 ? fmtPercent((dp / sp) * 100) : ''
        next.loanAmount = fmtDollar(sp - dp)
      }

      if (field === 'downPaymentPct' && sp > 0) {
        const pct = Math.min(1, Math.max(0, parseFloat(value) / 100 || 0))
        const dp = sp * pct
        next.downPaymentPct = value === '' ? '' : fmtPercent(pct * 100)
        next.downPayment = fmtDollar(dp)
        next.loanAmount = fmtDollar(sp - dp)
      }

      if (field === 'loanAmount' && sp > 0) {
        const loan = Math.min(sp, Math.max(0, parseDollar(value)))
        const dp = sp - loan
        next.loanAmount = fmtDollar(loan)
        next.downPayment = fmtDollar(dp)
        next.downPaymentPct = sp > 0 ? fmtPercent((dp / sp) * 100) : ''
      }

      scheduleCalculate(next)
      return next
    })
  }, [scheduleCalculate])

  const resetForm = useCallback(() => {
    setForm(DEFAULT_FORM)
    setResult(null)
    setError(null)
  }, [])

  return {
    activeTab,
    setActiveTab,
    form,
    handleChange,
    result,
    loading,
    error,
    resetForm,
  }
}
