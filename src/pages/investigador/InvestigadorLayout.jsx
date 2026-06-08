import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useEscLogout } from '../../hooks/useEscLogout'
import AvatarMenu from '../../components/AvatarMenu'
import '../../styles/shell.css'
import '../../styles/investigador.css'

const navCls = ({ isActive }) => `nav-item${isActive ? ' active' : ''}`

export default function InvestigadorLayout() {
  const [title, setTitle] = useState('Lista de sesiones')
  const { user }    = useAuth()
  useEscLogout()
  const nombre      = user?.nombre || user?.email || 'Investigador'
  const email       = user?.email  || ''
  const initials    = nombre.trim().split(' ').slice(0, 2).map(p => p[0].toUpperCase()).join('')

  return (
    <div className="shell">
      <div className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-name">NeuroTrack</div>
          <div className="sidebar-brand-sub">Monitoreo de síntomas · Parkinson</div>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/investigador/sesiones" className={navCls} end={false}>
            <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 2h8a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z"/>
              <path d="M6 6h4M6 9h3"/>
            </svg>
            Sesiones
          </NavLink>
          <NavLink to="/investigador/exportar" className={navCls}>
            <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 3v7M5 7l3 3 3-3M3 13h10"/>
            </svg>
            Exportar CSV
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
            <span className="role-chip role-chip-inv">Investigador</span>
            <AvatarMenu initials={initials} className="inv-avatar" />
          </div>
        </div>
        <Outlet context={{ setTitle }} />
      </div>
    </div>
  )
}
