import { useState, useEffect } from 'react'
import api from '../../api/client'

const MOD_INFO = {
  'mp-tremor': {
    name: 'Temblor',
    desc: 'El dispositivo registró movimientos involuntarios repetitivos en las extremidades durante esta sesión.',
    nota: 'Puede variar según la hora del día, el nivel de estrés y el estado de la medicación.',
  },
  'mp-fog': {
    name: 'FOG — Bloqueo de marcha',
    desc: 'El dispositivo detectó episodios en los que el movimiento al caminar se detuvo brevemente de forma involuntaria.',
    nota: 'Los ambientes estrechos, el estrés y el cansancio pueden influir en su frecuencia.',
  },
  'mp-brady': {
    name: 'Bradicinesia',
    desc: 'El dispositivo detectó lentitud al iniciar o ejecutar movimientos durante esta sesión.',
    nota: 'Suele ser más notable al despertar o cuando el efecto de la medicación empieza a disminuir.',
  },
}

function AlertCard({ alerta }) {
  const [expanded, setExpanded] = useState(false)
  const mod = MOD_INFO[alerta.modClass] || null
  const iconClass = alerta.modClass === 'mp-tremor' ? 'pac-alert-icon-tremor'
                  : alerta.modClass === 'mp-fog'    ? 'pac-alert-icon-fog'
                  : 'pac-alert-icon-brady'

  return (
    <div className="pac-alert-card" style={{ flexDirection: 'column', gap: 0 }}>
      {/* Fila principal */}
      <div style={{ display: 'flex', gap: 12 }}>
        <div className={`pac-alert-icon ${iconClass}`} style={{ flexShrink: 0, marginTop: 2 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 2a5 5 0 015 5v3l1.5 2H1.5L3 10V7a5 5 0 015-5z"/>
            <path d="M6.5 13.5a1.5 1.5 0 003 0"/>
          </svg>
        </div>
        <div className="pac-alert-body" style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div className="pac-alert-title">{alerta.titulo}</div>
            <span className="obs-nivel">Mencionar en consulta</span>
          </div>
          <div className="pac-alert-detail">{alerta.detalle}</div>
          <div className="pac-alert-meta" style={{ marginTop: 6 }}>
            <span className={`pac-mod-pill ${alerta.modClass}`}>{alerta.modulo}</span>
            <span className="pac-alert-ses">Sesión: {alerta.sesId}</span>
            <span className="pac-alert-ts">{alerta.ts}</span>
          </div>
        </div>
      </div>

      {/* ¿Qué significa? expandible */}
      {mod && (
        <>
          <button
            className="obs-expand-btn"
            onClick={() => setExpanded(o => !o)}
            aria-expanded={expanded}
          >
            {expanded ? '▲ Ocultar explicación' : '▼ ¿Qué registró el dispositivo?'}
          </button>
          {expanded && (
            <div className="obs-expand-body">
              <div className="obs-exp-desc">{mod.desc}</div>
              <div className="obs-exp-nota">ⓘ {mod.nota}</div>
              <div className="obs-exp-disclaimer">
                Esta información es orientativa. El análisis clínico corresponde a tu médico tratante.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function PacienteAlertas() {
  const [alertas,  setAlertas]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filtro,   setFiltro]   = useState('')

  useEffect(() => {
    api.get('/paciente/alertas')
      .then(({ data }) => setAlertas(data.alertas || []))
      .finally(() => setLoading(false))
  }, [])

  const visible = filtro
    ? alertas.filter(a => a.modClass === `mp-${filtro}`)
    : alertas

  const countByMod = alertas.reduce((acc, a) => {
    const k = a.modulo
    acc[k] = (acc[k] || 0) + 1
    return acc
  }, {})

  return (
    <>
      <style>{`
        .obs-nivel{display:inline-flex;align-items:center;padding:2px 9px;border-radius:999px;font-size:10px;font-weight:600;background:#ECFDF5;color:#065F46;white-space:nowrap;flex-shrink:0;}
        .obs-expand-btn{margin-top:10px;padding:5px 0 0;background:none;border:none;border-top:1px solid #EDE8E1;font-size:11px;color:#5B7FA6;cursor:pointer;font-family:inherit;text-align:left;width:100%;transition:color .15s;}
        .obs-expand-btn:hover{color:#1D5FA8;}
        .obs-expand-body{margin-top:8px;padding:10px 12px;background:#F0F6FF;border:1px solid #B8D4F5;border-radius:8px;}
        .obs-exp-desc{font-size:12px;color:#1A3A60;line-height:1.6;margin-bottom:5px;}
        .obs-exp-nota{font-size:11px;color:#5B7FA6;font-style:italic;margin-bottom:5px;}
        .obs-exp-disclaimer{font-size:10px;color:#7A8FA8;border-top:1px solid #C8DCEF;padding-top:5px;margin-top:4px;}
        .obs-que-hacer{background:#FFFBF5;border:1px solid #EFB97A;border-radius:10px;padding:14px 16px;margin-top:12px;}
        .obs-qh-title{font-size:11px;font-weight:700;color:#7A4F00;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:8px;}
        .obs-qh-item{display:flex;gap:8px;margin-bottom:6px;align-items:flex-start;}
        .obs-qh-item:last-child{margin-bottom:0;}
        .obs-qh-dot{width:6px;height:6px;border-radius:50%;background:#D97706;flex-shrink:0;margin-top:5px;}
        .obs-qh-text{font-size:12px;color:#5B3F00;line-height:1.5;}
      `}</style>

      <div className="pac-alert-layout">

        {/* Lista principal */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div className="pac-section-title" style={{ margin: 0 }}>
              {alertas.length} observación{alertas.length !== 1 ? 'es' : ''} registrada{alertas.length !== 1 ? 's' : ''}
            </div>
            <select
              style={{ marginLeft: 'auto', padding: '5px 10px', borderRadius: 7, border: '0.5px solid #DDD5C8', fontSize: 12, color: '#3A5270', background: '#fff', fontFamily: 'inherit' }}
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
            >
              <option value="">Todos los módulos</option>
              <option value="tremor">Temblor</option>
              <option value="fog">FOG</option>
              <option value="brady">Bradicinesia</option>
            </select>
          </div>

          {loading && (
            <div style={{ padding: 40, textAlign: 'center', color: '#7A8FA8', fontSize: 13 }}>
              Cargando observaciones...
            </div>
          )}

          {!loading && visible.length === 0 && (
            <div className="pac-empty">
              <div className="pac-empty-icon">✓</div>
              {filtro ? 'Sin observaciones para este módulo' : 'No hay observaciones registradas'}
            </div>
          )}

          {!loading && visible.map((a, i) => <AlertCard key={i} alerta={a} />)}

          {!loading && alertas.length > 0 && (
            <div className="obs-que-hacer">
              <div className="obs-qh-title">¿Qué hago con estas observaciones?</div>
              <div className="obs-qh-item">
                <div className="obs-qh-dot" />
                <div className="obs-qh-text"><strong>Compártelas con tu médico</strong> en tu próxima consulta. Son el insumo principal para el análisis clínico.</div>
              </div>
              <div className="obs-qh-item">
                <div className="obs-qh-dot" />
                <div className="obs-qh-text">Si notas que los episodios aumentan con el tiempo, <strong>comunícalo antes de tu próxima cita programada</strong>.</div>
              </div>
              <div className="obs-qh-item">
                <div className="obs-qh-dot" />
                <div className="obs-qh-text">Las variaciones día a día son normales. El médico evalúa <strong>tendencias</strong>, no eventos aislados.</div>
              </div>
            </div>
          )}
        </div>

        {/* Panel lateral */}
        {!loading && alertas.length > 0 && (
          <div className="pac-alert-side">
            <div style={{ background: '#fff', border: '0.5px solid #DDD5C8', borderRadius: 12, padding: '16px 18px' }}>
              <div className="pac-section-title" style={{ marginBottom: 12 }}>Por módulo</div>
              {Object.entries(countByMod).map(([mod, count]) => (
                <div key={mod} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#3A5270' }}>{mod}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#0B2545' }}>{count}</span>
                </div>
              ))}
              <div style={{ borderTop: '0.5px solid #F0EDE8', marginTop: 8, paddingTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: '#5B7FA6', fontWeight: 500 }}>Total</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0B2545' }}>{alertas.length}</span>
                </div>
              </div>
            </div>

            <div style={{ background: '#F0F6FF', border: '1px solid #B8D4F5', borderRadius: 12, padding: '14px 16px', marginTop: 12 }}>
              <div style={{ fontSize: 11, color: '#0B2545', fontWeight: 700, marginBottom: 6 }}>Sobre este registro</div>
              <div style={{ fontSize: 11, color: '#1A3A60', lineHeight: 1.6 }}>
                Las observaciones son registros automáticos del sensor. <strong>No son diagnósticos.</strong> Tu médico es quien interpreta estos datos en el contexto de tu historial y tratamiento.
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
