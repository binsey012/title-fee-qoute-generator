/**
 * CalculationTable — renders a list of { label, value, highlight, negative, indent } rows.
 */
export default function CalculationTable({ rows }) {
  if (!rows?.length) return null

  return (
    <div>
      {rows.map((row, i) => (
        <div
          key={i}
          className={`calc-row${row.subtotal ? ' subtotal' : ''}`}
          style={row.indent ? { paddingLeft: '28px' } : undefined}
        >
          <span style={{
            color: row.highlight ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontSize: row.subtotal ? '0.92rem' : '0.875rem',
            fontWeight: row.subtotal || row.highlight ? 600 : 400,
          }}>
            {row.label}
          </span>
          <span style={{
            color: row.negative
              ? 'var(--red)'
              : row.credit
                ? 'var(--green)'
                : row.subtotal
                  ? 'var(--text-primary)'
                  : 'var(--text-secondary)',
            fontWeight: row.subtotal ? 700 : 500,
            fontSize: row.subtotal ? '1rem' : '0.875rem',
            fontVariantNumeric: 'tabular-nums',
            minWidth: '100px',
            textAlign: 'right',
          }}>
            {row.negative ? '-' : row.credit ? '+' : ''}{row.value ? `$${row.value}` : '—'}
          </span>
        </div>
      ))}
    </div>
  )
}
