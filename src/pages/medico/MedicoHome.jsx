import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useEscLogout } from '../../hooks/useEscLogout'
import AvatarMenu from '../../components/AvatarMenu'
import api from '../../api/client'
import '../../styles/shell.css'

export default function MedicoHome() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  useEscLogout()
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [alertFilter, setAlertFilter] = useState('')

  function cargarPacientes() {
    setLoading(true)
    api.get('/patients')
      .then(({ data }) => setPatients(data.patients || data))
      .catch(() => setError('No se pudo cargar la lista de pacientes'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargarPacientes() }, [])

  const filtered = patients.filter(p => {
    const matchSearch = search === '' ||
      (p.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.patient_id || '').toLowerCase().includes(search.toLowerCase())
    const matchAlert = alertFilter === '' ||
      (alertFilter === 'alerta' && p.alert_count > 0) ||
      (alertFilter === 'sin' && !p.alert_count)
    return matchSearch && matchAlert
  })

  const initials = (nombre) => {
    if (!nombre) return '?'
    const p = nombre.trim().split(' ')
    return p.length >= 2 ? p[0][0] + p[1][0] : nombre.substring(0, 2)
  }

  const alertChip = (count) => {
    if (!count || count === 0)
      return <span className="alert-chip ac-ok">Sin alertas</span>
    if (count === 1)
      return <span className="alert-chip ac-warn">1 alerta</span>
    return <span className="alert-chip ac-danger">{count} alertas</span>
  }

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-size:14px;color:var(--c-navy);background:var(--c-bg-shell);}
.avatar{width:34px;height:34px;border-radius:50%;background:var(--c-blue);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;color:#fff;}
        .content{display:flex;gap:16px;padding:20px 24px;flex:1;overflow:hidden;}
        .content-main{flex:1;min-width:0;display:flex;flex-direction:column;overflow:hidden;}
        .content-side{width:200px;flex-shrink:0;overflow-y:auto;display:flex;flex-direction:column;gap:12px;}
        .stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;flex-shrink:0;}
        .stat-card{background:#fff;border:1px solid var(--c-border);border-radius:12px;padding:12px 16px;}
        .stat-label{font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:var(--c-text-sec);margin-bottom:4px;}
        .stat-val{font-size:24px;font-weight:600;color:var(--c-navy);}
        .stat-val.v-danger{color:var(--c-danger-text);}
        .toolbar{display:flex;gap:8px;margin-bottom:14px;flex-shrink:0;align-items:center;}
        .search-wrap{flex:1;position:relative;}
        .search-icon{position:absolute;left:10px;top:50%;transform:translateY(-50%);}
        .search-input{width:100%;padding:8px 12px 8px 32px;font-size:13px;border:1px solid var(--c-border-input);border-radius:8px;background:#fff;color:var(--c-navy);outline:none;font-family:inherit;}
        .search-input:focus{border-color:var(--c-blue);}
        .filter-select{padding:8px 12px;font-size:13px;border:1px solid var(--c-border-input);border-radius:8px;background:#fff;color:var(--c-navy);outline:none;font-family:inherit;cursor:pointer;}
        .table-outer{flex:1;overflow:auto;border:1px solid var(--c-border);border-radius:10px;background:#fff;}
        table{width:100%;border-collapse:collapse;}
        thead tr{background:var(--c-blue-100);position:sticky;top:0;z-index:1;}
        th{font-size:var(--t-table-h);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--c-text-sec);padding:8px 16px;text-align:left;border-bottom:1px solid var(--c-border);white-space:nowrap;}
        td{padding:8px 16px;border-bottom:1px solid var(--c-border-sub);font-size:13px;color:#2A4268;white-space:nowrap;vertical-align:middle;}
        tr:last-child td{border-bottom:none;}
        tr:hover td{background:var(--c-row-hover);cursor:pointer;}
        .pat-name{font-size:13px;font-weight:600;color:var(--c-navy);}
        .pat-code{font-size:11px;color:var(--c-text-muted);margin-top:2px;}
        .alert-chip{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:500;}
        .ac-danger{background:var(--c-danger-bg);color:var(--c-danger-text);}
        .ac-warn{background:var(--c-warn-bg);color:var(--c-warn-text);}
        .ac-ok{background:#F1EFE8;color:#5F5E5A;}
.side-card{background:#fff;border:1px solid var(--c-border);border-radius:12px;padding:16px;}
        .side-title{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:var(--c-text-sec);margin-bottom:12px;}
        .m-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;}
        .m-label{font-size:12px;color:var(--c-text-muted);}
        .m-val{font-size:16px;font-weight:600;color:var(--c-navy);}
        .m-div{height:1px;background:var(--c-border-sub);margin:8px 0;}
        .empty-state{padding:40px;text-align:center;color:var(--c-text-muted);font-size:13px;}
        .error-state{padding:40px;text-align:center;color:var(--c-danger-text);font-size:13px;}
        @media(max-width:1024px){
          .content-side{display:none;}
        }
        @media(max-width:600px){
          .content{padding:12px 14px;gap:0;flex-direction:column;}
          .stat-row{grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;}
          .stat-val{font-size:20px;}
          .toolbar{flex-wrap:wrap;}
          .toolbar .btn{width:100%;}
          .search-wrap{min-width:0;}
        }
      `}</style>

      <div className="shell">
        <div className="sidebar">
          <div className="sidebar-brand">
            <div className="sidebar-brand-name">NeuroTrack</div>
            <div className="sidebar-brand-sub">Monitoreo de síntomas · Parkinson</div>
          </div>
          <div className="sidebar-nav">
            <div className="nav-item active">
              <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="8" cy="5" r="3"/><path d="M2 14c0-3 2.7-5 6-5s6 2 6 5"/>
              </svg>
              Mis pacientes
            </div>
          </div>
          <div className="sidebar-user">
            <div className="sidebar-user-name">{user?.email}</div>
            Médico
          </div>
          <button className="btn-logout" onClick={logout}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 3H3a1 1 0 00-1 1v8a1 1 0 001 1h3"/>
              <path d="M10 11l3-3-3-3"/><line x1="13" y1="8" x2="6" y2="8"/>
            </svg>
            Cerrar sesión
          </button>
        </div>

        <div className="shell-main">
          <div className="shell-topbar">
            <div className="shell-topbar-title">Mis pacientes</div>
            <div className="shell-topbar-right">
              <span className="role-chip role-chip-medico">Médico</span>
              <AvatarMenu initials={initials(user?.nombre || user?.email)} className="avatar" />
            </div>
          </div>

          <div className="content">
            <div className="content-main">
              <div className="stat-row">
                <div className="stat-card">
                  <div className="stat-label">Pacientes activos</div>
                  <div className="stat-val">{patients.length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Con alertas</div>
                  <div className="stat-val v-danger">
                    {patients.filter(p => p.alert_count > 0).length}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Sin alertas</div>
                  <div className="stat-val">{loading ? '...' : patients.filter(p => !p.alert_count).length}</div>
                </div>
              </div>

              <div className="toolbar">
                <div className="search-wrap">
                  <svg className="search-icon" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="#7A8FA8" strokeWidth="1.5">
                    <circle cx="6.5" cy="6.5" r="4"/><path d="M11 11l2.5 2.5"/>
                  </svg>
                  <input
                    className="search-input"
                    type="text"
                    placeholder="Buscar paciente por nombre o código..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <select
                  className="filter-select"
                  value={alertFilter}
                  onChange={e => setAlertFilter(e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="alerta">Con alertas</option>
                  <option value="sin">Sin alertas</option>
                </select>
                <button className="btn btn-primary" onClick={() => navigate('/medico/nuevo')}>
                  + Nuevo paciente
                </button>
              </div>

              <div className="table-outer">
                <table style={{minWidth: 600}}>
                  <thead>
                    <tr>
                      <th>Paciente</th>
                      <th>Diagnóstico</th>
                      <th>Última sesión</th>
                      <th>Alertas</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody aria-live="polite" aria-relevant="additions removals">
                    {loading && (
                      <tr><td colSpan="5" className="empty-state">Cargando pacientes...</td></tr>
                    )}
                    {error && (
                      <tr><td colSpan="5" className="error-state">{error}</td></tr>
                    )}
                    {!loading && !error && filtered.length === 0 && (
                      <tr><td colSpan="5" className="empty-state">No se encontraron pacientes.</td></tr>
                    )}
                    {!loading && !error && filtered.map(p => (
                      <tr key={p.patient_id} onClick={() => navigate('/medico/paciente/'+p.patient_id, { state: { paciente: p } })}>
                        <td>
                          <div className="pat-name">{p.nombre || '—'}</div>
                          <div className="pat-code">{p.patient_id}</div>
                        </td>
                        <td>{p.diagnostico || '—'}</td>
                        <td>{p.last_session || '—'}</td>
                        <td>{alertChip(p.alert_count)}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-tonal"
                            onClick={e => { e.stopPropagation(); navigate('/medico/paciente/'+p.patient_id, { state: { paciente: p } }) }}
                          >
                            Ver ficha
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="content-side">
              <div className="side-card">
                <div className="side-title">Resumen</div>
                <div className="m-row">
                  <span className="m-label">Total pacientes</span>
                  <span className="m-val">{patients.length}</span>
                </div>
                <div className="m-div"></div>
                <div className="m-row">
                  <span className="m-label">Con alertas</span>
                  <span className="m-val">{patients.filter(p => p.alert_count > 0).length}</span>
                </div>
                <div className="m-div"></div>
                <div className="m-row">
                  <span className="m-label">Sin alertas</span>
                  <span className="m-val">{patients.filter(p => !p.alert_count).length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}