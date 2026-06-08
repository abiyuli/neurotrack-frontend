import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const dropdownStyle = {
  position: 'absolute',
  top: 'calc(100% + 8px)',
  right: 0,
  background: '#fff',
  border: '0.5px solid #DDD5C8',
  borderRadius: 10,
  boxShadow: '0 4px 20px rgba(0,0,0,.13)',
  minWidth: 160,
  zIndex: 200,
  overflow: 'hidden',
}

const itemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  width: '100%',
  padding: '11px 16px',
  fontSize: 13,
  color: '#0B2545',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  textAlign: 'left',
  whiteSpace: 'nowrap',
}

export default function AvatarMenu({ initials, className }) {
  const [open, setOpen] = useState(false)
  const { logout }      = useAuth()
  const navigate        = useNavigate()
  const ref             = useRef(null)

  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  async function handleLogout() {
    setOpen(false)
    await logout()
    navigate('/login')
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        className={className}
        style={{ cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setOpen(o => !o)}
      >
        {initials}
      </div>

      {open && (
        <div style={dropdownStyle}>
          <button
            style={itemStyle}
            onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#A32D2D' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none';    e.currentTarget.style.color = '#0B2545' }}
            onClick={handleLogout}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 3H3a1 1 0 00-1 1v8a1 1 0 001 1h3"/>
              <path d="M10 11l3-3-3-3M13 8H6"/>
            </svg>
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
