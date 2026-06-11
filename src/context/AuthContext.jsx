import { createContext, useContext, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [idToken, setIdToken] = useState(
    () => sessionStorage.getItem('idToken') || null
  )
  const [user, setUser] = useState(
    () => JSON.parse(sessionStorage.getItem('user') || 'null')
  )

  async function login(email, password, cfToken) {
    const { data } = await api.post('/auth/login', { email, password, cf_turnstile_response: cfToken })
    sessionStorage.setItem('idToken', data.idToken)

    const profileRes = await api.get('/auth/me', {
      headers: { Authorization: data.idToken }
    })
    const profile = { ...(data.user || { email }), ...profileRes.data }

    sessionStorage.setItem('user', JSON.stringify(profile))
    setIdToken(data.idToken)
    setUser(profile)
    return { ...data, profile }
  }

  function logout() {
    sessionStorage.clear()
    setIdToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ idToken, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}