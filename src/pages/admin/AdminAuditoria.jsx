import { useState, useEffect } from 'react'
import api from '../../api/client'

export default function AdminAuditoria() {
  const [logs,       setLogs]       = useState([])
  const [summary,    setSummary]    = useState({ total: 0, byOp: {}, byRole: {} })
  const [search,     setSearch]     = useState('')
  const [filterOp,   setFilterOp]   = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    api.get('/admin/auditoria')
      .then(({ data }) => { setLogs(data.logs || []); setSummary(data.summary || {}) })
      .finally(() => setLoading(false))
  }, [])

  const clearFilters = () => { setSearch(''); setFilterOp(''); setFilterRole('') }

  const filtered = logs.filter(r => {
    const matchSearch = !search || r.user.toLowerCase().includes(search.toLowerCase()) || r.resource.toLowerCase().includes(search.toLowerCase())
    const matchOp     = !filterOp   || r.op === filterOp
    const matchRole   = !filterRole || r.dataRole === filterRole
    return matchSearch && matchOp && matchRole
  })

  return (
    <div className="admin-panel">
      <div className="content-wrap">
        <div className="content-main">
          <div className="filter-bar">
            <div className="search-wrap">
              <svg className="search-icon" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#7A8FA8" strokeWidth="1.5">
                <circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l2.5 2.5"/>
              </svg>
              <input className="search-input" style={{ paddingLeft: 30 }} type="text"
                placeholder="Buscar usuario o recurso..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="filter-select" value={filterOp} onChange={e => setFilterOp(e.target.value)}>
              <option value="">Todas las operaciones</option>
              <option value="login">Login</option>
              <option value="create">Crear</option>
              <option value="update">Actualizar</option>
              <option value="delete">Eliminar</option>
              <option value="export">Exportar</option>
            </select>
            <select className="filter-select" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
              <option value="">Todos los roles</option>
              <option value="admin">Administrador</option>
              <option value="medico">Médico</option>
              <option value="investigador">Investigador</option>
              <option value="cuidador">Cuidador</option>
            </select>
            <button className="btn btn-secondary" onClick={clearFilters}>Limpiar filtros</button>
          </div>

          {loading && <div className="state-loading"><div className="spinner" /><span>Cargando auditoría...</span></div>}

          {!loading && (
            <div className="table-outer">
              <table className="admin-table" style={{ minWidth: 700 }}>
                <thead>
                  <tr>
                    <th>Fecha y hora</th><th>Usuario</th><th>Operación</th>
                    <th>Recurso</th><th>Detalle</th><th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0
                    ? <tr><td colSpan="6" className="state-empty" role="status">Sin registros que coincidan.</td></tr>
                    : filtered.map((r, i) => (
                      <tr key={i}>
                        <td className="ts">{r.ts}</td>
                        <td>
                          <div className="user-cell">{r.user}</div>
                          <div className="user-role">{r.role}</div>
                        </td>
                        <td><span className={`op-badge ${r.opClass}`}>{r.opLabel}</span></td>
                        <td className="resource-text">{r.resource}</td>
                        <td className="detail-text" title={r.detail}>{r.detail}</td>
                        <td className="ip-text">{r.ip}</td>
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
            <div className="side-title">Actividad (7d)</div>
            <div className="m-row"><span className="m-label">Total operaciones</span><span className="m-val">{summary.total}</span></div>
          </div>
          <div className="side-card">
            <div className="side-title">Por operación</div>
            {Object.entries(summary.byOp || {}).map(([op, count]) => (
              <div key={op} className="m-row">
                <span className="m-label">{op}</span>
                <span className="m-val" style={{ fontSize: 14 }}>{count}</span>
              </div>
            ))}
          </div>
          <div className="side-card">
            <div className="side-title">Por rol</div>
            {Object.entries(summary.byRole || {}).map(([rol, count]) => (
              <div key={rol} className="m-row">
                <span className="m-label">{rol}</span>
                <span className="m-val" style={{ fontSize: 14 }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
