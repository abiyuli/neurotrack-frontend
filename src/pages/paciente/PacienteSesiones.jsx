import { useState, useEffect } from 'react'
import api from '../../api/client'

function alertBadge(n) {
  if (!n) return <span className="pac-session-badge pac-badge-ok">Sin alertas</span>
  if (n === 1) return <span className="pac-session-badge pac-badge-warn">1 alerta</span>
  return <span className="pac-session-badge pac-badge-danger">{n} alertas</span>
}

function modClass(m) {
  if (m === 'Temblor')     return 'mp-tremor'
  if (m === 'FOG')         return 'mp-fog'
  if (m === 'Bradicinesia') return 'mp-brady'
  return ''
}

export default function PacienteSesiones() {
  const [sesiones, setSesiones] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    api.get('/paciente/sesiones')
      .then(({ data }) => setSesiones(data.sesiones || []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="pac-section-title">Historial de sesiones</div>

      {loading && (
        <div style={{ padding: 40, textAlign: 'center', color: '#7A8FA8', fontSize: 13 }}>
          Cargando sesiones...
        </div>
      )}

      {!loading && sesiones.length === 0 && (
        <div className="pac-empty">
          <div className="pac-empty-icon">📋</div>
          Aún no tienes sesiones registradas
        </div>
      )}

      {!loading && sesiones.length > 0 && (
        <div className="pac-table-outer">
          <table className="pac-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>ID sesión</th>
                <th>Módulos evaluados</th>
                <th>Duración</th>
                <th>Alertas</th>
              </tr>
            </thead>
            <tbody>
              {sesiones.map((s, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500, color: '#0B2545' }}>{s.fecha}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{s.sesId}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {s.modulos.map((m, j) => (
                        <span key={j} className={`pac-mod-pill ${modClass(m)}`}>{m}</span>
                      ))}
                    </div>
                  </td>
                  <td>{s.duration}</td>
                  <td>{alertBadge(s.alertas)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
