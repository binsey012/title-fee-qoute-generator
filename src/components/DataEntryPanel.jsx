import { useState } from 'react'
import CurrencyInput from './CurrencyInput'

const LOCATION_OPTIONS = [
  { city: 'Columbus', state: 'OH', country: 'USA', county: 'Franklin', transferTaxRate: 0.007, buyerTransferTaxRate: 0.001 },
  { city: 'Chicago', state: 'IL', country: 'USA', county: 'Cook', transferTaxRate: 0.0075, buyerTransferTaxRate: 0.0015 },
  { city: 'Miami', state: 'FL', country: 'USA', county: 'Miami-Dade', transferTaxRate: 0.006, buyerTransferTaxRate: 0.001 },
  { city: 'Phoenix', state: 'AZ', country: 'USA', county: 'Maricopa', transferTaxRate: 0.005, buyerTransferTaxRate: 0.0008 },
  { city: 'Denver', state: 'CO', country: 'USA', county: 'Denver', transferTaxRate: 0.0065, buyerTransferTaxRate: 0.0012 },
  { city: 'Seattle', state: 'WA', country: 'USA', county: 'King', transferTaxRate: 0.0078, buyerTransferTaxRate: 0.0014 },
]

const lbl = { color: 'var(--text-muted)', fontSize: '0.69rem', fontWeight: 500, letterSpacing: '0.03em', textTransform: 'uppercase', display: 'block', marginBottom: '3px' }
const inp = {
  background: 'rgba(255,255,255,0.95)',
  border: '1px solid var(--border-glass)',
  borderRadius: '6px',
  color: 'var(--text-primary)',
  padding: '5px 8px',
  width: '100%',
  fontSize: '0.82rem',
  outline: 'none',
  transition: 'border-color 0.2s',
}

function Field({ label, children }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      {children}
    </div>
  )
}

export default function DataEntryPanel({ form, handleChange }) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const locationQuery = (form.propertyLocation || '').toLowerCase()
  const filteredLocations = LOCATION_OPTIONS
    .filter(loc => `${loc.city}, ${loc.state}, ${loc.country}`.toLowerCase().includes(locationQuery))
    .slice(0, 6)

  const onSelectLocation = (loc) => {
    handleChange('propertyLocation', `${loc.city}, ${loc.state}, ${loc.country}`)
    handleChange('locationData', {
      county: loc.county,
      transferTaxRate: loc.transferTaxRate,
      buyerTransferTaxRate: loc.buyerTransferTaxRate,
    })
    setShowSuggestions(false)
  }

  const isCash = form.loanType === 'cash' || form.transactionType === 'sale_purchase_cash'

  return (
    <div className="glass-card dep-panel">
      <h2 className="dep-heading">Transaction Details</h2>

      {/* Row 1: Location (full-width with dropdown) */}
      <div style={{ position: 'relative' }}>
        <Field label="Property Location">
          <input
            style={inp}
            value={form.propertyLocation}
            placeholder="City, State"
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
            onChange={e => { handleChange('propertyLocation', e.target.value); setShowSuggestions(true) }}
          />
        </Field>
        {showSuggestions && form.propertyLocation && filteredLocations.length > 0 && (
          <div className="location-suggest-box">
            {filteredLocations.map(loc => {
              const label = `${loc.city}, ${loc.state}, ${loc.country}`
              return (
                <button
                  type="button"
                  key={label}
                  className="location-suggest-item"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => onSelectLocation(loc)}
                >
                  <span>{label}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.69rem' }}>{loc.county} County</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Row 2: Close Date + Transaction Type */}
      <div className="dep-grid2">
        <Field label="Close Date">
          <input
            type="date"
            style={inp}
            value={form.closingDate}
            onChange={e => handleChange('closingDate', e.target.value)}
          />
        </Field>
        <Field label="Transaction">
          <select
            style={inp}
            value={form.transactionType}
            onChange={e => handleChange('transactionType', e.target.value)}
          >
            <option value="sale_purchase_cash">Cash</option>
            <option value="sale_purchase_mortgage">Mortgage</option>
          </select>
        </Field>
      </div>

      {/* Row 3: Sales Price + Loan Type */}
      <div className="dep-grid2">
        <Field label="Sales Price">
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>$</span>
            <input
              style={{ ...inp, paddingLeft: '18px' }}
              value={form.salesPrice}
              placeholder="500,000"
              onChange={e => handleChange('salesPrice', e.target.value.replace(/[^0-9.,]/g, ''))}
              inputMode="decimal"
            />
          </div>
        </Field>
        <Field label="Loan Type">
          <select
            style={inp}
            value={form.loanType}
            onChange={e => handleChange('loanType', e.target.value)}
          >
            <option value="conventional">Conventional</option>
            <option value="fha">FHA</option>
            <option value="va">VA</option>
            <option value="cash">Cash</option>
          </select>
        </Field>
      </div>

      {/* Row 4: Down Payment $ + % */}
      <Field label="Down Payment">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 72px', gap: '6px' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>$</span>
            <input
              style={{ ...inp, paddingLeft: '18px', opacity: isCash ? 0.5 : 1 }}
              value={form.downPayment}
              placeholder="100,000"
              disabled={isCash}
              onChange={e => handleChange('downPayment', e.target.value.replace(/[^0-9.,]/g, ''))}
              inputMode="decimal"
            />
          </div>
          <div style={{ position: 'relative' }}>
            <input
              style={{ ...inp, paddingRight: '18px', opacity: isCash ? 0.5 : 1 }}
              value={form.downPaymentPct}
              placeholder="20"
              disabled={isCash}
              onChange={e => handleChange('downPaymentPct', e.target.value.replace(/[^0-9.]/g, ''))}
              inputMode="decimal"
            />
            <span style={{ position: 'absolute', right: '7px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.76rem' }}>%</span>
          </div>
        </div>
      </Field>

      {/* Row 5: Loan Amount + Earnest Money */}
      <div className="dep-grid2">
        <Field label="Loan Amount">
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>$</span>
            <input
              style={{ ...inp, paddingLeft: '18px', opacity: isCash ? 0.5 : 1 }}
              value={form.loanAmount}
              placeholder="400,000"
              disabled={isCash}
              onChange={e => handleChange('loanAmount', e.target.value.replace(/[^0-9.,]/g, ''))}
              inputMode="decimal"
            />
          </div>
        </Field>
        <Field label="Earnest $">
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>$</span>
            <input
              style={{ ...inp, paddingLeft: '18px' }}
              value={form.earnestMoneyDeposit}
              placeholder="10,000"
              onChange={e => handleChange('earnestMoneyDeposit', e.target.value.replace(/[^0-9.,]/g, ''))}
              inputMode="decimal"
            />
          </div>
        </Field>
      </div>

      {/* Row 6: Annual Tax + Agent Commission */}
      <div className="dep-grid2">
        <Field label="Annual Tax">
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>$</span>
            <input
              style={{ ...inp, paddingLeft: '18px' }}
              value={form.annualPropertyTax}
              placeholder="5,000"
              onChange={e => handleChange('annualPropertyTax', e.target.value.replace(/[^0-9.,]/g, ''))}
              inputMode="decimal"
            />
          </div>
        </Field>
        <Field label="Commission">
          <div style={{ position: 'relative' }}>
            <input
              style={{ ...inp, paddingRight: '18px' }}
              value={form.agentCommissionRate}
              placeholder="6"
              onChange={e => handleChange('agentCommissionRate', e.target.value.replace(/[^0-9.]/g, ''))}
              inputMode="decimal"
            />
            <span style={{ position: 'absolute', right: '7px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.76rem' }}>%</span>
          </div>
        </Field>
      </div>

      {/* Row 7: Existing Mortgage + Seller Concession */}
      <div className="dep-grid2">
        <Field label="Mortgage Payoff">
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>$</span>
            <input
              style={{ ...inp, paddingLeft: '18px' }}
              value={form.existingMortgageBalance}
              placeholder="0"
              onChange={e => handleChange('existingMortgageBalance', e.target.value.replace(/[^0-9.,]/g, ''))}
              inputMode="decimal"
            />
          </div>
        </Field>
        <Field label="Concession">
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>$</span>
            <input
              style={{ ...inp, paddingLeft: '18px' }}
              value={form.concession}
              placeholder="0"
              onChange={e => handleChange('concession', e.target.value.replace(/[^0-9.,]/g, ''))}
              inputMode="decimal"
            />
          </div>
        </Field>
      </div>
    </div>
  )
}
