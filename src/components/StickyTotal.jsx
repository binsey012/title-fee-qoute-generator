export default function StickyTotal({ activeTab, result, loading }) {
  const labels = {
    buyer: { label: 'Estimated Cash to Close', key: 'estimatedCashToClose', path: 'buyer' },
    seller: { label: 'Estimated Net Proceeds', key: 'estimatedNetProceeds', path: 'seller' },
    fees: { label: 'Total Title & Escrow Fees', key: 'totalTitleAndEscrow', path: 'fees' },
  }

  const { label, key, path } = labels[activeTab]
  const value = result ? result[path]?.[key] : null

  return (
    <div className="sticky-total">
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
            {label}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Spinner />
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1.1rem' }}>Calculating…</span>
              </div>
            ) : value ? (
              <span style={{ color: '#fff', fontSize: '1.8rem', fontWeight: 700, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                ${value}
              </span>
            ) : (
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '1.2rem' }}>—</span>
            )}
          </div>
        </div>
        {result && (
          <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem' }}>
            <div>Closing: {result.closingDate}</div>
            <div style={{ marginTop: '2px' }}>SP: ${result.salesPrice}</div>
          </div>
        )}
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5"
      style={{ animation: 'spin 0.8s linear infinite' }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}
