import { useState, useEffect } from 'react'
import api from '../../api/client'

const MAX_PACIENTES_POR_CUIDADOR = 8
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
  const [removingPid,  setRemovingPid]  = useState(null)   // { email, pid }
  const [removeLoading, setRemoveLoading] = useState(false)
  const [removeError,  setRemoveError]  = useState('')
  const [managingRow,  setManagingRow]  = useState(null)

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

  // ── Derivar conteos ────────────────────────────────────────────────────────
  const caregiverCurrentCount = assignments.reduce((acc, a) => {
    acc[rowEmail(a)] = (a.patients || []).length
    return acc
  }, {})

  const selectedRow      = assignments.find(a => rowEmail(a) === caregiver)
  const existingPatients = selectedRow?.patients || []
  const existingSet      = new Set(existingPatients)

  const currentCount   = caregiverCurrentCount[caregiver] || 0
  const newCount       = Object.keys(selected).filter(p => !existingSet.has(p)).length
  const projectedCount = currentCount + newCount

  // Pacientes ya seleccionados que están con OTRO cuidador → advertencia de reasignación
  const toReassign = Object.keys(selected).filter(p => {
    const pat = pacientes.find(x => x.code === p)
    return pat?.caregiver && pat.caregiver !== caregiver
  })

  const caregiverWouldExceed = projectedCount > MAX_PACIENTES_POR_CUIDADOR
  const canAssign = caregiver && Object.keys(selected).length > 0 && !caregiverWouldExceed

  const togglePat = (code) => {
    setSelected(prev => {
      const next = { ...prev }
      if (next[code]) delete next[code]; else next[code] = true
      return next
    })
  }

  async function doAssign() {
    if (!canAssign) return
    setSaving(true); setSaveError('')
    try {
      // CRÍTICO: enviar lista completa (existentes + nuevos) para que el sync no borre a nadie
      const merged = [...new Set([...existingPatients, ...Object.keys(selected)])]
      await api.post('/admin/asignaciones', { cuidador_email: caregiver, patient_ids: merged })
      setCaregiver(''); setSelected({})
      setSaveMsg(`${Object.keys(selected).length} paciente(s) asignado(s) correctamente.`)
      setTimeout(() => setSaveMsg(''), 4000)
      load()
    } catch (err) {
      const msg = err.response?.data?.error || ''
      setSaveError('Error al registrar la asignación' + (msg ? `: ${msg}` : '.'))
    } finally { setSaving(false) }
  }

  async function doRemovePatient() {
    if (!removingPid || removeLoading) return
    const { email, pid } = removingPid
    const row = assignments.find(a => rowEmail(a) === email)
    if (!row) return
    const remaining = (row.patients || []).filter(p => p !== pid)
    setRemoveLoading(true); setRemoveError('')
    try {
      if (remaining.length === 0) {
        await api.delete(`/admin/asignaciones/${encodeURIComponent(email)}`)
        setManagingRow(null)
      } else {
        await api.post('/admin/asignaciones', { cuidador_email: email, patient_ids: remaining })
      }
      setRemovingPid(null)
      setSaveMsg(`${pid} desvinculado correctamente.`)
      setTimeout(() => setSaveMsg(''), 4000)
      load()
    } catch {
      setRemoveError('Error al desvincular. Inténtalo de nuevo.')
    } finally { setRemoveLoading(false) }
  }

  const visiblePats = pacientes.filter(p =>
    !patSearch ||
    p.name.toLowerCase().includes(patSearch.toLowerCase()) ||
    p.code.toLowerCase().includes(patSearch.toLowerCase())
  )

  const visibleAssignments = assignments.filter(a =>
    !assignSearch ||
    a.cuidador.toLowerCase().includes(assignSearch.toLowerCase()) ||
    (a.patients || []).some(p => p.toLowerCase().includes(assignSearch.toLowerCase()))
  )

  return (
    <div className="admin-panel">
      <style>{`
        /* ── form card ── */
        .asig-layout{display:flex;gap:20px;padding:20px 24px;flex:1;overflow:hidden;min-height:0;}
        .asig-form{width:320px;flex-shrink:0;display:flex;flex-direction:column;gap:0;overflow-y:auto;}
        .asig-table-section{flex:1;min-width:0;display:flex;flex-direction:column;gap:0;}
        .form-card{background:var(--c-surface);border:0.5px solid var(--c-border);border-radius:12px;padding:18px 20px;display:flex;flex-direction:column;gap:14px;}
        .form-title{font-size:13px;font-weight:600;color:var(--c-navy);letter-spacing:-0.01em;}
        .field-label{font-size:11px;font-weight:500;color:var(--c-text-sec);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;display:block;}
        .field-select{width:100%;padding:9px 12px;font-size:12px;border:0.5px solid var(--c-border-input);border-radius:8px;background:var(--c-surface);color:var(--c-navy);outline:none;font-family:inherit;cursor:pointer;}
        .field-select:focus{border-color:var(--c-blue);}
        /* ── capacity bar ── */
        .cap-row{display:flex;justify-content:space-between;font-size:11px;color:var(--c-text-sec);margin-bottom:4px;}
        .cap-bar{height:3px;border-radius:2px;background:#E5E7EB;overflow:hidden;}
        .cap-fill{height:100%;border-radius:2px;transition:width .3s;}
        /* ── patient list ── */
        .pat-search{width:100%;padding:7px 10px;font-size:12px;border:0.5px solid var(--c-border-input);border-radius:7px;background:var(--c-surface-alt);color:var(--c-navy);outline:none;font-family:inherit;margin-bottom:6px;}
        .pat-search:focus{border-color:var(--c-blue);}
        .pat-list{border:0.5px solid var(--c-border);border-radius:8px;overflow-y:auto;max-height:240px;background:var(--c-surface);}
        .pat-item{display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;border-bottom:0.5px solid var(--c-border-sub);transition:background .1s;}
        .pat-item:last-child{border-bottom:none;}
        .pat-item:hover{background:var(--c-row-hover);}
        .pat-item.sel{background:#EFF6FF;}
        .pat-cb{width:14px;height:14px;border-radius:3px;border:1.5px solid var(--c-border-input);flex-shrink:0;display:flex;align-items:center;justify-content:center;}
        .pat-item.sel .pat-cb{background:var(--c-blue);border-color:var(--c-blue);}
        .pat-cb-check{width:8px;height:8px;stroke:#fff;fill:none;}
        .pat-info{flex:1;min-width:0;}
        .pat-name{font-size:12px;font-weight:500;color:var(--c-navy);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .pat-code{font-size:10px;color:var(--c-text-muted);}
        .pat-badge{font-size:10px;font-weight:500;padding:1px 7px;border-radius:999px;white-space:nowrap;flex-shrink:0;}
        .pb-mine{background:#EFF6FF;color:#1D5FA8;}
        .pb-other{background:#FEF9C3;color:#854D0E;}
        .pb-none{background:#F0FDF4;color:#166534;}
        /* ── tags ── */
        .tags-wrap{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px;min-height:24px;}
        .tag{display:inline-flex;align-items:center;gap:4px;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:500;background:#EFF6FF;color:#1D5FA8;border:0.5px solid #BFDBFE;}
        .tag-x{cursor:pointer;font-size:14px;line-height:1;opacity:0.6;margin-left:1px;}
        .tag-x:hover{opacity:1;}
        /* ── warnings / errors ── */
        .warn-box{background:#FFFBEB;border:0.5px solid #FCD34D;border-radius:8px;padding:9px 12px;font-size:11px;color:#92400E;line-height:1.5;}
        .warn-title{font-weight:700;text-transform:uppercase;font-size:10px;letter-spacing:0.04em;margin-bottom:4px;}
        .err-box{background:#FEF2F2;border:0.5px solid #FCA5A5;border-radius:8px;padding:9px 12px;font-size:11px;color:#7F1D1D;line-height:1.5;}
        /* ── table section ── */
        .asig-table-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;}
        .asig-table-heading{font-size:13px;font-weight:600;color:var(--c-navy);}
        /* ── assignment row ── */
        .cg-name{font-size:12px;font-weight:500;color:var(--c-navy);}
        .cg-email{font-size:10px;color:var(--c-text-muted);margin-top:1px;}
        .pills-wrap{display:flex;flex-wrap:wrap;gap:5px;}
        .pat-pill{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:999px;font-size:11px;background:#E0EEFF;color:#1D5FA8;border:0.5px solid #B8D4F5;}
        .pat-pill.removing{background:#FEE2E2;color:#991B1B;border-color:#FCA5A5;}
        .pill-x{cursor:pointer;font-size:13px;line-height:1;margin-left:2px;opacity:0.6;transition:opacity .1s;}
        .pill-x:hover{opacity:1;}
        .pat-name-small{font-size:10px;color:var(--c-text-muted);margin-left:2px;}
        .confirm-bar{display:flex;align-items:center;gap:8px;background:#FEF9C3;border:0.5px solid #FCD34D;border-radius:8px;padding:8px 12px;margin-top:8px;flex-wrap:wrap;}
        .confirm-text{flex:1;font-size:12px;color:#92400E;}
        .limit-badge{display:inline-flex;align-items:center;padding:1px 7px;border-radius:999px;font-size:10px;font-weight:600;}
        .lb-ok{background:#ECFDF5;color:#065F46;}
        .lb-warn{background:#FEF3C7;color:#92400E;}
        .lb-full{background:#FEE2E2;color:#991B1B;}
        .btn-gestionar{font-size:11px;padding:5px 10px;border-radius:6px;border:0.5px solid var(--c-border-input);background:var(--c-surface-alt);color:var(--c-navy);cursor:pointer;font-family:inherit;font-weight:500;transition:background .15s,color .15s;}
        .btn-gestionar:hover{background:#EFF6FF;border-color:#BFDBFE;color:#1D5FA8;}
        .btn-gestionar.active{background:#1D5FA8;color:#fff;border-color:#1D5FA8;}
        .manage-row td{background:#F8FBFF !important;}
      `}</style>

      <div className="asig-layout">

        {/* ── Panel izquierdo: nueva asignación ── */}
        <div className="asig-form">
          <div className="form-card">
            <div className="form-title">Nueva asignación</div>

            {/* Cuidador */}
            <div>
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
                      {c.nombre}{full ? ' (cupo lleno)' : ` · ${cnt}/${MAX_PACIENTES_POR_CUIDADOR}`}
                    </option>
                  )
                })}
              </select>

              {caregiver && (
                <div style={{ marginTop: 8 }}>
                  <div className="cap-row">
                    <span>Capacidad</span>
                    <span style={{ fontWeight: 600, color: projectedCount > MAX_PACIENTES_POR_CUIDADOR ? '#DC2626' : projectedCount >= MAX_PACIENTES_POR_CUIDADOR * 0.75 ? '#D97706' : '#059669' }}>
                      {newCount > 0 ? `${currentCount} + ${newCount} = ` : ''}{projectedCount}/{MAX_PACIENTES_POR_CUIDADOR}
                    </span>
                  </div>
                  <div className="cap-bar">
                    <div className="cap-fill" style={{
                      width: `${Math.min(100, (projectedCount / MAX_PACIENTES_POR_CUIDADOR) * 100)}%`,
                      background: projectedCount > MAX_PACIENTES_POR_CUIDADOR ? '#DC2626' : projectedCount >= MAX_PACIENTES_POR_CUIDADOR * 0.75 ? '#D97706' : '#059669',
                    }} />
                  </div>
                </div>
              )}
            </div>

            {/* Pacientes */}
            <div>
              <label className="field-label">Pacientes</label>
              <input
                className="pat-search"
                type="text"
                placeholder="Buscar paciente..."
                value={patSearch}
                onChange={e => setPatSearch(e.target.value)}
              />
              <div className="pat-list">
                {loading
                  ? <div style={{ padding: '14px 12px', fontSize: 12, color: 'var(--c-text-sec)' }}>Cargando...</div>
                  : visiblePats.length === 0
                  ? <div style={{ padding: '14px 12px', fontSize: 12, color: 'var(--c-text-sec)' }}>Sin resultados.</div>
                  : visiblePats.map(p => {
                    const isSel     = !!selected[p.code]
                    const isMine    = existingSet.has(p.code)
                    const hasOther  = !isMine && !!p.caregiver

                    let badge = null
                    if (isMine)       badge = <span className="pat-badge pb-mine">Ya asignado</span>
                    else if (hasOther) badge = <span className="pat-badge pb-other">Con {p.caregiverName || p.caregiver}</span>
                    else              badge = <span className="pat-badge pb-none">Libre</span>

                    return (
                      <div
                        key={p.code}
                        className={`pat-item${isSel ? ' sel' : ''}`}
                        onClick={() => { if (!isMine) togglePat(p.code) }}
                        style={isMine ? { cursor: 'default', opacity: 0.6 } : undefined}
                        title={isMine ? 'Ya está asignado a este cuidador' : hasOther ? `Reasignar desde ${p.caregiverName || p.caregiver}` : undefined}
                      >
                        <div className="pat-cb">
                          {isSel && (
                            <svg className="pat-cb-check" viewBox="0 0 8 8" strokeWidth="1.8">
                              <polyline points="1,4 3,6 7,2"/>
                            </svg>
                          )}
                        </div>
                        <div className="pat-info">
                          <div className="pat-name">{p.name}</div>
                          <div className="pat-code">{p.code}</div>
                        </div>
                        {badge}
                      </div>
                    )
                  })
                }
              </div>

              {/* Tags de selección */}
              {Object.keys(selected).length > 0 && (
                <div className="tags-wrap">
                  {Object.keys(selected).map(code => {
                    const p = pacientes.find(x => x.code === code)
                    return (
                      <div key={code} className="tag">
                        {p?.name || code}
                        <span className="tag-x" onClick={() => {
                          setSelected(prev => { const n = {...prev}; delete n[code]; return n })
                        }}>×</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Advertencia de reasignación */}
            {toReassign.length > 0 && (
              <div className="warn-box">
                <div className="warn-title">Reasignación</div>
                {toReassign.map(code => {
                  const p = pacientes.find(x => x.code === code)
                  return <div key={code}>· <strong>{p?.name || code}</strong> se moverá desde <em>{p?.caregiverName || p?.caregiver}</em></div>
                })}
              </div>
            )}

            {/* Error de capacidad */}
            {caregiverWouldExceed && (
              <div className="err-box">
                Límite superado: este cuidador llegaría a {projectedCount}/{MAX_PACIENTES_POR_CUIDADOR} pacientes.
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={!canAssign || saving}
              onClick={doAssign}
            >
              {saving ? 'Guardando...' : `Confirmar asignación${Object.keys(selected).length > 0 ? ` (${Object.keys(selected).length})` : ''}`}
            </button>

            {saveError && <div className="err-box">{saveError}</div>}
            {saveMsg   && <div className="action-success">{saveMsg}</div>}
            {loadError && <div className="err-box">{loadError}</div>}
          </div>
        </div>

        {/* ── Panel derecho: asignaciones activas ── */}
        <div className="asig-table-section">
          <div className="asig-table-top">
            <div className="asig-table-heading">
              Asignaciones activas
              <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--c-text-sec)', marginLeft: 8 }}>
                {assignments.length} cuidador{assignments.length !== 1 ? 'es' : ''}
              </span>
            </div>
            <div className="search-wrap" style={{ width: 220, flex: 'none' }}>
              <svg className="search-icon" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#7A8FA8" strokeWidth="1.5">
                <circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l2.5 2.5"/>
              </svg>
              <input
                className="search-input"
                type="text"
                placeholder="Buscar cuidador o paciente..."
                value={assignSearch}
                onChange={e => setAssignSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-outer">
            <table className="admin-table" style={{ minWidth: 500 }}>
              <thead>
                <tr>
                  <th>Cuidador</th>
                  <th>Pacientes asignados</th>
                  <th style={{ width: 60 }}>Cupos</th>
                  <th style={{ width: 90 }}></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan="4" className="state-empty"><div className="spinner" style={{ margin: '0 auto' }}/></td></tr>
                )}
                {!loading && visibleAssignments.length === 0 && (
                  <tr><td colSpan="4" className="state-empty">Sin asignaciones activas.</td></tr>
                )}
                {!loading && visibleAssignments.map((a, i) => {
                  const email      = rowEmail(a)
                  const patients   = a.patients || []
                  const names      = a.patientNames || {}
                  const cnt        = patients.length
                  const pct        = cnt / MAX_PACIENTES_POR_CUIDADOR
                  const lbCls      = cnt >= MAX_PACIENTES_POR_CUIDADOR ? 'lb-full' : pct >= 0.75 ? 'lb-warn' : 'lb-ok'
                  const isManaging = managingRow === email

                  return (
                    <tr key={i} className={isManaging ? 'manage-row' : ''}>
                      <td>
                        <div className="cg-name">{a.cuidador}</div>
                        <div className="cg-email">{email}</div>
                      </td>

                      <td>
                        <div className="pills-wrap">
                          {patients.map(p => {
                            const isPending = removingPid?.email === email && removingPid?.pid === p
                            return (
                              <span
                                key={p}
                                className={`pat-pill${isPending ? ' removing' : ''}`}
                                title={names[p] || p}
                              >
                                {names[p] || p}
                                {isManaging && (
                                  <span
                                    className="pill-x"
                                    onClick={() => {
                                      setRemoveError('')
                                      setRemovingPid(isPending ? null : { email, pid: p })
                                    }}
                                  >×</span>
                                )}
                              </span>
                            )
                          })}
                        </div>

                        {/* Confirmación inline */}
                        {isManaging && removingPid?.email === email && (
                          <div className="confirm-bar">
                            <span className="confirm-text">
                              ¿Quitar <strong>{names[removingPid.pid] || removingPid.pid}</strong>?
                            </span>
                            <button className="btn btn-sm btn-danger" disabled={removeLoading} onClick={doRemovePatient}>
                              {removeLoading ? '...' : 'Confirmar'}
                            </button>
                            <button className="btn btn-sm btn-secondary" disabled={removeLoading} onClick={() => { setRemovingPid(null); setRemoveError('') }}>
                              Cancelar
                            </button>
                          </div>
                        )}
                        {isManaging && removeError && (
                          <div className="err-box" style={{ marginTop: 6, fontSize: 11 }}>{removeError}</div>
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
                            setRemovingPid(null)
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
