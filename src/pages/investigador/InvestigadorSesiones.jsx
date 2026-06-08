import { useState, useEffect, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import api from '../../api/client'

export default function InvestigadorSesiones() {
  const { setTitle } = useOutletContext()
  const [view,          setView]          = useState('sesiones')
  const [activeSession, setActiveSession] = useState(null)
  const [sessions,      setSessions]      = useState([])
  const [summary,       setSummary]       = useState({ total: 0, conAlerta: 0, sinAlerta: 0, byModulo: {} })
  const [metrics,       setMetrics]       = useState(null)
  const [metricsLoading, setMetricsLoading] = useState(false)
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [filterMod,     setFilterMod]     = useState('')
  const [filterAlert,   setFilterAlert]   = useState('')

  const topRef = useRef(null)

  useEffect(() => {
    setTitle(view === 'metricas' ? 'Métricas descriptivas' : 'Lista de sesiones')
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [view, setTitle])

  useEffect(() => {
    const params = {}
    if (filterMod)   params.modulo  = filterMod
    if (filterAlert) params.alertas = filterAlert
    setLoading(true)
    api.get('/investigador/sesiones', { params })
      .then(({ data }) => {
        setSessions(data.sessions || [])
        setSummary(data.summary  || { total: 0, conAlerta: 0, sinAlerta: 0, byModulo: {} })
      })
      .finally(() => setLoading(false))
  }, [filterMod, filterAlert])

  const openMetricas = (ses) => {
    setActiveSession(ses)
    setView('metricas')
    setMetrics(null)
    setMetricsLoading(true)
    api.get(`/investigador/sesiones/${ses.sesId}/metricas`)
      .then(({ data }) => setMetrics(data))
      .finally(() => setMetricsLoading(false))
  }

  const backToSesiones = () => { setActiveSession(null); setView('sesiones') }

  const filtered = sessions.filter(s => {
    return !search || s.patCode.toLowerCase().includes(search.toLowerCase()) || s.sesId.toLowerCase().includes(search.toLowerCase())
  })

  if (view === 'metricas') {
    const ses = activeSession
    const m   = metrics
    return (
      <div className="admin-panel">
        <div ref={topRef} />
        <div className="anon-banner anon-banner-i">
          <div className="anon-dot" />
          Datos anonimizados — {ses?.patCode} · {ses?.sesId} · Solo lectura.
        </div>
        <div className="breadcrumb">
          <button className="bc-link bc-link-i" onClick={backToSesiones}>Sesiones</button>
          <span className="bc-sep">/</span>
          <span className="bc-cur" aria-current="page">{ses?.patCode} · {ses?.sesId}</span>
        </div>

        {metricsLoading && (
          <div className="state-loading"><div className="spinner" /><span>Cargando métricas...</span></div>
        )}

        {!metricsLoading && m && (
          <div className="content-wrap" style={{ overflowY: 'auto' }}>
            <div className="content-main" style={{ overflow: 'visible', gap: 10 }}>
              <div className="stat-grid">
                <div className="stat-card"><div className="stat-label">Eventos totales</div><div className="stat-val">{m.events}</div><div className="stat-sub">sesión completa</div></div>
                <div className="stat-card"><div className="stat-label">Alertas activadas</div><div className="stat-val" style={{color:'#A32D2D'}}>{m.alerts}</div><div className="stat-sub">en esta sesión</div></div>
                <div className="stat-card"><div className="stat-label">Duración</div><div className="stat-val">{m.duration}</div><div className="stat-sub">minutos</div></div>
                <div className="stat-card"><div className="stat-label">Timestamp</div><div className="stat-val" style={{fontSize:13}}>Relativo</div><div className="stat-sub">anonimizado</div></div>
              </div>

              {m.hasTremor && (
                <div className="metric-block">
                  <div className="metric-block-title">Temblor — estadísticas de sesión</div>
                  <div className="metric-row-inv"><span className="metric-key">Freq. media (Hz)</span><span className="metric-num">{m.tremor.freqMedia}</span></div>
                  <div className="metric-row-inv"><span className="metric-key">Freq. máx (Hz)</span><span className="metric-num">{m.tremor.freqMax}</span></div>
                  <div className="metric-row-inv"><span className="metric-key">Amplitud media</span><span className="metric-num">{m.tremor.ampMedia}</span></div>
                  <div className="metric-row-inv"><span className="metric-key">Amplitud máx</span><span className="metric-num">{m.tremor.ampMax}</span></div>
                  <div className="metric-row-inv"><span className="metric-key">Eventos en rango Parkinson</span><span className="metric-num">{m.tremor.parkinson}</span></div>
                </div>
              )}

              {m.hasFog && (
                <div className="metric-block">
                  <div className="metric-block-title">FOG — estadísticas de sesión</div>
                  <div className="metric-row-inv"><span className="metric-key">FOG prob. media</span><span className="metric-num">{m.fog.probMedia}</span></div>
                  <div className="metric-row-inv"><span className="metric-key">FOG prob. máx</span><span className="metric-num">{m.fog.probMax}</span></div>
                  <div className="metric-row-inv"><span className="metric-key">Episodios freeze</span><span className="metric-num">{m.fog.freezeEps}</span></div>
                  <div className="metric-row-inv"><span className="metric-key">Freeze index medio</span><span className="metric-num">{m.fog.freezeIdx}</span></div>
                </div>
              )}

              {m.hasBrady && (
                <div className="metric-block">
                  <div className="metric-block-title">Bradicinesia — estadísticas de sesión</div>
                  <div className="metric-row-inv"><span className="metric-key">Tap count medio</span><span className="metric-num">{m.brady.tapMedio}</span></div>
                  <div className="metric-row-inv"><span className="metric-key">Amplitud media</span><span className="metric-num">{m.brady.ampMedia}</span></div>
                  <div className="metric-row-inv"><span className="metric-key">Intentos bradykinesia</span><span className="metric-num">{m.brady.bradyCount}</span></div>
                  <div className="metric-row-inv"><span className="metric-key">Regularidad media</span><span className="metric-num">{m.brady.regularidad}</span></div>
                </div>
              )}
            </div>

            <div className="content-side">
              <div className="side-card">
                <div className="side-title">Distribución alertas</div>
                <div className="m-row"><span className="m-label">Temblor</span><span className="m-val" style={{fontSize:13}}>{m.alertDist?.tremor ?? 0}</span></div>
                <div className="m-row"><span className="m-label">FOG</span><span className="m-val" style={{fontSize:13}}>{m.alertDist?.fog ?? 0}</span></div>
                <div className="m-row"><span className="m-label">Bradicinesia</span><span className="m-val" style={{fontSize:13}}>{m.alertDist?.brady ?? 0}</span></div>
              </div>
              <div className="side-card">
                <div className="side-title">Estado clínico</div>
                {m.hasFog && (
                  <>
                    <div style={{fontSize:11,color:'#5B7FA6',marginBottom:6}}>FOG class predominante</div>
                    <div style={{fontSize:12,fontWeight:500,color:'#0B2545',marginBottom:10}}>{m.fogClass}</div>
                  </>
                )}
                {m.hasBrady && (
                  <>
                    <div style={{fontSize:11,color:'#5B7FA6',marginBottom:6}}>Brady. predominante</div>
                    <div style={{fontSize:12,fontWeight:500,color: m.bradyClass === 'Normal' ? '#0B2545' : '#A32D2D'}}>{m.bradyClass}</div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="admin-panel">
      <div ref={topRef} />
      <div className="anon-banner anon-banner-i">
        <div className="anon-dot" />
        Datos anonimizados — sin nombre, DNI ni timestamps exactos. Solo lectura.
      </div>
      <div className="content-wrap">
        <div className="content-main">
          <div className="toolbar">
            <div className="search-wrap">
              <svg className="search-icon" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#7A8FA8" strokeWidth="1.5">
                <circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l2.5 2.5"/>
              </svg>
              <input
                className="search-input"
                type="text"
                placeholder="Buscar por código PAT o sesión..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="filter-select" value={filterMod} onChange={e => setFilterMod(e.target.value)}>
              <option value="">Todos los módulos</option>
              <option value="tremor">Temblor</option>
              <option value="fog">FOG</option>
              <option value="bradykinesia">Bradicinesia</option>
            </select>
            <select className="filter-select" value={filterAlert} onChange={e => setFilterAlert(e.target.value)}>
              <option value="">Con y sin alertas</option>
              <option value="alerta">Con alertas</option>
              <option value="sin">Sin alertas</option>
            </select>
          </div>

          {loading && <div className="state-loading"><div className="spinner" /><span>Cargando sesiones...</span></div>}

          {!loading && (
            <div className="table-outer">
              <table className="admin-table" style={{ minWidth: 580 }}>
                <thead>
                  <tr>
                    <th>Código paciente</th><th>ID sesión</th><th>Fecha relativa</th>
                    <th>Módulos</th><th>Duración</th><th>Alertas</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0
                    ? <tr><td colSpan="7" className="state-empty" role="status">Sin sesiones que coincidan.</td></tr>
                    : filtered.map((s, i) => (
                      <tr key={i} className="clickable" onClick={() => openMetricas(s)}>
                        <td><div className="pat-anon">{s.patCode}</div></td>
                        <td><div className="ses-id">{s.sesId}</div></td>
                        <td>{s.time}</td>
                        <td>
                          <div className="mod-pills">
                            {s.mods.map(([label, cls], j) => (
                              <span key={j} className={`mod-pill ${cls}`}>{label}</span>
                            ))}
                          </div>
                        </td>
                        <td>{s.duration}</td>
                        <td><span className={`alert-chip ${s.alertClass}`}>{s.alertLabel}</span></td>
                        <td>
                          <button className="btn-ver-i" onClick={e => { e.stopPropagation(); openMetricas(s) }}>
                            Ver métricas
                          </button>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="content-side">
          <div className="side-card">
            <div className="side-title">Resumen</div>
            <div className="m-row"><span className="m-label">Total sesiones</span><span className="m-val">{summary.total}</span></div>
            <div className="m-div" />
            <div className="m-row"><span className="m-label">Con alertas</span><span className="m-val" style={{color:'#A32D2D',fontSize:14}}>{summary.conAlerta}</span></div>
            <div className="m-div" />
            <div className="m-row"><span className="m-label">Sin alertas</span><span className="m-val" style={{fontSize:14}}>{summary.sinAlerta}</span></div>
          </div>
          <div className="side-card">
            <div className="side-title">Por módulo</div>
            {Object.entries(summary.byModulo || {}).map(([mod, count]) => (
              <div key={mod} className="m-row">
                <span className="m-label">{mod}</span>
                <span className="m-val" style={{fontSize:14}}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
