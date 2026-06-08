import { useState, useEffect } from 'react'
import api from '../../api/client'

export default function AdminAsignaciones() {
  const [cuidadores,   setCuidadores]   = useState([])
  const [pacientes,    setPacientes]    = useState([])
  const [assignments,  setAssignments]  = useState([])
  const [caregiver,    setCaregiver]    = useState('')
  const [selected,     setSelected]     = useState({})
  const [patSearch,    setPatSearch]    = useState('')
  const [assignSearch, setAssignSearch] = useState('')
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(false)
  const [saveError,    setSaveError]    = useState('')
  const [confirmEmail, setConfirmEmail] = useState(null)
  const [desvError,    setDesvError]    = useState('')

  function load() {
    setLoading(true)
    api.get('/admin/asignaciones')
      .then(({ data }) => {
        setCuidadores(data.cuidadores  || [])
        setPacientes(data.pacientes    || [])
        setAssignments(data.assignments || [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const togglePat = (code, name) => {
    setSelected(prev => {
      const next = { ...prev }
      if (next[code]) delete next[code]; else next[code] = name
      return next
    })
  }

  const removeTag = (code) => setSelected(prev => { const n = { ...prev }; delete n[code]; return n })

  async function doAssign() {
    if (!caregiver || Object.keys(selected).length === 0) return
    setSaving(true)
    setSaveError('')
    try {
      await api.post('/admin/asignaciones', {
        cuidador_email: caregiver,
        patient_ids: Object.keys(selected),
      })
      setCaregiver(''); setSelected({}); load()
    } catch {
      setSaveError('Error al registrar la asignación')
    } finally {
      setSaving(false)
    }
  }

  async function doDesvincular(cuidador_email) {
    if (confirmEmail !== cuidador_email) {
      setConfirmEmail(cuidador_email)
      setDesvError('')
      return
    }
    setConfirmEmail(null)
    try {
      await api.delete(`/admin/asignaciones/${encodeURIComponent(cuidador_email)}`)
      load()
    } catch {
      setDesvError('Error al desvincular')
    }
  }

  const visiblePatients    = pacientes.filter(p => !patSearch || p.name.toLowerCase().includes(patSearch.toLowerCase()) || p.code.toLowerCase().includes(patSearch.toLowerCase()))
  const visibleAssignments = assignments.filter(a => !assignSearch || a.cuidador.toLowerCase().includes(assignSearch.toLowerCase()) || a.patients.some(p => p.toLowerCase().includes(assignSearch.toLowerCase())))
  const canAssign          = caregiver && Object.keys(selected).length > 0

  return (
    <div className="admin-panel">
      <div className="content-wrap">
        <div className="assign-panel">
          <div className="form-card">
            <div className="form-title">Nueva asignación</div>

            <div className="field-wrap">
              <label className="field-label">Cuidador</label>
              <select className="field-select" value={caregiver} onChange={e => setCaregiver(e.target.value)}>
                <option value="">Seleccionar cuidador...</option>
                {cuidadores.map(c => <option key={c.email} value={c.email}>{c.nombre}</option>)}
              </select>
            </div>

            <div className="field-wrap">
              <label className="field-label">Pacientes a asignar</label>
              <div className="multi-wrap">
                <input className="multi-search" type="text" placeholder="Buscar paciente..."
                  value={patSearch} onChange={e => setPatSearch(e.target.value)} />
                <div className="multi-list">
                  {loading
                    ? <div style={{ padding: 12, fontSize: 12, color: '#7A8FA8' }}>Cargando...</div>
                    : visiblePatients.map(p => (
                      <div key={p.code} className={`multi-item${selected[p.code] ? ' selected' : ''}`} onClick={() => togglePat(p.code, p.name)}>
                        <div className="multi-cb">{selected[p.code] && <span className="multi-check">✓</span>}</div>
                        <span>{p.name}</span>
                        <span className="pat-code">{p.code}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
              <div className="tags-wrap">
                {Object.entries(selected).map(([code]) => (
                  <div key={code} className="tag">{code}<span className="tag-x" onClick={() => removeTag(code)}>×</span></div>
                ))}
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', marginTop: 4 }} disabled={!canAssign || saving} onClick={doAssign}>
              {saving ? 'Guardando...' : 'Confirmar asignación'}
            </button>
            {saveError && <div className="action-error">{saveError}</div>}
          </div>
        </div>

        <div className="table-section">
          <div className="table-top">
            <div className="table-heading">Asignaciones activas</div>
            <div className="search-wrap" style={{ width: 220, flex: 'none' }}>
              <svg className="search-icon" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#7A8FA8" strokeWidth="1.5">
                <circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l2.5 2.5"/>
              </svg>
              <input className="search-input" type="text" placeholder="Buscar cuidador o paciente..."
                value={assignSearch} onChange={e => setAssignSearch(e.target.value)} />
            </div>
          </div>
          <div className="table-outer">
            <table className="admin-table" style={{ minWidth: 520 }}>
              <thead>
                <tr><th>Cuidador</th><th>Pacientes asignados</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {loading
                  ? <tr><td colSpan="3" className="state-empty"><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                  : visibleAssignments.map((a, i) => (
                    <tr key={i}>
                      <td>
                        <div className="caregiver-name">{a.cuidador}</div>
                        <div className="caregiver-email">{a.email}</div>
                      </td>
                      <td>
                        <div className="pat-pills">
                          {a.patients.map(p => <span key={p} className="pat-pill">{p}</span>)}
                        </div>
                      </td>
                      <td>
                        <div className="actions">
                          {confirmEmail === a.cuidador_email ? (
                            <div className="inline-confirm">
                              <span className="inline-confirm-label">¿Confirmar?</span>
                              <button className="btn btn-sm btn-danger"    onClick={() => doDesvincular(a.cuidador_email)}>Sí</button>
                              <button className="btn btn-sm btn-secondary" onClick={() => setConfirmEmail(null)}>No</button>
                            </div>
                          ) : (
                            <button className="btn btn-sm btn-danger" onClick={() => doDesvincular(a.cuidador_email)}>Desvincular</button>
                          )}
                        </div>
                        {desvError && confirmEmail === null && <div className="action-error">{desvError}</div>}
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
