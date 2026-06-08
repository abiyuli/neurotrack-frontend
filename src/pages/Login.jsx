import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error,      setError]      = useState('')
  const [emailError, setEmailError] = useState('')
  const [loading,    setLoading]    = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const mensajeRegistro = location.state?.mensaje

  function validateEmail(val) {
    if (!val.trim()) return 'El correo es obligatorio.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Ingresa un correo válido.'
    return ''
  }

  function blurEmail() { setEmailError(validateEmail(email)) }

  async function handleSubmit(e) {
    e?.preventDefault()
    const errEmail = validateEmail(email)
    if (errEmail) { setEmailError(errEmail); return }
    if (!password) { setError('Ingresa tu contraseña.'); return }
    setError('')
    setEmailError('')
    setLoading(true)
    try {
      const { profile } = await login(email, password)
      const routes = { medico: '/medico', cuidador: '/cuidador', investigador: '/investigador', admin: '/admin', paciente: '/paciente' }
      navigate(routes[profile?.rol] || '/medico', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Credenciales inválidas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#1A2535;min-height:100vh;}
        .page-center{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;}
        .brand{text-align:center;margin-bottom:44px;}
        .brand-icon{display:flex;justify-content:center;margin-bottom:20px;}
        .brand-name{font-size:60px;font-weight:600;letter-spacing:0.14em;color:#FFFFFF;text-transform:uppercase;text-shadow:0 0 8px rgba(255,255,255,0.9),0 0 20px rgba(255,255,255,0.5),0 0 40px rgba(255,255,255,0.25);}
        .brand-sub{font-size:20px;letter-spacing:0.04em;color:#A8BDD4;margin-top:12px;}
        .card{background:#FFFFFF;border:1.5px solid #DDD5C8;border-radius:16px;padding:44px 48px;width:100%;max-width:460px;}
        .field-wrap{margin-bottom:28px;}
        .field-label{font-size:18px;font-weight:600;letter-spacing:0.03em;text-transform:uppercase;color:#5B7FA6;margin-bottom:10px;display:block;}
        .input-field{width:100%;padding:16px 20px;font-size:18px;border:2px solid #C8C0B5;border-radius:10px;background:#FDFAF7;color:#0B2545;outline:none;font-family:inherit;}
        .input-field:focus{border-color:#1D5FA8;background:#fff;}
        .btn-primary{width:100%;padding:18px;font-size:20px;font-weight:600;letter-spacing:0.04em;border-radius:10px;margin-top:8px;}
        .divider{height:1px;background:#EDE8E1;margin:32px 0;}
        .forgot{text-align:right;margin-top:10px;}
        .forgot a{font-size:16px;color:#7A8FA8;text-decoration:none;cursor:pointer;}
        .forgot a:hover{color:#1D5FA8;}
        .link-row{text-align:center;font-size:17px;color:#7A8FA8;}
        .link-row a{color:#1D5FA8;text-decoration:none;font-weight:600;}
        .error-box{background:#fff0f0;border:1px solid #fcc;border-radius:8px;padding:10px 14px;color:#c00;font-size:14px;margin-bottom:16px;}
        .success-box{background:#E8F5EE;border:1px solid #A8DFC9;border-radius:8px;padding:10px 14px;color:#1A5C3A;font-size:14px;margin-bottom:16px;}
        .input-field.invalid{border-color:#c00 !important;background:#fff8f8;}
        .field-bubble{display:flex;align-items:center;gap:6px;margin-top:8px;padding:5px 10px;background:#fff0f0;border:1px solid #fcc;border-radius:6px;font-size:14px;color:#c00;}
        .field-bubble-dot{width:6px;height:6px;border-radius:50%;background:#c00;flex-shrink:0;}
        @media(max-width:600px){
          .page-center{padding:28px 16px;}
          .brand{margin-bottom:28px;}
          .brand-icon svg{width:48px;height:48px;}
          .brand-name{font-size:36px;letter-spacing:0.08em;}
          .brand-sub{font-size:13px;margin-top:8px;}
          .card{padding:28px 22px;border-radius:12px;}
          .field-label{font-size:13px;}
          .input-field{padding:12px 14px;font-size:15px;}
          .btn-primary{padding:14px;font-size:16px;}
          .field-wrap{margin-bottom:20px;}
          .forgot a{font-size:13px;}
          .link-row{font-size:14px;}
          .divider{margin:22px 0;}
        }
      `}</style>

      <div className="page-center">
      <div className="brand">
        <div className="brand-icon">
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="36" cy="36" r="34" stroke="rgba(255,255,255,0.1)" strokeWidth="2"/>
            <circle cx="36" cy="36" r="6" fill="rgba(255,255,255,0.9)"/>
            <line x1="36" y1="30" x2="36" y2="16" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="36" y1="42" x2="36" y2="56" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="30" y1="36" x2="16" y2="36" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="42" y1="36" x2="56" y2="36" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="31.8" y1="31.8" x2="22.5" y2="22.5" stroke="rgba(255,255,255,0.55)" strokeWidth="1.3" strokeLinecap="round"/>
            <line x1="40.2" y1="31.8" x2="49.5" y2="22.5" stroke="rgba(255,255,255,0.55)" strokeWidth="1.3" strokeLinecap="round"/>
            <line x1="31.8" y1="40.2" x2="22.5" y2="49.5" stroke="rgba(255,255,255,0.55)" strokeWidth="1.3" strokeLinecap="round"/>
            <line x1="40.2" y1="40.2" x2="49.5" y2="49.5" stroke="rgba(255,255,255,0.55)" strokeWidth="1.3" strokeLinecap="round"/>
            <circle cx="36" cy="14" r="3" fill="rgba(255,255,255,0.8)"/>
            <circle cx="36" cy="58" r="3" fill="rgba(255,255,255,0.8)"/>
            <circle cx="14" cy="36" r="3" fill="rgba(255,255,255,0.8)"/>
            <circle cx="58" cy="36" r="3" fill="rgba(255,255,255,0.8)"/>
            <circle cx="21" cy="21" r="2.5" fill="rgba(255,255,255,0.65)"/>
            <circle cx="51" cy="21" r="2.5" fill="rgba(255,255,255,0.65)"/>
            <circle cx="21" cy="51" r="2.5" fill="rgba(255,255,255,0.65)"/>
            <circle cx="51" cy="51" r="2.5" fill="rgba(255,255,255,0.65)"/>
          </svg>
        </div>
        <div className="brand-name">NeuroTrack</div>
        <div className="brand-sub">Plataforma de monitoreo de síntomas de Parkinson - PUCP</div>
      </div>

      <div className="card">
        {mensajeRegistro && <div className="success-box">{mensajeRegistro}</div>}
        {error && <div className="error-box">{error}</div>}
        <form onSubmit={handleSubmit}>

        <div className="field-wrap">
          <label className="field-label">Correo electrónico</label>
          <input
            className={`input-field${emailError ? ' invalid' : ''}`}
            type="email"
            placeholder="usuario@correo.com"
            value={email}
            onChange={e => { setEmail(e.target.value); if (emailError) setEmailError('') }}
            onBlur={blurEmail}
            disabled={loading}
            autoComplete="email"
          />
          {emailError && (
            <div className="field-bubble" role="alert">
              <span className="field-bubble-dot" />
              {emailError}
            </div>
          )}
        </div>

        <div className="field-wrap">
          <label className="field-label">Contraseña</label>
          <input
            className="input-field"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={loading}
          />
          <div className="forgot"><a href="#">¿Olvidaste tu contraseña?</a></div>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>

        <div className="divider"></div>
        <div className="link-row">¿No tienes cuenta? <a href="/registro">Regístrate</a></div>
        </form>
      </div>
      </div>
    </>
  )
}