import { useState } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Turnstile } from '@marsidev/react-turnstile'
import { useAuth } from '../context/AuthContext'

const COGNITO_URL = `https://cognito-idp.${import.meta.env.VITE_COGNITO_REGION}.amazonaws.com/`
const CLIENT_ID   = import.meta.env.VITE_COGNITO_CLIENT_ID

async function cognitoPost(target, body) {
  const res = await fetch(COGNITO_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-amz-json-1.1', 'X-Amz-Target': target },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.message || json.__type || 'Error desconocido')
  return json
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error,      setError]      = useState('')
  const [emailError, setEmailError] = useState('')
  const [loading,    setLoading]    = useState(false)
  const [cfToken,    setCfToken]    = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const mensajeRegistro = location.state?.mensaje
  const sessionExpirada = searchParams.get('motivo') === 'sesion_expirada'

  // Forgot password state
  const [fpStep,    setFpStep]    = useState(null) // null | 'email' | 'code' | 'done'
  const [fpEmail,   setFpEmail]   = useState('')
  const [fpCode,    setFpCode]    = useState('')
  const [fpPass,    setFpPass]    = useState('')
  const [fpLoading, setFpLoading] = useState(false)
  const [fpError,   setFpError]   = useState('')

  async function sendResetCode(e) {
    e?.preventDefault()
    if (!fpEmail.trim()) { setFpError('Ingresa tu correo.'); return }
    setFpLoading(true); setFpError('')
    try {
      await cognitoPost('AWSCognitoIdentityProviderService.ForgotPassword', { ClientId: CLIENT_ID, Username: fpEmail.trim() })
      setFpStep('code')
    } catch (err) {
      setFpError(err.message)
    } finally {
      setFpLoading(false)
    }
  }

  async function confirmReset(e) {
    e?.preventDefault()
    if (!fpCode.trim()) { setFpError('Ingresa el código recibido.'); return }
    if (fpPass.length < 8) { setFpError('La contraseña debe tener al menos 8 caracteres.'); return }
    setFpLoading(true); setFpError('')
    try {
      await cognitoPost('AWSCognitoIdentityProviderService.ConfirmForgotPassword', {
        ClientId: CLIENT_ID, Username: fpEmail.trim(), ConfirmationCode: fpCode.trim(), Password: fpPass,
      })
      setFpStep('done')
    } catch (err) {
      setFpError(err.message)
    } finally {
      setFpLoading(false)
    }
  }

  function closeFp() { setFpStep(null); setFpEmail(''); setFpCode(''); setFpPass(''); setFpError('') }

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
    if (!cfToken)  { setError('Completa la verificación de seguridad.'); return }
    setError('')
    setEmailError('')
    setLoading(true)
    try {
      const { profile } = await login(email, password, cfToken)
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
        .register-callout{margin-top:18px;padding:14px 16px;background:#F0F6FF;border:1px solid #B8D4F5;border-radius:10px;font-size:13px;color:#0C3C6E;line-height:1.6;}
        .register-callout-title{font-weight:700;margin-bottom:6px;display:flex;align-items:center;gap:7px;font-size:13px;}
        .register-callout-icon{width:18px;height:18px;border-radius:50%;background:#1D5FA8;color:#fff;font-size:10px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;}
        .register-callout ul{padding-left:16px;margin:4px 0 0;}
        .register-callout li{margin-bottom:4px;}
        .register-callout li:last-child{margin-bottom:0;}
        .register-callout strong{font-weight:700;color:#0B2545;}
        .fp-overlay{position:fixed;inset:0;background:rgba(15,25,40,0.55);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px;}
        .fp-modal{background:#fff;border-radius:14px;padding:36px 40px;width:100%;max-width:420px;position:relative;}
        .fp-close{position:absolute;top:14px;right:16px;background:none;border:none;font-size:20px;color:#7A8FA8;cursor:pointer;line-height:1;}
        .fp-close:hover{color:#0B2545;}
        .fp-title{font-size:20px;font-weight:700;color:#0B2545;margin-bottom:6px;}
        .fp-sub{font-size:13px;color:#5B7FA6;margin-bottom:22px;line-height:1.5;}
        .fp-label{font-size:13px;font-weight:600;color:#5B7FA6;text-transform:uppercase;letter-spacing:0.03em;margin-bottom:7px;display:block;}
        .fp-input{width:100%;padding:13px 16px;font-size:15px;border:1.5px solid #C8C0B5;border-radius:9px;background:#FDFAF7;color:#0B2545;outline:none;font-family:inherit;margin-bottom:14px;}
        .fp-input:focus{border-color:#1D5FA8;}
        .fp-btn{width:100%;padding:14px;font-size:16px;font-weight:600;border-radius:9px;margin-top:4px;}
        .fp-error{font-size:12px;color:#c00;background:#fff0f0;border:1px solid #fcc;border-radius:7px;padding:8px 12px;margin-bottom:12px;}
        .fp-success{text-align:center;}
        .fp-success-icon{font-size:36px;margin-bottom:12px;}
        .fp-success-title{font-size:18px;font-weight:700;color:#065F46;margin-bottom:8px;}
        .fp-success-text{font-size:13px;color:#3A5270;line-height:1.6;margin-bottom:20px;}
        @media(max-width:600px){
          .fp-modal{padding:28px 22px;}
          .fp-title{font-size:17px;}
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
        {sessionExpirada && !mensajeRegistro && (
          <div className="error-box" style={{ background: '#FEF3C7', border: '1px solid #FCD34D', color: '#92400E' }}>
            Tu sesión ha expirado. Por favor inicia sesión nuevamente.
          </div>
        )}
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
          <div className="forgot"><a onClick={() => { setFpStep('email'); setFpEmail(email) }}>¿Olvidaste tu contraseña?</a></div>
        </div>

        <div style={{ margin: '16px 0 8px' }}>
          <Turnstile
            siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
            onSuccess={token => setCfToken(token)}
            onError={() => setCfToken('')}
            onExpire={() => setCfToken('')}
            options={{ theme: 'light', language: 'es' }}
          />
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={loading || !cfToken}
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
        </button>

        <div className="divider"></div>
        <div className="link-row">¿No tienes cuenta? <a href="/registro">Regístrate</a></div>

        <div className="register-callout" role="note">
          <div className="register-callout-title">
            <span className="register-callout-icon">i</span>
            ¿Quién puede registrarse?
          </div>
          <ul>
            <li><strong>Médicos e investigadores</strong> — registro libre, requiere aprobación del administrador.</li>
            <li><strong>Cuidadores</strong> — registro libre, acceso inmediato tras aprobación.</li>
            <li><strong>Pacientes</strong> — solo puedes registrarte si tu médico ya creó tu ficha clínica con el correo que vas a usar. Sin ficha previa, la cuenta no se vinculará a tus datos.</li>
          </ul>
        </div>
        </form>
      </div>
      </div>

      {/* Forgot password modal */}
      {fpStep && (
        <div className="fp-overlay" onClick={closeFp}>
          <div className="fp-modal" onClick={e => e.stopPropagation()}>
            <button className="fp-close" onClick={closeFp} aria-label="Cerrar">×</button>

            {fpStep === 'email' && (
              <form onSubmit={sendResetCode}>
                <div className="fp-title">Restablecer contraseña</div>
                <div className="fp-sub">Ingresa tu correo y te enviaremos un código de verificación.</div>
                {fpError && <div className="fp-error">{fpError}</div>}
                <label className="fp-label">Correo electrónico</label>
                <input className="fp-input" type="email" placeholder="usuario@correo.com"
                  value={fpEmail} onChange={e => setFpEmail(e.target.value)} autoFocus disabled={fpLoading} />
                <button type="submit" className="btn btn-primary fp-btn" disabled={fpLoading}>
                  {fpLoading ? 'Enviando...' : 'Enviar código'}
                </button>
              </form>
            )}

            {fpStep === 'code' && (
              <form onSubmit={confirmReset}>
                <div className="fp-title">Ingresa el código</div>
                <div className="fp-sub">Revisa tu correo <strong>{fpEmail}</strong>. Ingresa el código de 6 dígitos y tu nueva contraseña.</div>
                {fpError && <div className="fp-error">{fpError}</div>}
                <label className="fp-label">Código de verificación</label>
                <input className="fp-input" type="text" placeholder="123456" inputMode="numeric"
                  value={fpCode} onChange={e => setFpCode(e.target.value)} autoFocus disabled={fpLoading} />
                <label className="fp-label">Nueva contraseña</label>
                <input className="fp-input" type="password" placeholder="Mínimo 8 caracteres"
                  value={fpPass} onChange={e => setFpPass(e.target.value)} disabled={fpLoading} />
                <button type="submit" className="btn btn-primary fp-btn" disabled={fpLoading}>
                  {fpLoading ? 'Verificando...' : 'Restablecer contraseña'}
                </button>
              </form>
            )}

            {fpStep === 'done' && (
              <div className="fp-success">
                <div className="fp-success-icon">✓</div>
                <div className="fp-success-title">Contraseña actualizada</div>
                <div className="fp-success-text">Tu contraseña fue restablecida correctamente. Ya puedes iniciar sesión con tu nueva contraseña.</div>
                <button className="btn btn-primary fp-btn" onClick={closeFp}>Volver al inicio de sesión</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}