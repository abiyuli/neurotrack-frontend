import { useRef, useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useEscLogout } from '../../hooks/useEscLogout'
import AvatarMenu from '../../components/AvatarMenu'
import '../../styles/shell.css'
import '../../styles/paciente.css'

const TITLES = {
  '/paciente/inicio':   'Mi panel',
  '/paciente/sesiones': 'Mis sesiones',
  '/paciente/alertas':  'Mis alertas',
}

const navCls = ({ isActive }) => `nav-item${isActive ? ' active' : ''}`

export default function PacienteLayout() {
  const { pathname }  = useLocation()
  const { user }      = useAuth()
  const contentRef    = useRef(null)
  useEscLogout()
  useEffect(() => { contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' }) }, [pathname])

  const nombre   = user?.nombre  || user?.email || 'Paciente'
  const email    = user?.email   || ''
  const initials = nombre.trim().split(' ').slice(0, 2).map(p => p[0].toUpperCase()).join('')
  const title    = TITLES[pathname] || 'Mi panel'

  return (
    <div className="shell">
      <div className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-name">NeuroTrack</div>
          <div className="sidebar-brand-sub">Monitoreo de síntomas · Parkinson</div>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/paciente/inicio" className={navCls}>
            <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="2" width="5" height="5" rx="1"/>
              <rect x="9" y="2" width="5" height="5" rx="1"/>
              <rect x="2" y="9" width="5" height="5" rx="1"/>
              <rect x="9" y="9" width="5" height="5" rx="1"/>
            </svg>
            Mi panel
          </NavLink>
          <NavLink to="/paciente/sesiones" className={navCls}>
            <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 2h8a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/>
              <path d="M6 6h4M6 9h3"/>
            </svg>
            Mis sesiones
          </NavLink>
          <NavLink to="/paciente/alertas" className={navCls}>
            <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 2a5 5 0 015 5v3l1.5 2H1.5L3 10V7a5 5 0 015-5z"/>
              <path d="M6.5 13.5a1.5 1.5 0 003 0"/>
            </svg>
            Mis alertas
          </NavLink>
        </nav>
        <div className="sidebar-user">
          <div className="sidebar-user-name">{nombre}</div>
          {email}
        </div>
      </div>

      <div className="shell-main">
        <div className="shell-topbar">
          <div className="shell-topbar-title">{title}</div>
          <div className="shell-topbar-right">
            <span className="role-chip role-chip-paciente">Paciente</span>
            <AvatarMenu initials={initials} className="pac-avatar" />
          </div>
        </div>
        <div ref={contentRef} className="pac-content">
          <Outlet context={{ title }} />
        </div>
      </div>
    </div>
  )
}
