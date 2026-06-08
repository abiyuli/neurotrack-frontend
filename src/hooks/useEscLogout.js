import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function useEscLogout() {
  const { logout } = useAuth()
  const navigate   = useNavigate()
  useEffect(() => {
    function handle(e) {
      if (e.key === 'Escape') { logout(); navigate('/login', { replace: true }) }
    }
    window.addEventListener('keydown', handle)
    return () => window.removeEventListener('keydown', handle)
  }, [logout, navigate])
}
