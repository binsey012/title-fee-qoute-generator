import { useFeeCalculator } from './hooks/useFeeCalculator'
import { useState } from 'react'
import DataEntryPanel from './components/DataEntryPanel'
import BuyerSheet from './components/BuyerSheet'
import SellerSheet from './components/SellerSheet'
import FeesSheet from './components/FeesSheet'
import StickyTotal from './components/StickyTotal'
import EstimateFormModal from './components/EstimateFormModal'
import { exportToPDF } from './utils/exportPDF'
import { AlertIcon, BuildingIcon, FileIcon, RefreshIcon } from './components/icons'

const TABS = [
  { id: 'buyer', label: 'Buyer Close Sheet' },
  { id: 'seller', label: 'Seller Net Sheet' },
  { id: 'fees', label: 'Title & Escrow Fees' },
]

export default function App() {
  const { activeTab, setActiveTab, form, handleChange, result, loading, error, resetForm } = useFeeCalculator()
  const [showEstimateModal, setShowEstimateModal] = useState(false)

  const handleCreateEstimate = () => {
    if (!result) return
    setShowEstimateModal(true)
  }

  const handleEstimateSubmit = (meta) => {
    exportToPDF(result, form, meta)
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '100px' }}>
      {/* ── Top Header ── */}
      <header style={{
        borderBottom: '1px solid var(--border-glass)',
        background: 'rgba(6, 13, 26, 0.8)',
        backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BuildingIcon size={18} color="#ffffff" />
            </div>
            <div>
              <h1 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>
                Title &amp; Fee Quote Generator
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Professional Closing Cost Estimator</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {error && (
              <span style={{
                color: 'var(--red)', fontSize: '0.78rem', background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '6px 12px',
                display: 'inline-flex', alignItems: 'center', gap: '6px',
              }}>
                <AlertIcon color="var(--red)" />
                {error}
              </span>
            )}
            <button
              className="no-print"
              onClick={resetForm}
              style={{
                background: 'rgba(148,163,184,0.08)', border: '1px solid var(--border-glass)',
                borderRadius: '8px', color: 'var(--text-secondary)', padding: '8px 16px',
                cursor: 'pointer', fontSize: '0.82rem', transition: 'all 0.2s',
                display: 'inline-flex', alignItems: 'center', gap: '8px',
              }}
            >
              <RefreshIcon color="var(--text-secondary)" />
              Reset
            </button>
            <button
              onClick={handleCreateEstimate}
              disabled={!result}
              style={{
                background: result
                  ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
                  : 'rgba(148,163,184,0.1)',
                border: 'none', borderRadius: '8px',
                color: result ? '#fff' : 'var(--text-muted)',
                padding: '8px 20px', cursor: result ? 'pointer' : 'not-allowed',
                fontSize: '0.82rem', fontWeight: 600,
                boxShadow: result ? '0 4px 15px rgba(59,130,246,0.3)' : 'none',
                transition: 'all 0.2s',
                display: 'inline-flex', alignItems: 'center', gap: '8px',
              }}
            >
              <FileIcon color={result ? '#fff' : 'var(--text-muted)'} />
              Create Estimate
            </button>
          </div>
        </div>
      </header>

      {/* ── Segmented Control ── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 24px 0' }}>
        <div className="seg-control">
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
      </div>

      {/* ── Main Grid ── */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px' }}>
          {/* Left: Data Entry */}
          <aside>
            <DataEntryPanel form={form} handleChange={handleChange} />
          </aside>

          {/* Right: Active Sheet */}
          <section>
            {activeTab === 'buyer' && <BuyerSheet result={result} />}
            {activeTab === 'seller' && <SellerSheet result={result} />}
            {activeTab === 'fees' && <FeesSheet result={result} />}
          </section>
        </div>
      </main>

      {/* ── Sticky Total Footer ── */}
      <StickyTotal activeTab={activeTab} result={result} loading={loading} />

      <EstimateFormModal
        open={showEstimateModal}
        onClose={() => setShowEstimateModal(false)}
        onSubmit={handleEstimateSubmit}
      />
    </div>
  )
}
