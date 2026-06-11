import { useState, useEffect } from 'react'
import api from '../../api/client'

const MAX_PACIENTES_POR_CUIDADOR  = 8
const MAX_CUIDADORES_POR_PACIENTE = 4

// Normaliza el email del cuidador — el backend puede devolverlo como email o cuidador_email
const rowEmail = (a) => a.cuidador_email || a.email || ''

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
  const [saveMsg,      setSaveMsg]      = useState('')
  const [loadError,    setLoadError]    = useState('')

  // Estado para gestión de pacientes por fila
  const [managingRow,      setManagingRow]      = useState(null)  // email del cuidador en modo gestión
  const [confirmRemove,    setConfirmRemove]    = useState(null)  // { email, pid } a confirmar
  const [removeLoading,    setRemoveLoading]    = useState(false)
  const [removeError,      setRemoveError]      = useState('')

  function load() {
    setLoading(true)
    setLoadError('')
    api.get('/admin/asignaciones')
      .then(({ data }) => {
        setCuidadores(data.cuidadores  || [])
        setPacientes(data.pacientes    || [])
        setAssignments(data.assignments || [])
      })
      .catch(() => setLoadError('No se pudieron cargar las asignaciones.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // ── Derivar conteos ────────────────────────────────────────────────────
  const caregiverCurrentCount = assignments.reduce((acc, a) => {
    acc[rowEmail(a)] = (a.patients || []).length
    return acc
  }, {})

  const patientCaregiverCount = {}
  assignments.forEach(a => {
    ;(a.patients || []).forEach(pid => {
      patientCaregiverCount[pid] = (patientCaregiverCount[pid] || 0) + 1
    })
  })

  const selectedCaregiverRow     = assignments.find(a => rowEmail(a) === caregiver)
  const alreadyWithThisCaregiver = new Set(selectedCaregiverRow?.patients || [])

  const currentCount   = caregiverCurrentCount[caregiver] || 0
  const selectedCount  = Object.keys(selected).length
  const projectedCount = currentCount + selectedCount

  const patientsAtMaxCaregivers = Object.keys(selected).filter(
    pid => (patientCaregiverCount[pid] || 0) >= MAX_CUIDADORES_POR_PACIENTE
  )
  const patientsAlreadyAssigned = Object.keys(selected).filter(
    pid => alreadyWithThisCaregiver.has(pid)
  )
  const caregiverWouldExceed = projectedCount > MAX_PACIENTES_POR_CUIDADOR

  const blockingErrors = [
    ...patientsAlreadyAssigned.map(pid => `${pid} ya está asignado a este cuidador.`),
    ...patientsAtMaxCaregivers.map(pid => `${pid} ya tiene ${MAX_CUIDADORES_POR_PACIENTE} cuidadores (límite máximo).`),
    caregiverWouldExceed
      ? `Este cuidador llegaría a ${projectedCount} pacientes (límite: ${MAX_PACIENTES_POR_CUIDADOR}).`
      : null,
  ].filter(Boolean)

  const canAssign = caregiver && selectedCount > 0 && blockingErrors.length === 0

  const togglePat = (code, name) => {
    setSelected(prev => {
      const next = { ...prev }
      if (next[code]) delete next[code]; else next[code] = name
      return next
    })
  }

  const removeTag = (code) => setSelected(prev => { const n = { ...prev }; delete n[code]; return n })

  async function doAssign() {
    if (!canAssign) return
    setSaving(true)
    setSaveError('')
    try {
      await api.post('/admin/asignaciones', {
        cuidador_email: caregiver,
        patient_ids: Object.keys(selected),
      })
      setCaregiver(''); setSelected({})
      setSaveMsg('Asignación registrada correctamente.')
      setTimeout(() => setSaveMsg(''), 4000)
      load()
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || ''
      setSaveError('Error al registrar la asignación' + (msg ? `: ${msg}` : '.'))
    } finally {
      setSaving(false)
    }
  }

  // Quitar un paciente específico de un cuidador
  async function doRemovePatient() {
    if (!confirmRemove || removeLoading) return
    const { email, pid } = confirmRemove
    const row = assignments.find(a => rowEmail(a) === email)
    if (!row) return

    const remaining = (row.patients || []).filter(p => p !== pid)
    setRemoveLoading(true)
    setRemoveError('')
    try {
      if (remaining.length === 0) {
        // Sin pacientes → eliminar la asignación entera del cuidador
        await api.delete(`/admin/asignaciones/${encodeURIComponent(email)}`)
        setManagingRow(null)
      } else {
        // Quedan pacientes → sobreescribir con lista actualizada
        await api.post('/admin/asignaciones', {
          cuidador_email: email,
          patient_ids: remaining,
        })
      }
      setConfirmRemove(null)
      setSaveMsg(`Paciente ${pid} desvinculado correctamente.`)
      setTimeout(() => setSaveMsg(''), 4000)
      load()
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || ''
      setRemoveError('Error al desvincular' + (msg ? `: ${msg}` : '.'))
    } finally {
      setRemoveLoading(false)
    }
  }

  const visiblePatients    = pacientes.filter(p => !patSearch || p.name.toLowerCase().includes(patSearch.toLowerCase()) || p.code.toLowerCase().includes(patSearch.toLowerCase()))
  const visibleAssignments = assignments.filter(a => !assignSearch || a.cuidador.toLowerCase().includes(assignSearch.toLowerCase()) || (a.patients || []).some(p => p.toLowerCase().includes(assignSearch.toLowerCase())))

  return (
    <div className="admin-panel">
      <style>{`
        .limit-badge{display:inline-flex;align-items:center;padding:1px 7px;border-radius:999px;font-size:10px;font-weight:600;margin-left:auto;flex-shrink:0;}
        .lb-ok{background:#ECFDF5;color:#065F46;}
        .lb-warn{background:#FEF3C7;color:#92400E;}
        .lb-full{background:#FEE2E2;color:#991B1B;}
        .pat-caregiver-count{font-size:10px;color:#7A8FA8;margin-left:6px;}
        .pat-caregiver-full{font-size:10px;color:#DC2626;font-weight:600;margin-left:6px;}
        .block-error-list{background:#FEF2F2;border:1px solid #FCA5A5;border-radius:8px;padding:10px 12px;margin-top:10px;}
        .block-error-title{font-size:11px;font-weight:700;color:#991B1B;text-transform:uppercase;margin-bottom:6px;}
        .block-error-item{font-size:11px;color:#7F1D1D;margin-bottom:3px;display:flex;gap:6px;align-items:flex-start;}
        .block-error-item:last-child{margin-bottom:0;}
        .multi-item.disabled-pat{opacity:0.5;cursor:not-allowed;}
        .multi-item.already-assigned{background:#FFF7ED;}
        .pat-already{font-size:10px;color:#D97706;font-weight:600;margin-left:auto;}
        .capacity-bar{height:4px;border-radius:2px;background:#E5E7EB;margin-top:6px;overflow:hidden;}
        .capacity-fill{height:100%;border-radius:2px;transition:width .3s;}
        .manage-row{background:#F0F6FF !important;}
        .manage-row td{padding-top:10px !important;padding-bottom:10px !important;}
        .removable-pills{display:flex;flex-wrap:wrap;gap:6px;}
        .removable-pill{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:500;background:#E0EEFF;color:#1D5FA8;border:1px solid #B8D4F5;}
        .removable-pill.removing{background:#FEE2E2;color:#991B1B;border-color:#FCA5A5;}
        .pill-x{cursor:pointer;font-size:13px;line-height:1;margin-left:2px;opacity:0.7;}
        .pill-x:hover{opacity:1;}
        .confirm-remove-row{background:#FEF3C7;border:1px solid #FCD34D;border-radius:8px;padding:8px 12px;margin-top:8px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
        .confirm-remove-text{font-size:12px;color:#92400E;flex:1;}
        .manage-hint{font-size:11px;color:#5B7FA6;margin-top:6px;font-style:italic;}
        .btn-gestionar{font-size:11px;padding:5px 10px;border-radius:6px;border:1px solid #B8D4F5;background:#F0F6FF;color:#1D5FA8;cursor:pointer;font-family:inherit;font-weight:600;transition:background .15s;}
        .btn-gestionar:hover{background:#DBEAFE;}
        .btn-gestionar.active{background:#1D5FA8;color:#fff;border-color:#1D5FA8;}
      `}</style>

      <div className="content-wrap">

        {/* ── Formulario nueva asignación ── */}
        <div className="assign-panel">
          <div className="form-card">
            <div className="form-title">Nueva asignación</div>

            <div className="field-wrap">
              <label className="field-label">Cuidador</label>
              <select
                className="field-select"
                value={caregiver}
                onChange={e => { setCaregiver(e.target.value); setSelected({}) }}
              >
                <option value="">Seleccionar cuidador...</option>
                {cuidadores.map(c => {
                  const cnt  = caregiverCurrentCount[c.email] || 0
                  const full = cnt >= MAX_PACIENTES_POR_CUIDADOR
                  return (
                    <option key={c.email} value={c.email} disabled={full}>
                      {c.nombre} — {cnt}/{MAX_PACIENTES_POR_CUIDADOR} pacientes{full ? ' (completo)' : ''}
                    </option>
                  )
                })}
              </select>

              {caregiver && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#5B7FA6', marginBottom: 4 }}>
                    <span>Capacidad actual</span>
                    <span style={{ fontWeight: 600, color: projectedCount > MAX_PACIENTES_POR_CUIDADOR ? '#DC2626' : projectedCount >= MAX_PACIENTES_POR_CUIDADOR * 0.75 ? '#D97706' : '#065F46' }}>
                      {selectedCount > 0 ? `${currentCount} + ${selectedCount} = ` : ''}{projectedCount}/{MAX_PACIENTES_POR_CUIDADOR}
                    </span>
                  </div>
                  <div className="capacity-bar">
                    <div className="capacity-fill" style={{
                      width: `${Math.min(100, (projectedCount / MAX_PACIENTES_POR_CUIDADOR) * 100)}%`,
                      background: projectedCount > MAX_PACIENTES_POR_CUIDADOR ? '#DC2626' : projectedCount >= MAX_PACIENTES_POR_CUIDADOR * 0.75 ? '#D97706' : '#059669',
                    }} />
                  </div>
                </div>
              )}
            </div>

            <div className="field-wrap">
              <label className="field-label">Pacientes a asignar</label>
              <div className="multi-wrap">
                <input className="multi-search" type="text" placeholder="Buscar paciente..."
                  value={patSearch} onChange={e => setPatSearch(e.target.value)} />
                <div className="multi-list">
                  {loading
                    ? <div style={{ padding: 12, fontSize: 12, color: '#7A8FA8' }}>Cargando...</div>
                    : visiblePatients.map(p => {
                      const cgCount    = patientCaregiverCount[p.code] || 0
                      const atMax      = cgCount >= MAX_CUIDADORES_POR_PACIENTE
                      const alreadyHere = alreadyWithThisCaregiver.has(p.code)
                      const isSelected  = !!selected[p.code]
                      return (
                        <div
                          key={p.code}
                          className={`multi-item${isSelected ? ' selected' : ''}${atMax || alreadyHere ? ' disabled-pat' : ''}${alreadyHere && !atMax ? ' already-assigned' : ''}`}
                          onClick={() => { if (!atMax && !alreadyHere) togglePat(p.code, p.name) }}
                          title={alreadyHere ? 'Ya asignado a este cuidador' : atMax ? `Cupo lleno (${MAX_CUIDADORES_POR_PACIENTE}/${MAX_CUIDADORES_POR_PACIENTE} cuidadores)` : undefined}
                        >
                          <div className="multi-cb">{isSelected && <span className="multi-check">✓</span>}</div>
                          <span>{p.name}</span>
                          <span className="pat-code">{p.code}</span>
                          {alreadyHere
                            ? <span className="pat-already">Ya asignado</span>
                            : atMax
                            ? <span className="pat-caregiver-full">{cgCount}/{MAX_CUIDADORES_POR_PACIENTE} cupo lleno</span>
                            : cgCount > 0
                            ? <span className="pat-caregiver-count">{cgCount}/{MAX_CUIDADORES_POR_PACIENTE}</span>
                            : null
                          }
                        </div>
                      )
                    })
                  }
                </div>
              </div>
              <div className="tags-wrap">
                {Object.entries(selected).map(([code]) => (
                  <div key={code} className="tag">{code}<span className="tag-x" onClick={() => removeTag(code)}>×</span></div>
                ))}
              </div>
            </div>

            {caregiver && selectedCount > 0 && blockingErrors.length > 0 && (
              <div className="block-error-list">
                <div className="block-error-title">No se puede confirmar</div>
                {blockingErrors.map((e, i) => (
                  <div key={i} className="block-error-item"><span>·</span><span>{e}</span></div>
                ))}
              </div>
            )}

            <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} disabled={!canAssign || saving} onClick={doAssign}>
              {saving ? 'Guardando...' : 'Confirmar asignación'}
            </button>
            {saveError && <div className="action-error">{saveError}</div>}
            {saveMsg   && <div className="action-success">{saveMsg}</div>}
            {loadError && <div className="action-error">{loadError}</div>}
          </div>
        </div>

        {/* ── Tabla de asignaciones activas ── */}
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
                <tr>
                  <th>Cuidador</th>
                  <th>Pacientes asignados</th>
                  <th style={{ width: 70 }}>Cupos</th>
                  <th style={{ width: 100 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan="4" className="state-empty"><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                )}
                {!loading && visibleAssignments.length === 0 && (
                  <tr><td colSpan="4" className="state-empty">Sin asignaciones activas.</td></tr>
                )}
                {!loading && visibleAssignments.map((a, i) => {
                  const email    = rowEmail(a)
                  const patients = a.patients || []
                  const cnt      = patients.length
                  const pct      = cnt / MAX_PACIENTES_POR_CUIDADOR
                  const lbCls    = cnt >= MAX_PACIENTES_POR_CUIDADOR ? 'lb-full' : pct >= 0.75 ? 'lb-warn' : 'lb-ok'
                  const isManaging = managingRow === email

                  return (
                    <tr key={i} className={isManaging ? 'manage-row' : ''}>
                      <td>
                        <div className="caregiver-name">{a.cuidador}</div>
                        <div className="caregiver-email">{email}</div>
                      </td>

                      <td>
                        {!isManaging ? (
                          /* Modo normal: pills de solo lectura */
                          <div className="pat-pills">
                            {patients.map(p => <span key={p} className="pat-pill">{p}</span>)}
                          </div>
                        ) : (
                          /* Modo gestión: chips removibles */
                          <div>
                            <div className="removable-pills">
                              {patients.map(p => {
                                const isPending = confirmRemove?.email === email && confirmRemove?.pid === p
                                return (
                                  <span
                                    key={p}
                                    className={`removable-pill${isPending ? ' removing' : ''}`}
                                    title="Clic en × para quitar este paciente"
                                  >
                                    {p}
                                    <span
                                      className="pill-x"
                                      onClick={() => {
                                        setRemoveError('')
                                        setConfirmRemove(isPending ? null : { email, pid: p })
                                      }}
                                    >×</span>
                                  </span>
                                )
                              })}
                            </div>

                            {/* Confirmación inline por paciente */}
                            {confirmRemove?.email === email && (
                              <div className="confirm-remove-row">
                                <span className="confirm-remove-text">
                                  ¿Quitar <strong>{confirmRemove.pid}</strong> de este cuidador?
                                </span>
                                <button
                                  className="btn btn-sm btn-danger"
                                  disabled={removeLoading}
                                  onClick={doRemovePatient}
                                >
                                  {removeLoading ? '...' : 'Confirmar'}
                                </button>
                                <button
                                  className="btn btn-sm btn-secondary"
                                  disabled={removeLoading}
                                  onClick={() => { setConfirmRemove(null); setRemoveError('') }}
                                >
                                  Cancelar
                                </button>
                              </div>
                            )}
                            {removeError && <div className="action-error" style={{ marginTop: 6 }}>{removeError}</div>}
                            <div className="manage-hint">Haz clic en × sobre un paciente para quitarlo.</div>
                          </div>
                        )}
                      </td>

                      <td>
                        <span className={`limit-badge ${lbCls}`}>{cnt}/{MAX_PACIENTES_POR_CUIDADOR}</span>
                      </td>

                      <td>
                        <button
                          className={`btn-gestionar${isManaging ? ' active' : ''}`}
                          onClick={() => {
                            setManagingRow(isManaging ? null : email)
                            setConfirmRemove(null)
                            setRemoveError('')
                          }}
                        >
                          {isManaging ? 'Cerrar' : 'Gestionar'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
