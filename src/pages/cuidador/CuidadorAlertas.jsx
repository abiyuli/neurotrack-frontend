import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import api from '../../api/client'

// Mapa de nivel → qué debe hacer el cuidador
const NIVEL_CONFIG = {
  high: {
    label: 'Atención prioritaria',
    color: '#DC2626',
    bg: '#FEE2E2',
    border: '#FCA5A5',
    accion: 'Contactar al médico tratante hoy o llevar al paciente a consulta.',
  },
  medium: {
    label: 'Seguimiento cercano',
    color: '#D97706',
    bg: '#FEF3C7',
    border: '#FCD34D',
    accion: 'Informar al médico en la próxima consulta o comunicarse si los episodios se repiten.',
  },
  low: {
    label: 'Registro normal',
    color: '#059669',
    bg: '#ECFDF5',
    border: '#6EE7B7',
    accion: 'Registrar y monitorear. No requiere acción inmediata.',
  },
}

function getFallbackNivel(typeClass) {
  if (!typeClass) return 'low'
  if (typeClass.includes('danger') || typeClass.includes('high')) return 'high'
  if (typeClass.includes('warn')   || typeClass.includes('medium')) return 'medium'
  return 'low'
}

export default function CuidadorAlertas() {
  const { setTitle } = useOutletContext()
  const [alerts,   setAlerts]   = useState([])
  const [summary,  setSummary]  = useState({ total: 0, last24h: 0, last7d: 0, byPatient: {} })
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  useEffect(() => { setTitle('Alertas activas') }, [setTitle])

  useEffect(() => {
    api.get('/cuidador/alerts')
      .then(({ data }) => {
        setAlerts(data.alerts || [])
        setSummary(data.summary || { total: 0, last24h: 0, last7d: 0, byPatient: {} })
      })
      .catch(() => setError('No se pudieron cargar las alertas'))
      .finally(() => setLoading(false))
  }, [])

  const prioritarias = alerts.filter(a => (a.level || getFallbackNivel(a.typeClass)) === 'high').length

  return (
    <div className="admin-panel">
      <style>{`
        .feed-item{background:#fff;border:1px solid var(--c-border);border-radius:10px;padding:14px 16px;margin-bottom:10px;}
        .feed-item.high{border-left:3px solid #DC2626;}
        .feed-item.medium{border-left:3px solid #D97706;}
        .feed-item.low{border-left:3px solid #059669;}
        .feed-top{display:flex;align-items:center;gap:8px;margin-bottom:6px;}
        .feed-type{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.04em;padding:2px 8px;border-radius:999px;}
        .feed-time{font-size:11px;color:var(--c-text-muted);margin-left:auto;}
        .feed-pat{font-size:13px;font-weight:600;color:var(--c-navy);margin-bottom:3px;}
        .feed-detail{font-size:12px;color:var(--c-text-sec);line-height:1.5;margin-bottom:10px;}
        .feed-accion-row{display:flex;align-items:flex-start;gap:8px;padding:8px 10px;border-radius:8px;margin-top:2px;}
        .feed-accion-icon{font-size:12px;font-weight:700;flex-shrink:0;margin-top:1px;}
        .feed-accion-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.03em;margin-bottom:2px;}
        .feed-accion-text{font-size:11px;line-height:1.5;}
        .feed-nivel-badge{display:inline-flex;align-items:center;padding:2px 9px;border-radius:999px;font-size:10px;font-weight:700;border:1px solid;}
        .feed-outer{display:flex;flex-direction:column;}
        .prioritarias-banner{background:#FEE2E2;border:1px solid #FCA5A5;border-radius:10px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;gap:10px;font-size:13px;color:#991B1B;}
        .pri-dot{width:8px;height:8px;border-radius:50%;background:#DC2626;flex-shrink:0;}
      `}</style>

      <div className="anon-banner anon-banner-c">
        <div className="anon-dot" />
        Feed de alertas — solo lectura. Ordenadas por recencia.
      </div>

      <div className="content-wrap">
        <div className="content-main" style={{ gap: 12 }}>

          {loading && <div style={{ padding: 30, textAlign: 'center', color: '#7A8FA8', fontSize: 13 }}>Cargando alertas...</div>}
          {error   && <div style={{ padding: 20, color: '#A32D2D', fontSize: 13 }}>{error}</div>}

          {!loading && !error && (
            <>
              {prioritarias > 0 && (
                <div className="prioritarias-banner">
                  <div className="pri-dot" />
                  <strong>{prioritarias} alerta{prioritarias > 1 ? 's' : ''} de atención prioritaria</strong> — revisar y contactar al médico hoy si corresponde.
                </div>
              )}

              <div className="feed-outer">
                {alerts.length === 0 && (
                  <div style={{ padding: 30, textAlign: 'center', color: '#7A8FA8', fontSize: 13 }}>
                    Sin alertas recientes — todo en orden.
                  </div>
                )}
                {alerts.map((a, i) => {
                  const nivel = a.level || getFallbackNivel(a.typeClass)
                  const cfg   = NIVEL_CONFIG[nivel] || NIVEL_CONFIG.low
                  return (
                    <div key={i} className={`feed-item ${nivel}`}>
                      <div className="feed-top">
                        <span
                          className="feed-type"
                          style={{ background: cfg.bg, color: cfg.color }}
                        >
                          {a.type}
                        </span>
                        <span
                          className="feed-nivel-badge"
                          style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
                        >
                          {cfg.label}
                        </span>
                        <span className="feed-time">{a.time}</span>
                      </div>
                      <div className="feed-pat">{a.patient_id}</div>
                      <div className="feed-detail">{a.detail}</div>
                      <div
                        className="feed-accion-row"
                        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                      >
                        <div className="feed-accion-icon" style={{ color: cfg.color }}>→</div>
                        <div>
                          <div className="feed-accion-label" style={{ color: cfg.color }}>¿Qué hacer?</div>
                          <div className="feed-accion-text" style={{ color: cfg.color }}>{cfg.accion}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        <div className="content-side">
          <div className="side-card">
            <div className="side-title">Resumen</div>
            <div className="m-row">
              <span className="m-label">Total alertas</span>
              <span className="m-val">{summary.total}</span>
            </div>
            <div className="m-div" />
            <div className="m-row">
              <span className="m-label">Últimas 24h</span>
              <span className="m-val" style={{ fontSize: 14, color: summary.last24h > 0 ? '#A32D2D' : 'inherit' }}>
                {summary.last24h}
              </span>
            </div>
            <div className="m-div" />
            <div className="m-row">
              <span className="m-label">Últimos 7 días</span>
              <span className="m-val" style={{ fontSize: 14 }}>{summary.last7d}</span>
            </div>
          </div>

          <div className="side-card">
            <div className="side-title">Por paciente</div>
            {Object.entries(summary.byPatient || {}).map(([pid, count]) => (
              <div key={pid} className="m-row">
                <span className="m-label">{pid}</span>
                <span className="m-val" style={{ fontSize: 14, color: count > 0 ? '#A32D2D' : '#5F5E5A' }}>{count}</span>
              </div>
            ))}
          </div>

          <div style={{ background: '#F0F6FF', border: '1px solid #B8D4F5', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0B2545', marginBottom: 6 }}>Niveles de atención</div>
            {Object.entries(NIVEL_CONFIG).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: v.color, flexShrink: 0, display: 'inline-block' }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: v.color }}>{v.label}</div>
                  <div style={{ fontSize: 10, color: '#5B7FA6', lineHeight: 1.4 }}>{v.accion}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
