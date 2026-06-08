import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'

const ROLE_LABEL = { medico: 'Médico', cuidador: 'Cuidador', investigador: 'Investigador', admin: 'Administrador', paciente: 'Paciente' }
const ROLE_CLASS = { medico: 'rb-medico', cuidador: 'rb-cuidador', investigador: 'rb-inv', admin: 'rb-admin' }

export default function AdminPanel() {
  const navigate = useNavigate()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/admin/panel')
      .then(({ data }) => setData(data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="admin-panel">
      <div className="state-loading"><div className="spinner" /><span>Cargando panel...</span></div>
    </div>
  )

  if (!data) return null

  const { kpis, byRole, recentAudit } = data

  return (
    <div className="admin-panel" style={{ overflowY: 'auto' }}>
      <div style={{ padding: '0 28px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* KPI grid */}
        <div className="panel-kpi-grid">
          <KpiCard
            label="Usuarios registrados"
            value={kpis.totalUsuarios}
            sub={`${kpis.usuariosActivos} activos`}
            accent="#1A6B3C"
            icon={<IconUsers />}
            onClick={() => navigate('/admin/usuarios')}
            badge={kpis.pendientes > 0 ? `${kpis.pendientes} pendiente${kpis.pendientes > 1 ? 's' : ''}` : null}
            badgeClass="badge-warn"
          />
          <KpiCard
            label="Pacientes"
            value={kpis.totalPacientes}
            sub="en plataforma"
            accent="#1B4B8A"
            icon={<IconPatient />}
          />
          <KpiCard
            label="Sesiones totales"
            value={kpis.totalSesiones}
            sub={`${kpis.sesionesEsta} esta semana`}
            accent="#5B3FA6"
            icon={<IconSessions />}
          />
          <KpiCard
            label="Dispositivos online"
            value={kpis.dispositivosOnline}
            sub={`de ${kpis.totalDispositivos} totales`}
            accent="#1A6B3C"
            icon={<IconDevice />}
            onClick={() => navigate('/admin/dispositivos')}
            badge={kpis.dispositivosError > 0 ? `${kpis.dispositivosError} con error` : null}
            badgeClass="badge-danger"
          />
        </div>

        {/* Fila inferior: usuarios por rol + actividad reciente */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

          {/* Usuarios por rol */}
          <div className="panel-card" style={{ minWidth: 220 }}>
            <div className="panel-card-title">Usuarios por rol</div>
            {Object.entries(byRole).map(([rol, count]) => (
              <div key={rol} className="panel-role-row">
                <span className={`role-badge ${ROLE_CLASS[rol] || ''}`}>
                  {ROLE_LABEL[rol] || rol}
                </span>
                <div className="panel-role-bar-wrap">
                  <div
                    className="panel-role-bar"
                    style={{ width: `${Math.round((count / kpis.totalUsuarios) * 100)}%` }}
                  />
                </div>
                <span className="panel-role-count">{count}</span>
              </div>
            ))}
            <div className="panel-card-link" onClick={() => navigate('/admin/usuarios')}>
              Ver todos los usuarios
            </div>
          </div>

          {/* Estado de dispositivos */}
          <div className="panel-card" style={{ minWidth: 180 }}>
            <div className="panel-card-title">Estado dispositivos</div>
            <div className="panel-dev-row">
              <span className="adot adot-online" />
              <span className="panel-dev-label">Online</span>
              <span className="panel-dev-val v-ok">{kpis.dispositivosOnline}</span>
            </div>
            <div className="m-div" />
            <div className="panel-dev-row">
              <span className="adot adot-offline" />
              <span className="panel-dev-label">Offline</span>
              <span className="panel-dev-val v-warn">{kpis.dispositivosOffline}</span>
            </div>
            <div className="m-div" />
            <div className="panel-dev-row">
              <span className="adot adot-error" />
              <span className="panel-dev-label">Con error</span>
              <span className="panel-dev-val v-danger">{kpis.dispositivosError}</span>
            </div>
            <div className="panel-card-link" onClick={() => navigate('/admin/dispositivos')}>
              Ver dispositivos
            </div>
          </div>

          {/* Aprobaciones pendientes */}
          {kpis.pendientes > 0 && (
            <div className="panel-card panel-card-warn" style={{ minWidth: 200 }}>
              <div className="panel-card-title">Aprobaciones pendientes</div>
              <div className="panel-pending-num">{kpis.pendientes}</div>
              <div className="panel-pending-sub">
                {kpis.pendientes === 1 ? 'cuenta esperando aprobación' : 'cuentas esperando aprobación'}
              </div>
              <button className="btn btn-primary" onClick={() => navigate('/admin/usuarios')}>
                Revisar ahora
              </button>
            </div>
          )}

          {/* Actividad reciente */}
          <div className="panel-card" style={{ flex: 1, minWidth: 0 }}>
            <div className="panel-card-title">Actividad reciente</div>
            {recentAudit.length === 0
              ? <div style={{ fontSize: 12, color: '#7A8FA8', padding: '8px 0' }} role="status" aria-live="polite">Sin actividad registrada</div>
              : recentAudit.map((a, i) => (
                <div key={i} className="panel-audit-row">
                  <span className={`op-badge ${a.opClass}`} style={{ fontSize: 10 }}>{a.opLabel}</span>
                  <span className="panel-audit-resource">{a.resource}</span>
                  <span className="panel-audit-ts">{a.ts}</span>
                </div>
              ))
            }
            <div className="panel-card-link" onClick={() => navigate('/admin/auditoria')}>
              Ver auditoría completa
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

function KpiCard({ label, value, sub, accent, icon, onClick, badge, badgeClass }) {
  return (
    <div
      className={`panel-kpi-card${onClick ? ' panel-kpi-clickable' : ''}`}
      onClick={onClick}
      style={{ '--kpi-accent': accent }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
    >
      <div className="kpi-icon-wrap">{icon}</div>
      <div className="kpi-body">
        <div className="kpi-value">{value}</div>
        <div className="kpi-label">{label}</div>
        <div className="kpi-sub">{sub}</div>
      </div>
      {badge && <div className={`kpi-badge ${badgeClass}`}>{badge}</div>}
      {onClick && !badge && (
        <div className="kpi-hint">
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 12l4-4-4-4"/>
          </svg>
        </div>
      )}
    </div>
  )
}

function IconUsers() {
  return <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="6" cy="5" r="2.5"/><path d="M1 14c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5"/><circle cx="12" cy="5" r="2"/><path d="M14.5 14c0-2-1.5-3.3-3.5-3.5"/></svg>
}
function IconPatient() {
  return <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="8" cy="5" r="3"/><path d="M2 15c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/></svg>
}
function IconSessions() {
  return <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M4 2h8a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/><path d="M6 6h4M6 9h3"/></svg>
}
function IconDevice() {
  return <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="3" y="3" width="10" height="10" rx="2"/><path d="M8 6v4M6 8h4"/></svg>
}
