import { useState, useEffect } from 'react'
import api from '../../api/client'

function AlertCard({ alerta }) {
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
        <div className="pac-alert-detail">{alerta.detalle}</div>
        <div className="pac-alert-meta">
          <span className={`pac-mod-pill ${alerta.modClass}`}>{alerta.modulo}</span>
          <span className="pac-alert-ses">Sesión: {alerta.sesId}</span>
          <span className="pac-alert-ts">{alerta.ts}</span>
        </div>
      </div>
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
      <div className="pac-alert-layout">

        {/* Lista principal */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div className="pac-section-title" style={{ margin: 0 }}>
              {alertas.length} alerta{alertas.length !== 1 ? 's' : ''} registrada{alertas.length !== 1 ? 's' : ''}
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
              Cargando alertas...
            </div>
          )}

          {!loading && visible.length === 0 && (
            <div className="pac-empty">
              <div className="pac-empty-icon">✓</div>
              {filtro ? 'Sin alertas para este módulo' : 'No hay alertas registradas'}
            </div>
          )}

          {!loading && visible.map((a, i) => <AlertCard key={i} alerta={a} />)}
        </div>

        {/* Panel lateral resumen */}
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
            <div style={{ background: '#FFFBF5', border: '0.5px solid #EFB97A', borderRadius: 12, padding: '14px 16px', marginTop: 12 }}>
              <div style={{ fontSize: 11, color: '#7A4F00', fontWeight: 600, marginBottom: 6 }}>¿Qué hacer?</div>
              <div style={{ fontSize: 11, color: '#5B3F00', lineHeight: 1.5 }}>
                Las alertas son registros automáticos del dispositivo. Si ves alertas frecuentes, compártelas con tu médico en tu próxima cita.
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
