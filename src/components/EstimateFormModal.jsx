import { useState } from 'react'

const DEFAULT_META = {
  borrowerNames: '',
  propertyStreetAddress: '',
  preparedByName: '',
  preparedByCompany: '',
  preparedByStreetAddress: '',
  preparedByCityStateZip: '',
  preparedByEmail: '',
  preparedByPhone: '',
  rememberPreparedBy: false,
  preparedForName: '',
  preparedForCompany: '',
  preparedForEmail: '',
  preparedForNote: '',
  rememberPreparedFor: false,
}

export default function EstimateFormModal({ open, onClose, onSubmit }) {
  const [meta, setMeta] = useState(DEFAULT_META)

  if (!open) return null

  const setField = (key, value) => setMeta((prev) => ({ ...prev, [key]: value }))

  const submit = (e) => {
    e.preventDefault()
    onSubmit(meta)
    onClose()
  }

  return (
    <div className="estimate-modal-overlay" onClick={onClose}>
      <div className="estimate-modal glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="estimate-modal-head">
          <h3>Create Estimate</h3>
          <button type="button" className="estimate-close-btn" onClick={onClose}>Close</button>
        </div>

        <form onSubmit={submit} className="estimate-form-grid">
          <input className="field-input" placeholder="Borrower Name(s)" value={meta.borrowerNames} onChange={(e) => setField('borrowerNames', e.target.value)} />
          <input className="field-input" placeholder="Property Street Address" value={meta.propertyStreetAddress} onChange={(e) => setField('propertyStreetAddress', e.target.value)} />

          <div className="estimate-col">
            <h4>Prepared By:</h4>
            <input className="field-input" placeholder="Name" value={meta.preparedByName} onChange={(e) => setField('preparedByName', e.target.value)} />
            <input className="field-input" placeholder="Company" value={meta.preparedByCompany} onChange={(e) => setField('preparedByCompany', e.target.value)} />
            <input className="field-input" placeholder="Street Address" value={meta.preparedByStreetAddress} onChange={(e) => setField('preparedByStreetAddress', e.target.value)} />
            <input className="field-input" placeholder="City, State, Zip" value={meta.preparedByCityStateZip} onChange={(e) => setField('preparedByCityStateZip', e.target.value)} />
            <input className="field-input" placeholder="Email Address" value={meta.preparedByEmail} onChange={(e) => setField('preparedByEmail', e.target.value)} />
            <input className="field-input" placeholder="Phone Number" value={meta.preparedByPhone} onChange={(e) => setField('preparedByPhone', e.target.value)} />
            <label className="remember-line">
              <input type="checkbox" checked={meta.rememberPreparedBy} onChange={(e) => setField('rememberPreparedBy', e.target.checked)} />
              Remember
            </label>
          </div>

          <div className="estimate-col">
            <h4>Prepared For:</h4>
            <input className="field-input" placeholder="Name" value={meta.preparedForName} onChange={(e) => setField('preparedForName', e.target.value)} />
            <input className="field-input" placeholder="Company" value={meta.preparedForCompany} onChange={(e) => setField('preparedForCompany', e.target.value)} />
            <input className="field-input" placeholder="Email Address" value={meta.preparedForEmail} onChange={(e) => setField('preparedForEmail', e.target.value)} />
            <textarea className="field-input" style={{ minHeight: '148px', resize: 'vertical' }} placeholder="Note" value={meta.preparedForNote} onChange={(e) => setField('preparedForNote', e.target.value)} />
            <label className="remember-line">
              <input type="checkbox" checked={meta.rememberPreparedFor} onChange={(e) => setField('rememberPreparedFor', e.target.checked)} />
              Remember
            </label>
          </div>

          <div className="estimate-actions">
            <button type="button" className="secondary-action" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-action">Generate PDF Estimate</button>
          </div>
        </form>
      </div>
    </div>
  )
}
