import { useState, useEffect } from 'react'
import api from '../../api/client'

const STATUS_LABEL = { online: 'Online', offline: 'Offline', error: 'Error' }

export default function AdminDispositivos() {
  const [devices,      setDevices]      = useState([])
  const [summary,      setSummary]      = useState({ online: 0, offline: 0, error: 0, total: 0 })
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')

  useEffect(() => {
    api.get('/admin/dispositivos')
      .then(({ data }) => { setDevices(data.devices || []); setSummary(data.summary || {}) })
      .catch(() => setError('No se pudieron cargar los dispositivos'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = devices.filter(d => {
    const matchSearch = !search || `${d.id} ${d.modulo} ${d.status} ${d.patient}`.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || d.status === statusFilter
    return matchSearch && matchStatus
  })

  const errorDevices = devices.filter(d => d.status === 'error')

  return (
    <div className="admin-panel">
      <div className="content-wrap">
        <div className="content-main">

          {errorDevices.length > 0 && (
            <div className="alert-banner">
              <div className="alert-dot" />
              <div className="alert-text">
                <strong>{errorDevices.length} dispositivo{errorDevices.length > 1 ? 's' : ''} con error</strong> — sin transmisión prolongada
              </div>
            </div>
          )}

          <div className="search-row">
            <div className="search-wrap">
              <svg className="search-icon" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#7A8FA8" strokeWidth="1.5">
                <circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l2.5 2.5"/>
              </svg>
              <input className="search-input" type="text" placeholder="Buscar por ID o módulo..."
                value={search} onChange={e => { setSearch(e.target.value); setStatusFilter('') }} />
            </div>
            <select className="filter-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setSearch('') }}>
              <option value="">Todos los estados</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="error">Error</option>
            </select>
          </div>

          {loading && <div style={{ padding: 30, textAlign: 'center', color: '#7A8FA8', fontSize: 13 }}>Cargando dispositivos...</div>}
          {error   && <div style={{ padding: 20, color: '#A32D2D', fontSize: 13 }}>{error}</div>}

          {!loading && !error && (
            <div className="table-outer">
              <table className="admin-table" style={{ minWidth: 860 }}>
                <thead>
                  <tr>
                    <th>Dispositivo</th><th>Tipo</th><th>Módulo</th>
                    <th>Paciente asignado</th><th>Conexión</th><th>Última transmisión</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((d, i) => (
                    <tr key={i}>
                      <td>
                        <div className="dev-id">{d.id}</div>
                        <div className="dev-serial">SN: {d.serial}</div>
                      </td>
                      <td className="td-text">{d.type}</td>
                      <td><span className={`mod-badge ${d.modClass}`}>{d.modulo}</span></td>
                      <td className="td-text">{d.patient}</td>
                      <td>
                        <span className="conn-badge">
                          <span className={`adot adot-${d.status}`} />
                          {STATUS_LABEL[d.status]}
                        </span>
                      </td>
                      <td className={`last-tx${d.txError ? ' tx-error' : ''}`}>{d.lastTx}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="content-side">
          <div className="side-card">
            <div className="side-title">Estado general</div>
            <div className="m-row"><span className="m-label">Online</span><span className="m-val v-ok">{summary.online}</span></div>
            <div className="m-div" />
            <div className="m-row"><span className="m-label">Offline</span><span className="m-val v-warn">{summary.offline}</span></div>
            <div className="m-div" />
            <div className="m-row"><span className="m-label">Con error</span><span className="m-val v-danger">{summary.error}</span></div>
            <div className="m-div" />
            <div className="m-row"><span className="m-label">Total</span><span className="m-val">{summary.total}</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}
