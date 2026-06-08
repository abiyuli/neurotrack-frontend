import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useEscLogout } from '../../hooks/useEscLogout'
import AvatarMenu from '../../components/AvatarMenu'
import '../../styles/shell.css'
import '../../styles/cuidador.css'

const navCls = ({ isActive }) => `nav-item${isActive ? ' active' : ''}`

export default function CuidadorLayout() {
  const [title, setTitle] = useState('Mis pacientes')
  const { user } = useAuth()
  useEscLogout()

  const nombre   = user?.nombre  || user?.email || 'Cuidador'
  const email    = user?.email   || ''
  const initials = nombre.trim().split(' ').slice(0, 2).map(p => p[0].toUpperCase()).join('')

  return (
    <div className="shell">
      <div className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-name">NeuroTrack</div>
          <div className="sidebar-brand-sub">Monitoreo de síntomas · Parkinson</div>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/cuidador/pacientes" className={navCls} end={false}>
            <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="5" r="3"/><path d="M2 14c0-3 2.7-5 6-5s6 2 6 5"/>
            </svg>
            Mis pacientes
          </NavLink>
          <NavLink to="/cuidador/alertas" className={navCls}>
            <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 2a5 5 0 015 5c0 3-1.5 4.5-1.5 6H4.5C4.5 11.5 3 10 3 7a5 5 0 015-5zM6 13h4M8 2V1"/>
            </svg>
            Alertas activas
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
            <span className="role-chip role-chip-cuidador">Cuidador</span>
            <AvatarMenu initials={initials} className="cuidador-avatar" />
          </div>
        </div>
        <Outlet context={{ setTitle }} />
      </div>
    </div>
  )
}
