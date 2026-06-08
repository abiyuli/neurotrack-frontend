import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useEscLogout } from '../../hooks/useEscLogout'
import AvatarMenu from '../../components/AvatarMenu'
import '../../styles/shell.css'
import '../../styles/admin.css'

const TITLES = {
  '/admin/panel':        'Panel de control',
  '/admin/usuarios':     'Gestión de usuarios',
  '/admin/dispositivos': 'Gestión de dispositivos',
  '/admin/asignaciones': 'Asignaciones cuidador-paciente',
  '/admin/auditoria':    'Auditoría',
}

const navCls = ({ isActive }) => `nav-item${isActive ? ' active' : ''}`

export default function AdminLayout() {
  const { pathname } = useLocation()
  const { user }     = useAuth()
  useEscLogout()
  const title        = TITLES[pathname] || 'Admin'
  const nombre       = user?.nombre || user?.email || 'Admin'
  const initials     = nombre.trim().split(' ').slice(0, 2).map(p => p[0].toUpperCase()).join('')

  return (
    <div className="shell">
      <div className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-name">NeuroTrack</div>
          <div className="sidebar-brand-sub">Monitoreo de síntomas · Parkinson</div>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/admin/panel" className={navCls}>
            <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/>
              <rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/>
            </svg>
            Panel
          </NavLink>
          <NavLink to="/admin/usuarios" className={navCls}>
            <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="5" r="3"/><path d="M2 14c0-3 2.7-5 6-5s6 2 6 5"/>
            </svg>
            Usuarios
          </NavLink>
          <NavLink to="/admin/dispositivos" className={navCls}>
            <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="10" height="10" rx="2"/><path d="M8 6v4M6 8h4"/>
            </svg>
            Dispositivos
          </NavLink>
          <NavLink to="/admin/asignaciones" className={navCls}>
            <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 8h10M3 5h6M3 11h8"/>
            </svg>
            Asignaciones
          </NavLink>
          <NavLink to="/admin/auditoria" className={navCls}>
            <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 2h8a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/>
              <path d="M6 6h4M6 9h3"/>
            </svg>
            Auditoría
          </NavLink>
        </nav>
        <div className="sidebar-user">
          <div className="sidebar-user-name">{nombre}</div>
          {user?.email || ''}
        </div>
      </div>

      <div className="shell-main">
        <div className="shell-topbar">
          <div className="shell-topbar-title">{title}</div>
          <div className="shell-topbar-right">
            <span className="role-chip role-chip-admin">Administrador</span>
            <AvatarMenu initials={initials} className="admin-avatar" />
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
