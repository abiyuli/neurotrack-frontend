import { useState, useEffect } from 'react'
import api from '../../api/client'

export default function PacienteDashboard() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

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

  return (
    <>

      {/* Tarjeta de perfil */}
      <div className="pac-profile-card">
        <div className="pac-avatar-lg">{initials}</div>
        <div className="pac-profile-info">
          <div className="pac-profile-name">{perfil.nombre}</div>
          <div className="pac-profile-id">Código paciente: {perfil.patientId}</div>
          <div className="pac-profile-tags">
            {perfil.diagnostico !== '—' && (
              <div className="pac-tag">
                <span>Diagnóstico</span>
                <span className="pac-tag-label">{perfil.diagnostico}</span>
              </div>
            )}
            {perfil.edad !== '—' && (
              <div className="pac-tag">
                <span>Edad</span>
                <span className="pac-tag-label">{perfil.edad} años</span>
              </div>
            )}
            {perfil.tiempoDiagnostico !== '—' && (
              <div className="pac-tag">
                <span>Tiempo diagnóstico</span>
                <span className="pac-tag-label">{perfil.tiempoDiagnostico}</span>
              </div>
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
            <div className="pac-kpi-val">{resumen.totalAlertas}</div>
            <div className="pac-kpi-label">Alertas en total</div>
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

      {/* Alertas recientes */}
      <div className="pac-section">
        <div className="pac-section-title">Alertas recientes</div>
        {recentAlertas.length === 0 ? (
          <div className="pac-empty">
            <div className="pac-empty-icon">✓</div>
            Sin alertas recientes registradas
          </div>
        ) : (
          recentAlertas.map((a, i) => (
            <AlertCard key={i} alerta={a} />
          ))
        )}
      </div>

    </>
  )
}

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
