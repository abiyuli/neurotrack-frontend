import { useState, useEffect } from 'react'
import api from '../../api/client'

export default function AdminUsuarios() {
  const [users,       setUsers]       = useState([])
  const [summary,     setSummary]     = useState({ active: 0, pending: 0, inactive: 0, byRole: {} })
  const [search,      setSearch]      = useState('')
  const [filterRole,  setFilterRole]  = useState('')
  const [showPending, setShowPending] = useState(false)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState('')
  const [actionError, setActionError] = useState('')
  const [actionMsg,   setActionMsg]   = useState('')

  function load() {
    setLoading(true)
    api.get('/admin/usuarios')
      .then(({ data }) => { setUsers(data.users || []); setSummary(data.summary || {}) })
      .catch(() => setError('No se pudieron cargar los usuarios'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function updateEstado(email, estado) {
    setActionError('')
    setActionMsg('')
    try {
      await api.put(`/admin/usuarios/${encodeURIComponent(email)}/estado`, { estado })
      const labels = { Activo: 'activado', Inactivo: 'desactivado', Rechazado: 'rechazado' }
      setActionMsg(`Usuario ${labels[estado] || 'actualizado'} correctamente.`)
      setTimeout(() => setActionMsg(''), 4000)
      load()
    } catch {
      setActionError('Error al actualizar el estado')
    }
  }

  const filtered = users.filter(u => {
    if (showPending && u.status !== 'pending') return false
    if (filterRole  && u.role !== filterRole)  return false
    if (!search) return true
    const q = search.toLowerCase()
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.dni.includes(q) || u.roleLabel.toLowerCase().includes(q)
  })

  const handleSearch  = (val) => { setSearch(val); setShowPending(false) }
  const handlePending = ()    => { setShowPending(true); setSearch('') }

  return (
    <div className="admin-panel">
      <div className="content-wrap">
        <div className="content-main">

          {summary.pending > 0 && (
            <div className="pending-banner">
              <div className="pending-left">
                <div className="pending-dot" />
                <div className="pending-text">
                  <strong>{summary.pending} cuenta{summary.pending > 1 ? 's' : ''} pendiente{summary.pending > 1 ? 's' : ''}</strong> de aprobación — médicos e investigadores en espera
                </div>
              </div>
              <span className="pending-link" onClick={handlePending}>Ver pendientes →</span>
            </div>
          )}

          <div className="search-row">
            <div className="search-wrap">
              <svg className="search-icon" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#7A8FA8" strokeWidth="1.5">
                <circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l2.5 2.5"/>
              </svg>
              <input className="search-input" type="text" placeholder="Buscar por nombre, DNI o correo..."
                value={showPending ? '' : search} onChange={e => handleSearch(e.target.value)} />
            </div>
            <select
              className="filter-select"
              value={filterRole}
              onChange={e => { setFilterRole(e.target.value); setShowPending(false) }}
            >
              <option value="">Todos los roles</option>
              <option value="medico">Médico</option>
              <option value="investigador">Investigador</option>
              <option value="cuidador">Cuidador</option>
              <option value="paciente">Paciente</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          {loading && <div className="state-loading"><div className="spinner" /><span>Cargando usuarios...</span></div>}
          {error   && <div className="state-error">{error}</div>}
          {actionError && <div className="action-error">{actionError}</div>}
          {actionMsg   && <div className="action-success">{actionMsg}</div>}

          {!loading && !error && (
            <div className="table-outer">
              <table className="admin-table" style={{ minWidth: 780 }}>
                <thead>
                  <tr>
                    <th>Usuario</th><th>DNI</th><th>Teléfono</th>
                    <th>Rol</th><th>Estado</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && <tr><td colSpan="6" className="state-empty" role="status">Sin usuarios que coincidan.</td></tr>}
                {filtered.map((u, i) => (
                    <tr key={i}>
                      <td>
                        <div className="user-name">{u.name}</div>
                        <div className="user-email">{u.email}</div>
                      </td>
                      <td className="td-text">{u.dni}</td>
                      <td className="td-text">{u.tel}</td>
                      <td><span className={`role-badge ${u.roleClass}`}>{u.roleLabel}</span></td>
                      <td>
                        <span className="status-dot">
                          <span className={`adot adot-${u.status}`} />
                          {u.statusLabel}
                        </span>
                      </td>
                      <td>
                        <div className="actions">
                          {u.status === 'pending' && <>
                            <button className="btn btn-sm btn-success" onClick={() => updateEstado(u.email, 'Activo')}>Aprobar</button>
                            <button className="btn btn-sm btn-danger"  onClick={() => updateEstado(u.email, 'Rechazado')}>Rechazar</button>
                          </>}
                          {u.status === 'inactive' && <>
                            <button className="btn btn-sm btn-success" onClick={() => updateEstado(u.email, 'Activo')}>Activar</button>
                          </>}
                          {u.status === 'active' && <>
                            <button className="btn btn-sm btn-danger" onClick={() => updateEstado(u.email, 'Inactivo')}>Desactivar</button>
                          </>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="content-side">
          <div className="side-card">
            <div className="side-title">Resumen del sistema</div>
            <div className="m-row"><span className="m-label">Activos</span><span className="m-val">{summary.active ?? '—'}</span></div>
            <div className="m-div" />
            <div className="m-row"><span className="m-label">Pendientes</span><span className="m-val v-warn">{summary.pending ?? '—'}</span></div>
            <div className="m-div" />
            <div className="m-row"><span className="m-label">Inactivos</span><span className="m-val v-danger">{summary.inactive ?? '—'}</span></div>
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
