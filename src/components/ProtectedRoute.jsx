import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, role }) {
  const { idToken, user } = useAuth()
  if (!idToken) return <Navigate to="/login" replace />
  if (role && user?.rol !== role) return <Navigate to="/error?code=403" replace />
  return children
}