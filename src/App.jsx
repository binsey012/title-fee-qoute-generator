import { useFeeCalculator } from './hooks/useFeeCalculator'
import { useState } from 'react'
import DataEntryPanel from './components/DataEntryPanel'
import BuyerSheet from './components/BuyerSheet'
import SellerSheet from './components/SellerSheet'
import FeesSheet from './components/FeesSheet'
import EstimateFormModal from './components/EstimateFormModal'
import { exportToPDF } from './utils/exportPDF'
import { AlertIcon, FileIcon, RefreshIcon } from './components/icons'
import companyLogo from './components/company-logo.png'

const TABS = [
  { id: 'buyer', label: 'Buyer Close Sheet' },
  { id: 'seller', label: 'Seller Net Sheet' },
  { id: 'fees', label: 'Title & Escrow Fees' },
]

export default function App() {
  const { activeTab, setActiveTab, form, handleChange, result, loading, error, resetForm } = useFeeCalculator()
  const [showEstimateModal, setShowEstimateModal] = useState(false)
  const [overrideTotals, setOverrideTotals] = useState({})

  const handleBuyerTotal  = (v) => setOverrideTotals(p => p.buyer  === v ? p : { ...p, buyer: v })
  const handleSellerTotal = (v) => setOverrideTotals(p => p.seller === v ? p : { ...p, seller: v })
  const handleFeesTotal   = (v) => setOverrideTotals(p => p.fees   === v ? p : { ...p, fees: v })

  const handleCreateEstimate = () => { if (result) setShowEstimateModal(true) }
  const handleEstimateSubmit = (meta) => { exportToPDF(result, form, meta) }

  return (
    <div className="app-shell">
      {/* ── Compact Header ── */}
      <header className="app-header">
        <div className="app-header-inner">
          <div className="brand-wrap">
            <div className="brand-logo-box">
              <img src={companyLogo} alt="Growers Real Estate" className="brand-logo" />
            </div>
            <div>
              <h1 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.92rem', lineHeight: 1.2 }}>
                Title &amp; Fee Quote Generator
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>Professional Closing Cost Estimator</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {error && (
              <span style={{
                color: 'var(--red)', fontSize: '0.75rem', background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)', borderRadius: '7px', padding: '5px 10px',
                display: 'inline-flex', alignItems: 'center', gap: '5px',
              }}>
                <AlertIcon color="var(--red)" />{error}
              </span>
            )}
            {loading && (
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <CalcSpinner /> Calculating…
              </span>
            )}
            <button className="no-print hdr-btn" onClick={resetForm}>
              <RefreshIcon color="var(--text-secondary)" /> Reset
            </button>
            <button
              className="no-print hdr-btn hdr-btn-primary"
              onClick={handleCreateEstimate}
              disabled={!result}
              style={{ opacity: result ? 1 : 0.4, cursor: result ? 'pointer' : 'not-allowed' }}
            >
              <FileIcon color="#fff" /> Create Estimate
            </button>
          </div>
        </div>
      </header>

      {/* ── Content Area ── */}
      <div className="app-content">
        {/* Left: Data Entry Panel */}
        <aside className="app-sidebar">
          <div className="seg-control" style={{ marginBottom: '12px' }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`seg-btn${activeTab === tab.id ? ' active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <DataEntryPanel form={form} handleChange={handleChange} />
        </aside>

        {/* Right: Active Sheet */}
        <main className="app-main">
          {activeTab === 'buyer'  && <BuyerSheet  result={result} concession={form.concession} onTotalChange={handleBuyerTotal}  salesPrice={form.salesPrice} />}
          {activeTab === 'seller' && <SellerSheet result={result} concession={form.concession} onTotalChange={handleSellerTotal} salesPrice={form.salesPrice} />}
          {activeTab === 'fees'   && <FeesSheet   result={result}                               onTotalChange={handleFeesTotal}   salesPrice={form.salesPrice} />}
        </main>
      </div>

      <EstimateFormModal
        open={showEstimateModal}
        onClose={() => setShowEstimateModal(false)}
        onSubmit={handleEstimateSubmit}
      />
    </div>
  )
}

function CalcSpinner() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}
