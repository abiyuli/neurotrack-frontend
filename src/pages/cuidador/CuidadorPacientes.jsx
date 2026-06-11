import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import api from '../../api/client'

// Derivar recomendación de acción según cantidad de alertas y última sesión
function getRecomendacion(p) {
  const alertas = p.alert_count || 0
  const sinSesion = !p.last_session || p.last_session === '—'

  if (alertas >= 3) return {
    nivel: 'alta',
    color: '#DC2626', bg: '#FEE2E2', border: '#FCA5A5',
    texto: 'Contactar al médico',
    detalle: 'Múltiples alertas registradas. Comunícate con el médico tratante.',
  }
  if (alertas >= 1) return {
    nivel: 'media',
    color: '#D97706', bg: '#FEF3C7', border: '#FCD34D',
    texto: 'Informar en consulta',
    detalle: 'Hay observaciones para revisar. Menciónalas en la próxima cita médica.',
  }
  if (sinSesion) return {
    nivel: 'info',
    color: '#1D5FA8', bg: '#EFF6FF', border: '#BFDBFE',
    texto: 'Sin sesiones aún',
    detalle: 'El paciente no ha iniciado sesiones de monitoreo.',
  }
  return {
    nivel: 'ok',
    color: '#059669', bg: '#ECFDF5', border: '#6EE7B7',
    texto: 'Todo en orden',
    detalle: 'Sin alertas activas. Continúa con el monitoreo habitual.',
  }
}

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
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : (data.patients || data.data || [])
        setPatients(list)
      })
      .catch(err => {
        const msg = err.response?.data?.message || err.response?.data?.error || ''
        setError('No se pudieron cargar los pacientes.' + (msg ? ` (${msg})` : ''))
      })
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

  const totalAlertas    = patients.reduce((s, p) => s + (p.alert_count || 0), 0)
  const necesitanAccion = patients.filter(p => (p.alert_count || 0) >= 1).length

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

              {/* Recomendación de acción para el cuidador */}
              {detail.totalAlerts > 0 && (
                <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Recomendación</div>
                  <div style={{ fontSize: 12, color: '#78350F', lineHeight: 1.55 }}>
                    Este paciente tiene <strong>{detail.totalAlerts} alerta{detail.totalAlerts > 1 ? 's' : ''}</strong> registrada{detail.totalAlerts > 1 ? 's' : ''}.
                    {detail.totalAlerts >= 3
                      ? ' Considera contactar al médico tratante antes de la próxima consulta programada.'
                      : ' Infórmalo en la próxima cita médica para que el médico evalúe la tendencia.'}
                  </div>
                </div>
              )}

              <div style={{ background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#065F46', marginBottom: 5 }}>Historial reciente</div>
                <div style={{ fontSize: 11, color: '#054E38', lineHeight: 1.8 }}>
                  {detail.history.map((h, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>{h.date}</span>
                      <span className={`alert-chip ${h.chipClass}`} style={{ fontSize: 10 }}>{h.chipLabel}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="readonly-note">
                Para ver el detalle clínico, consulta al médico tratante del paciente.
              </div>
            </div>

            <div className="content-side">
              <div className="side-card">
                <div className="side-title">¿Qué significan los módulos?</div>
                <div style={{ fontSize: 11, color: '#3A5270', lineHeight: 1.7 }}>
                  <div style={{ marginBottom: 8 }}><strong style={{ color: '#0B2545' }}>Temblor</strong><br />Movimientos involuntarios repetitivos detectados.</div>
                  <div style={{ marginBottom: 8 }}><strong style={{ color: '#0B2545' }}>FOG</strong><br />Bloqueos breves al intentar caminar.</div>
                  <div><strong style={{ color: '#0B2545' }}>Bradicinesia</strong><br />Lentitud al iniciar movimientos cotidianos.</div>
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
      <style>{`
        .pac-card{background:#fff;border:1px solid var(--c-border);border-radius:12px;padding:16px;cursor:pointer;transition:box-shadow .15s;}
        .pac-card:hover{box-shadow:0 2px 12px rgba(0,0,0,0.08);}
        .pac-card.has-alert{border-left:3px solid #DC2626;}
        .pac-card.has-warn{border-left:3px solid #D97706;}
        .pac-card.ok{border-left:3px solid #059669;}
        .pac-recom{display:flex;align-items:flex-start;gap:7px;padding:8px 10px;border-radius:7px;margin-top:10px;border:1px solid;}
        .pac-recom-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;margin-top:3px;}
        .pac-recom-body{}
        .pac-recom-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.03em;margin-bottom:2px;}
        .pac-recom-detail{font-size:11px;line-height:1.45;}
        .necesitan-banner{background:#FEF3C7;border:1px solid #FCD34D;border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:#92400E;display:flex;align-items:center;gap:8px;}
      `}</style>

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
              <div className="stat-val stat-val-lg" style={{ color: totalAlertas > 0 ? '#A32D2D' : 'inherit' }}>
                {loading ? '...' : totalAlertas}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Requieren seguimiento</div>
              <div className="stat-val stat-val-lg" style={{ color: necesitanAccion > 0 ? '#D97706' : '#059669' }}>
                {loading ? '...' : necesitanAccion}
              </div>
            </div>
          </div>

          {loading && <div className="state-loading"><div className="spinner" /><span>Cargando pacientes...</span></div>}
          {error   && <div className="state-error">{error}</div>}

          {!loading && !error && patients.length === 0 && (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: '#7A8FA8', fontSize: 13, background: '#fff', borderRadius: 10, border: '1px solid #e0e4eb' }}>
              <div style={{ fontSize: 22, marginBottom: 10 }}>👤</div>
              <div style={{ fontWeight: 600, color: '#0B2545', marginBottom: 6 }}>Sin pacientes asignados</div>
              <div>Aún no tienes pacientes a cargo. Un médico o administrador debe asignarte desde el sistema.</div>
            </div>
          )}

          {!loading && !error && patients.length > 0 && (
            <>
              {necesitanAccion > 0 && (
                <div className="necesitan-banner">
                  <span style={{ fontSize: 14 }}>⚠</span>
                  <span><strong>{necesitanAccion} paciente{necesitanAccion > 1 ? 's' : ''}</strong> con observaciones — revisa las tarjetas y actúa según la recomendación.</span>
                </div>
              )}

              <div className="pac-grid">
                {patients.map(p => {
                  const rec = getRecomendacion(p)
                  return (
                    <div key={p.patient_id} className={`pac-card ${p.alert_count > 1 ? 'has-alert' : p.alert_count === 1 ? 'has-warn' : 'ok'}`} onClick={() => openIndicadores(p.patient_id)}>
                      <div className="pac-header">
                        <div className="pac-code">{p.patient_id}</div>
                        <div className={`pac-status-dot dot-${p.alert_count > 1 ? 'danger' : p.alert_count === 1 ? 'warn' : 'ok'}`} />
                      </div>
                      <div className="pac-row">
                        <span className="pac-key">Última sesión</span>
                        <span className="pac-val">{p.last_session || '—'}</span>
                      </div>
                      <div className="pac-row">
                        <span className="pac-key">Módulos activos</span>
                        <span className="pac-val">{p.modules || '—'}</span>
                      </div>
                      <div className="pac-div" />

                      {/* Recomendación de acción */}
                      <div
                        className="pac-recom"
                        style={{ background: rec.bg, borderColor: rec.border }}
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="pac-recom-dot" style={{ background: rec.color }} />
                        <div className="pac-recom-body">
                          <div className="pac-recom-label" style={{ color: rec.color }}>{rec.texto}</div>
                          <div className="pac-recom-detail" style={{ color: rec.color }}>{rec.detalle}</div>
                        </div>
                      </div>

                      <button className="btn-ver-c" style={{ marginTop: 10 }} onClick={e => { e.stopPropagation(); openIndicadores(p.patient_id) }}>
                        Ver indicadores
                      </button>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          <div className="readonly-note">
            Solo lectura · Sin exportación · Sin acceso a gráficas ni datos clínicos
          </div>
        </div>

        <div className="content-side">
          <div className="side-card">
            <div className="side-title">Resumen alertas</div>
            <div className="m-row">
              <span className="m-label">Total</span>
              <span className="m-val" style={{ fontSize: 14 }}>{totalAlertas}</span>
            </div>
            <div className="m-div" />
            {patients.map(p => (
              <div key={p.patient_id} className="m-row">
                <span className="m-label">{p.patient_id}</span>
                <span className="m-val" style={{ fontSize: 13, color: p.alert_count > 0 ? '#A32D2D' : '#5F5E5A' }}>{p.alert_count || 0}</span>
              </div>
            ))}
          </div>

          <div style={{ background: '#F0F6FF', border: '1px solid #B8D4F5', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0B2545', marginBottom: 8 }}>Guía de recomendaciones</div>
            {[
              { color: '#DC2626', label: 'Contactar al médico', desc: '3 o más alertas activas' },
              { color: '#D97706', label: 'Informar en consulta', desc: '1–2 alertas activas' },
              { color: '#059669', label: 'Todo en orden',       desc: 'Sin alertas activas' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0, marginTop: 3, display: 'inline-block' }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: r.color }}>{r.label}</div>
                  <div style={{ fontSize: 10, color: '#5B7FA6' }}>{r.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
