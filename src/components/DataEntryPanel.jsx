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

export default function DataEntryPanel({ form, handleChange }) {
  const labelStyle = { color: 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 500, letterSpacing: '0.02em' }
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const locationQuery = (form.propertyLocation || '').toLowerCase()
  const filteredLocations = LOCATION_OPTIONS
    .filter((loc) => `${loc.city}, ${loc.state}, ${loc.country}`.toLowerCase().includes(locationQuery))
    .slice(0, 6)

  const onSelectLocation = (loc) => {
    handleChange('propertyLocation', `${loc.city}, ${loc.state}, ${loc.country}`)
    handleChange('locationData', {
      county: loc.county,
      transferTaxRate: loc.transferTaxRate,
      buyerTransferTaxRate: loc.buyerTransferTaxRate,
    })
    setShowLocationSuggestions(false)
  }

  return (
    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
        Transaction Details
      </h2>

      {/* Property Location */}
      <div style={{ position: 'relative' }}>
        <label style={labelStyle}>Property Location (City, State, Country)</label>
        <input
          className="field-input"
          style={{ marginTop: 4 }}
          value={form.propertyLocation}
          placeholder="Search city, state, country"
          onFocus={() => setShowLocationSuggestions(true)}
          onBlur={() => {
            setTimeout(() => setShowLocationSuggestions(false), 120)
          }}
          onChange={(e) => {
            handleChange('propertyLocation', e.target.value)
            setShowLocationSuggestions(true)
          }}
        />
        {showLocationSuggestions && form.propertyLocation && filteredLocations.length > 0 && (
          <div className="location-suggest-box">
            {filteredLocations.map((loc) => {
              const label = `${loc.city}, ${loc.state}, ${loc.country}`
              return (
                <button
                  type="button"
                  key={label}
                  className="location-suggest-item"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onSelectLocation(loc)}
                >
                  <span>{label}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{loc.county} County</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Estimated Close Date */}
      <div>
        <label style={labelStyle}>Estimated Close Date</label>
        <input
          type="date"
          className="field-input"
          style={{ marginTop: 4 }}
          value={form.closingDate}
          onChange={e => handleChange('closingDate', e.target.value)}
        />
      </div>

      {/* Transaction Type */}
      <div>
        <label style={labelStyle}>Transaction Type</label>
        <select
          className="field-input"
          style={{ marginTop: 4 }}
          value={form.transactionType}
          onChange={e => handleChange('transactionType', e.target.value)}
        >
          <option value="sale_purchase_cash">Sale Purchase with Cash</option>
          <option value="sale_purchase_mortgage">Sale Purchase with Mortgage</option>
        </select>
      </div>

      {/* Sales Price */}
      <CurrencyInput
        label="Sales Price"
        value={form.salesPrice}
        onChange={v => handleChange('salesPrice', v)}
        placeholder="500,000.00"
      />

      {/* Loan Type */}
      <div>
        <label style={labelStyle}>Loan Type</label>
        <select
          className="field-input"
          style={{ marginTop: 4 }}
          value={form.loanType}
          onChange={e => handleChange('loanType', e.target.value)}
        >
          <option value="conventional">Conventional</option>
          <option value="fha">FHA</option>
          <option value="va">VA</option>
          <option value="cash">Cash</option>
        </select>
      </div>

      <CurrencyInput
        label="Earnest Money Deposit"
        value={form.earnestMoneyDeposit}
        onChange={v => handleChange('earnestMoneyDeposit', v)}
        placeholder="10,000.00"
      />

      {/* Down Payment - synced row */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={labelStyle}>Down Payment</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '8px' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>$</span>
            <input
              className="field-input"
              style={{ paddingLeft: '22px' }}
              value={form.downPayment}
              placeholder="100,000.00"
              disabled={form.loanType === 'cash' || form.transactionType === 'sale_purchase_cash'}
              onChange={e => handleChange('downPayment', e.target.value.replace(/[^0-9.,]/g, ''))}
              inputMode="decimal"
            />
          </div>
          <div style={{ position: 'relative' }}>
            <input
              className="field-input"
              style={{ paddingRight: '22px' }}
              value={form.downPaymentPct}
              placeholder="20"
              disabled={form.loanType === 'cash' || form.transactionType === 'sale_purchase_cash'}
              onChange={e => handleChange('downPaymentPct', e.target.value.replace(/[^0-9.]/g, ''))}
              inputMode="decimal"
            />
            <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>%</span>
          </div>
        </div>
      </div>

      {/* Loan Amount */}
      <CurrencyInput
        label="Loan Amount"
        value={form.loanAmount}
        onChange={v => handleChange('loanAmount', v)}
        disabled={form.loanType === 'cash' || form.transactionType === 'sale_purchase_cash'}
        hint={form.loanType === 'cash' ? 'Auto-set to $0 for cash purchases' : undefined}
        placeholder="400,000.00"
      />

      {/* Annual Property Tax */}
      <CurrencyInput
        label="Annual Property Tax"
        value={form.annualPropertyTax}
        onChange={v => handleChange('annualPropertyTax', v)}
        placeholder="5,000.00"
        hint="Used to calculate prorations"
      />

      {/* Agent Commission */}
      <div>
        <label style={labelStyle}>Agent Commission</label>
        <div style={{ position: 'relative', marginTop: 4 }}>
          <input
            className="field-input"
            style={{ paddingRight: '22px' }}
            value={form.agentCommissionRate}
            placeholder="6"
            onChange={e => handleChange('agentCommissionRate', e.target.value.replace(/[^0-9.]/g, ''))}
            inputMode="decimal"
          />
          <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>%</span>
        </div>
      </div>

      {/* Existing Mortgage (Seller Net) */}
      <CurrencyInput
        label="Existing Mortgage Balance"
        value={form.existingMortgageBalance}
        onChange={v => handleChange('existingMortgageBalance', v)}
        placeholder="0.00"
        hint="Payoff amount (seller net sheet)"
      />

      {/* Seller Concession */}
      <CurrencyInput
        label="Seller Concession"
        value={form.concession}
        onChange={v => handleChange('concession', v)}
        placeholder="0.00"
        hint="Seller-paid buyer closing cost credit"
      />
    </div>
  )
}
