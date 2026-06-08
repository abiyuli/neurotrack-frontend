import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import api from '../../api/client'

export default function CuidadorAlertas() {
  const { setTitle } = useOutletContext()
  const [alerts,  setAlerts]  = useState([])
  const [summary, setSummary] = useState({ total: 0, last24h: 0, last7d: 0, byPatient: {} })

  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

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

  return (
    <div className="admin-panel">
      <div className="anon-banner anon-banner-c">
        <div className="anon-dot" />
        Feed de alertas en tiempo real — solo lectura. Ordenadas por recencia.
      </div>
      <div className="content-wrap">
        <div className="content-main" style={{ gap: 12 }}>
          {loading && <div style={{ padding: 30, textAlign: 'center', color: '#7A8FA8', fontSize: 13 }}>Cargando alertas...</div>}
          {error   && <div style={{ padding: 20, color: '#A32D2D', fontSize: 13 }}>{error}</div>}

          {!loading && !error && (
            <div className="feed-outer">
              {alerts.length === 0 && (
                <div style={{ padding: 30, textAlign: 'center', color: '#7A8FA8', fontSize: 13 }}>Sin alertas recientes.</div>
              )}
              {alerts.map((a, i) => (
                <div key={i} className={`feed-item ${a.level}`}>
                  <div className="feed-top">
                    <span className={`feed-type ${a.typeClass}`}>{a.type}</span>
                    <span className="feed-time">{a.time}</span>
                  </div>
                  <div className="feed-pat">{a.patient_id}</div>
                  <div className="feed-detail">{a.detail}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="content-side">
          <div className="side-card">
            <div className="side-title">Resumen</div>
            <div className="m-row"><span className="m-label">Total alertas</span><span className="m-val">{summary.total}</span></div>
            <div className="m-div" />
            <div className="m-row"><span className="m-label">Últimas 24h</span><span className="m-val" style={{ fontSize: 14, color: '#A32D2D' }}>{summary.last24h}</span></div>
            <div className="m-div" />
            <div className="m-row"><span className="m-label">Últimos 7d</span><span className="m-val" style={{ fontSize: 14 }}>{summary.last7d}</span></div>
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
        </div>
      </div>
    </div>
  )
}
