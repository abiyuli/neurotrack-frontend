import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import api from '../../api/client'

export default function CuidadorPacientes() {
  const { setTitle } = useOutletContext()
  const [view,      setView]      = useState('lista')
  const [activePat, setActivePat] = useState(null)
  const [patients,  setPatients]  = useState([])
  const [detail,    setDetail]    = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')

  useEffect(() => {
    setTitle(view === 'indicadores' ? 'Indicadores de sesión' : 'Mis pacientes')
  }, [view, setTitle])

  useEffect(() => {
    api.get('/cuidador/patients')
      .then(({ data }) => setPatients(data.patients || []))
      .catch(() => setError('No se pudieron cargar los pacientes'))
      .finally(() => setLoading(false))
  }, [])

  function openIndicadores(pid) {
    setActivePat(pid)
    setView('indicadores')
    setDetail(null)
    api.get(`/cuidador/patients/${pid}/indicators`)
      .then(({ data }) => setDetail(data))
      .catch(() => setDetail(null))
  }

  function backToLista() { setActivePat(null); setView('lista') }

  const totalAlertas = patients.reduce((s, p) => s + (p.alert_count || 0), 0)
  const lastSession  = patients.length ? patients[0]?.last_session : '—'

  const cardClass = (p) => {
    if (p.alert_count > 1) return 'has-alert'
    if (p.alert_count === 1) return 'has-warn'
    return 'ok'
  }
  const dot = (p) => {
    if (p.alert_count > 1) return 'danger'
    if (p.alert_count === 1) return 'warn'
    return 'ok'
  }
  const chip = (p) => {
    if (p.alert_count > 1) return { cls: 'ac-danger', label: `${p.alert_count} alertas activas` }
    if (p.alert_count === 1) return { cls: 'ac-warn', label: '1 alerta activa' }
    return { cls: 'ac-ok', label: 'Sin alertas' }
  }

  if (view === 'indicadores') {
    return (
      <div className="admin-panel">
        <div className="anon-banner anon-banner-c">
          <div className="anon-dot" />
          Indicadores de sesión — solo lectura. Sin gráficas ni datos clínicos personales.
        </div>
        <div className="breadcrumb">
          <button className="bc-link bc-link-c" onClick={backToLista}>Mis pacientes</button>
          <span className="bc-sep">/</span>
          <span className="bc-cur" aria-current="page">{activePat} — Indicadores</span>
        </div>

        {!detail ? (
          <div className="state-loading"><div className="spinner" /><span>Cargando indicadores...</span></div>
        ) : (
          <div className="content-wrap">
            <div className="content-main" style={{ gap: 12 }}>
              <div className="ind-grid">
                <div className="ind-card">
                  <div className={`ind-val${detail.totalAlerts > 0 ? ' v-danger' : ''}`}>{detail.totalAlerts}</div>
                  <div className="ind-label">Alertas totales</div>
                </div>
                <div className="ind-card">
                  <div className="ind-val">{detail.activeModules}</div>
                  <div className="ind-label">Módulos activos</div>
                </div>
                <div className="ind-card">
                  <div className="ind-val" style={{ fontSize: 16, marginTop: 4 }}>{detail.lastSession}</div>
                  <div className="ind-label">Última sesión</div>
                </div>
              </div>

              <div className="mod-summary">
                <div className="mod-title">Módulos de la última sesión</div>
                {detail.modules.map((m, i) => (
                  <div className="mod-row" key={i}>
                    <div className="mod-name">
                      <span className={`mod-dot ${m.dotClass}`} />
                      {m.name}
                    </div>
                    <span className={`alert-chip ${m.chipClass}`}>{m.chipLabel}</span>
                  </div>
                ))}
              </div>
              <div className="readonly-note">
                Para ver el detalle clínico, consulta al médico tratante del paciente.
              </div>
            </div>

            <div className="content-side">
              <div className="side-card">
                <div className="side-title">Historial reciente</div>
                <div style={{ fontSize: 11, color: '#5B7FA6', lineHeight: 1.8 }}>
                  {detail.history.map((h, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>{h.date}</span>
                      <span className={`alert-chip ${h.chipClass}`} style={{ fontSize: 10 }}>{h.chipLabel}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="admin-panel">
      <div className="anon-banner anon-banner-c">
        <div className="anon-dot" />
        Vista de solo lectura — datos anonimizados. Sin acceso a información clínica personal.
      </div>
      <div className="content-wrap">
        <div className="content-main" style={{ gap: 12 }}>
          <div className="stat-row">
            <div className="stat-card">
              <div className="stat-label">Pacientes a cargo</div>
              <div className="stat-val stat-val-lg">{loading ? '...' : patients.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Alertas activas</div>
              <div className="stat-val stat-val-lg" style={{ color: '#A32D2D' }}>{loading ? '...' : totalAlertas}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Última sesión</div>
              <div className="stat-val" style={{ fontSize: 14, marginTop: 4 }}>{lastSession}</div>
            </div>
          </div>

          {loading && <div className="state-loading"><div className="spinner" /><span>Cargando pacientes...</span></div>}
          {error   && <div className="state-error">{error}</div>}

          {!loading && !error && (
            <div className="pac-grid">
              {patients.map(p => {
                const c = chip(p)
                return (
                  <div key={p.patient_id} className={`pac-card ${cardClass(p)}`} onClick={() => openIndicadores(p.patient_id)}>
                    <div className="pac-header">
                      <div className="pac-code">{p.patient_id}</div>
                      <div className={`pac-status-dot dot-${dot(p)}`} />
                    </div>
                    <div className="pac-row">
                      <span className="pac-key">Última sesión</span>
                      <span className="pac-val">{p.last_session}</span>
                    </div>
                    <div className="pac-row">
                      <span className="pac-key">Módulos activos</span>
                      <span className="pac-val">{p.modules}</span>
                    </div>
                    <div className="pac-div" />
                    <span className={`alert-chip ${c.cls}`}>{c.label}</span>
                    <button className="btn-ver-c" onClick={e => { e.stopPropagation(); openIndicadores(p.patient_id) }}>
                      Ver indicadores
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          <div className="readonly-note">
            Solo lectura · Sin exportación · Sin acceso a gráficas ni datos clínicos
          </div>
        </div>

        <div className="content-side">
          <div className="side-card">
            <div className="side-title">Resumen alertas</div>
            <div className="m-row"><span className="m-label">Total</span><span className="m-val" style={{ fontSize: 14 }}>{totalAlertas}</span></div>
            <div className="m-div" />
            {patients.map(p => (
              <div key={p.patient_id} className="m-row">
                <span className="m-label">{p.patient_id}</span>
                <span className="m-val" style={{ fontSize: 13, color: p.alert_count > 0 ? '#A32D2D' : '#5F5E5A' }}>{p.alert_count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
