import { useState, useEffect } from 'react'
import api from '../../api/client'

const MOD_INFO = {
  tremor: {
    pill: 'mp-tremor',
    icon: '〜',
    name: 'Temblor',
    desc: 'Detecta movimientos involuntarios repetitivos en las extremidades durante la sesión de monitoreo.',
    nota: 'Los temblores pueden variar a lo largo del día y según el estado de la medicación.',
  },
  fog: {
    pill: 'mp-fog',
    icon: '⏸',
    name: 'FOG — Bloqueo de marcha',
    desc: 'Identifica episodios breves en los que el movimiento se detiene de forma súbita al intentar caminar.',
    nota: 'El estrés, el cansancio y los espacios reducidos pueden aumentar estos episodios.',
  },
  brady: {
    pill: 'mp-brady',
    icon: '↙',
    name: 'Bradicinesia',
    desc: 'Mide la lentitud al iniciar o ejecutar movimientos cotidianos como levantarse o extender el brazo.',
    nota: 'Suele ser más notable al despertar o cuando el efecto de la medicación disminuye.',
  },
}

export default function PacienteDashboard() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [eduOpen, setEduOpen] = useState(false)

  useEffect(() => {
    api.get('/paciente/dashboard')
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ padding: 50, textAlign: 'center', color: '#7A8FA8', fontSize: 13 }}>Cargando tu información...</div>
  )
  if (!data) return null

  const { perfil, resumen, recentAlertas } = data
  const initials = perfil.nombre.trim().split(' ').slice(0, 2).map(p => p[0]?.toUpperCase()).join('')

  const tendencia = resumen.tendencia // { direccion: 'baja'|'sube'|'igual', texto: '...' } — opcional
  const hayAlertas = recentAlertas?.length > 0

  return (
    <>
      <style>{`
        .edu-toggle{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#F0F6FF;border:1px solid #B8D4F5;border-radius:10px;cursor:pointer;margin-bottom:4px;user-select:none;}
        .edu-toggle-title{font-size:13px;font-weight:600;color:#0B2545;display:flex;align-items:center;gap:8px;}
        .edu-toggle-icon{width:18px;height:18px;border-radius:50%;background:#1D5FA8;color:#fff;font-size:10px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;}
        .edu-toggle-arrow{font-size:11px;color:#5B7FA6;transition:transform .2s;}
        .edu-toggle-arrow.open{transform:rotate(180deg);}
        .edu-body{background:#F0F6FF;border:1px solid #B8D4F5;border-top:none;border-radius:0 0 10px 10px;padding:4px 16px 14px;margin-bottom:16px;}
        .edu-mod{padding:10px 0;border-bottom:1px solid #D4E7F8;}
        .edu-mod:last-child{border-bottom:none;}
        .edu-mod-header{display:flex;align-items:center;gap:8px;margin-bottom:4px;}
        .edu-mod-name{font-size:12px;font-weight:700;color:#0B2545;}
        .edu-mod-desc{font-size:12px;color:#3A5270;line-height:1.55;margin-bottom:3px;}
        .edu-mod-nota{font-size:11px;color:#5B7FA6;font-style:italic;}
        .trend-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:999px;font-size:11px;font-weight:600;}
        .trend-baja{background:#ECFDF5;color:#065F46;}
        .trend-sube{background:#FEF3C7;color:#92400E;}
        .trend-igual{background:#F3F4F6;color:#374151;}
        .accion-card{background:#FFFBF5;border:1px solid #EFB97A;border-radius:10px;padding:12px 14px;margin-top:4px;}
        .accion-title{font-size:11px;font-weight:700;color:#7A4F00;margin-bottom:5px;text-transform:uppercase;letter-spacing:0.04em;}
        .accion-text{font-size:12px;color:#5B3F00;line-height:1.6;}
        .alert-nivel{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:600;margin-left:auto;}
        .nivel-consulta{background:#ECFDF5;color:#065F46;}
        .nivel-pronto{background:#FEF3C7;color:#92400E;}
        .pac-alert-meta-ext{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-top:6px;}
      `}</style>

      {/* Tarjeta de perfil */}
      <div className="pac-profile-card">
        <div className="pac-avatar-lg">{initials}</div>
        <div className="pac-profile-info">
          <div className="pac-profile-name">{perfil.nombre}</div>
          <div className="pac-profile-id">Código paciente: {perfil.patientId}</div>
          <div className="pac-profile-tags">
            {perfil.diagnostico !== '—' && (
              <div className="pac-tag"><span>Diagnóstico</span><span className="pac-tag-label">{perfil.diagnostico}</span></div>
            )}
            {perfil.edad !== '—' && (
              <div className="pac-tag"><span>Edad</span><span className="pac-tag-label">{perfil.edad} años</span></div>
            )}
            {perfil.tiempoDiagnostico !== '—' && (
              <div className="pac-tag"><span>Tiempo diagnóstico</span><span className="pac-tag-label">{perfil.tiempoDiagnostico}</span></div>
            )}
            {perfil.medicacion !== '—' && (
              <div className="pac-tag">
                <span>Medicación</span>
                <span className="pac-tag-label">{perfil.medicacion}</span>
                {perfil.dosis !== '—' && <span style={{ color: '#7A8FA8' }}>· {perfil.dosis}</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="pac-kpi-grid">
        <div className="pac-kpi-card">
          <div className="pac-kpi-icon pac-kpi-icon-blue">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 2h8a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/>
              <path d="M6 6h4M6 9h3"/>
            </svg>
          </div>
          <div>
            <div className="pac-kpi-val">{resumen.totalSesiones}</div>
            <div className="pac-kpi-label">Sesiones registradas</div>
          </div>
        </div>

        <div className="pac-kpi-card">
          <div className="pac-kpi-icon pac-kpi-icon-orange">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 2a5 5 0 015 5v3l1.5 2H1.5L3 10V7a5 5 0 015-5z"/>
              <path d="M6.5 13.5a1.5 1.5 0 003 0"/>
            </svg>
          </div>
          <div>
            <div className="pac-kpi-val" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {resumen.totalAlertas}
              {tendencia && (
                <span className={`trend-badge trend-${tendencia.direccion}`}>
                  {tendencia.direccion === 'baja' ? '↓' : tendencia.direccion === 'sube' ? '↑' : '→'} {tendencia.texto}
                </span>
              )}
            </div>
            <div className="pac-kpi-label">Observaciones registradas</div>
          </div>
        </div>

        <div className="pac-kpi-card">
          <div className="pac-kpi-icon pac-kpi-icon-green">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="6"/>
              <path d="M8 5v3l2 2"/>
            </svg>
          </div>
          <div>
            <div className="pac-kpi-val" style={{ fontSize: 15, paddingTop: 4 }}>
              {resumen.ultimaSesion ? resumen.ultimaSesion.fecha : '—'}
            </div>
            <div className="pac-kpi-label">Última sesión</div>
          </div>
        </div>
      </div>

      {/* ¿Qué mide NeuroTrack? — educación colapsable */}
      <div className="pac-section">
        <div className="edu-toggle" onClick={() => setEduOpen(o => !o)} role="button" aria-expanded={eduOpen}>
          <div className="edu-toggle-title">
            <span className="edu-toggle-icon">i</span>
            ¿Qué mide NeuroTrack?
          </div>
          <span className={`edu-toggle-arrow${eduOpen ? ' open' : ''}`}>▼</span>
        </div>
        {eduOpen && (
          <div className="edu-body">
            {Object.values(MOD_INFO).map(m => (
              <div key={m.name} className="edu-mod">
                <div className="edu-mod-header">
                  <span style={{ fontSize: 16 }}>{m.icon}</span>
                  <span className={`pac-mod-pill mp-${m.pill?.replace('mp-', '') || 'tremor'}`}>{m.name}</span>
                </div>
                <div className="edu-mod-desc">{m.desc}</div>
                <div className="edu-mod-nota">ⓘ {m.nota}</div>
              </div>
            ))}
            <div style={{ marginTop: 10, fontSize: 11, color: '#5B7FA6', lineHeight: 1.6 }}>
              Los datos registrados son enviados automáticamente al médico tratante para su análisis clínico.
              <strong style={{ color: '#0B2545' }}> Este sistema no emite diagnósticos.</strong>
            </div>
          </div>
        )}
      </div>

      {/* Última sesión */}
      {resumen.ultimaSesion && (
        <div className="pac-section">
          <div className="pac-section-title">Última sesión registrada</div>
          <div className="pac-session-card">
            <div className="pac-session-date">{resumen.ultimaSesion.fecha}</div>
            <div className="pac-session-mods">
              {resumen.ultimaSesion.modulos.map((m, i) => (
                <span key={i} className={`pac-mod-pill mp-${m === 'Temblor' ? 'tremor' : m === 'FOG' ? 'fog' : 'brady'}`}>{m}</span>
              ))}
            </div>
            <div className="pac-session-dur">{resumen.ultimaSesion.duration}</div>
          </div>
        </div>
      )}

      {/* Observaciones recientes */}
      <div className="pac-section">
        <div className="pac-section-title">Observaciones recientes</div>
        {!hayAlertas ? (
          <div className="pac-empty">
            <div className="pac-empty-icon">✓</div>
            Sin observaciones recientes registradas
          </div>
        ) : (
          <>
            {recentAlertas.map((a, i) => (
              <AlertCard key={i} alerta={a} />
            ))}
            <div className="accion-card">
              <div className="accion-title">¿Qué hago con estas observaciones?</div>
              <div className="accion-text">
                Son registros automáticos del dispositivo, <strong>no son diagnósticos</strong>. Compártelas con tu médico en tu próxima consulta para que pueda analizarlas en contexto con tu historial y medicación.
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

function AlertCard({ alerta }) {
  const key = modKey(alerta.modClass)
  const mod = key ? MOD_INFO[key] : null
  const iconClass = alerta.modClass === 'mp-tremor' ? 'pac-alert-icon-tremor'
                  : alerta.modClass === 'mp-fog'    ? 'pac-alert-icon-fog'
                  : 'pac-alert-icon-brady'

  return (
    <div className="pac-alert-card">
      <div className={`pac-alert-icon ${iconClass}`}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 2a5 5 0 015 5v3l1.5 2H1.5L3 10V7a5 5 0 015-5z"/>
          <path d="M6.5 13.5a1.5 1.5 0 003 0"/>
        </svg>
      </div>
      <div className="pac-alert-body">
        <div className="pac-alert-title">{alerta.titulo}</div>
        {mod && (
          <div style={{ fontSize: 11, color: '#5B7FA6', marginTop: 2, marginBottom: 4, fontStyle: 'italic' }}>
            {mod.desc}
          </div>
        )}
        <div className="pac-alert-detail">{alerta.detalle}</div>
        <div className="pac-alert-meta-ext">
          <span className={`pac-mod-pill ${alerta.modClass}`}>{alerta.modulo}</span>
          <span className="pac-alert-ses">Sesión: {alerta.sesId}</span>
          <span className="pac-alert-ts">{alerta.ts}</span>
          <span className="alert-nivel nivel-consulta">Mencionar en consulta</span>
        </div>
      </div>
    </div>
  )
}

function modKey(modClass) {
  if (!modClass) return null
  if (modClass.includes('tremor')) return 'tremor'
  if (modClass.includes('fog'))    return 'fog'
  if (modClass.includes('brady'))  return 'brady'
  return null
}
