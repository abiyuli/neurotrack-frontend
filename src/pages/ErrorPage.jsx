import { useSearchParams } from 'react-router-dom'

function goHome() {
  try {
    const user = JSON.parse(sessionStorage.getItem('user') || 'null')
    const routes = { medico: '/medico', cuidador: '/cuidador', investigador: '/investigador', admin: '/admin', paciente: '/paciente' }
    window.location.href = routes[user?.rol] || '/login'
  } catch {
    window.location.href = '/login'
  }
}

const ERRORS = {
  '401': {
    code: '401',
    color: '#D97706',
    badgeBg: '#FEF3C7',
    title: 'Sesión expirada',
    desc: 'Tu sesión ha expirado o las credenciales ya no son válidas. Vuelve a iniciar sesión para continuar.',
    hint: 'Esto ocurre cuando tu sesión ha estado inactiva por demasiado tiempo o iniciaste sesión en otro dispositivo.',
    btn1Label: 'Iniciar sesión',
    btn1Action: () => { window.location.href = '/login' },
  },
  '403': {
    code: '403',
    color: '#DC2626',
    badgeBg: '#FEE2E2',
    title: 'Acceso denegado',
    desc: 'No tienes los permisos necesarios para ver esta página.',
    hint: 'Si crees que deberías tener acceso, contacta al administrador de la plataforma.',
    btn1Label: '← Volver',
    btn1Action: () => window.history.back(),
    btn2Label: 'Ir al inicio',
    btn2Action: goHome,
  },
  '404': {
    code: '404',
    color: '#7C3AED',
    badgeBg: '#EDE9FE',
    title: 'Página no encontrada',
    desc: 'La dirección que ingresaste no existe en NeuroTrack.',
    hint: 'Verifica que la URL sea correcta o navega al inicio desde el menú.',
    btn1Label: '← Volver',
    btn1Action: () => window.history.back(),
    btn2Label: 'Ir al inicio',
    btn2Action: goHome,
  },
  '500': {
    code: '500',
    color: '#DC2626',
    badgeBg: '#FEE2E2',
    title: 'Error del servidor',
    desc: 'Algo falló al procesar tu solicitud. El error ha sido registrado.',
    hint: 'Intenta nuevamente en unos momentos. Si el problema persiste, contacta al soporte técnico.',
    btn1Label: '← Volver',
    btn1Action: () => window.history.back(),
    btn2Label: 'Reintentar',
    btn2Action: () => window.history.go(0),
  },
  '503': {
    code: '503',
    color: '#D97706',
    badgeBg: '#FEF3C7',
    title: 'Servicio no disponible',
    desc: 'La plataforma está temporalmente fuera de servicio por mantenimiento.',
    hint: 'Estamos trabajando para restablecer el servicio. Vuelve a intentarlo en unos minutos.',
    btn1Label: 'Reintentar',
    btn1Action: () => window.location.reload(),
  },
  'offline': {
    code: '···',
    color: '#6B7280',
    badgeBg: '#F3F4F6',
    title: 'Sin conexión',
    desc: 'No se pudo establecer conexión con el servidor.',
    hint: 'Verifica tu conexión a internet e intenta nuevamente.',
    btn1Label: 'Reintentar',
    btn1Action: () => window.location.reload(),
  },
}

const FALLBACK = ERRORS['500']

export default function ErrorPage({ code: codeProp }) {
  const [params] = useSearchParams()
  const code = codeProp || params.get('code') || '404'
  const cfg  = ERRORS[code] || FALLBACK

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#1A2535;min-height:100vh;}
        .err-page{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;background:#1A2535;}
        .err-brand{text-align:center;margin-bottom:36px;}
        .err-brand-icon{display:flex;justify-content:center;margin-bottom:16px;}
        .err-brand-name{font-size:28px;font-weight:600;letter-spacing:0.14em;color:#FFFFFF;text-transform:uppercase;text-shadow:0 0 8px rgba(255,255,255,0.9),0 0 20px rgba(255,255,255,0.5);}
        .err-card{background:#FFFFFF;border:1.5px solid #DDD5C8;border-radius:16px;padding:40px 44px;width:100%;max-width:460px;text-align:center;}
        .err-badge{display:inline-flex;align-items:center;justify-content:center;padding:8px 20px;border-radius:999px;font-size:28px;font-weight:700;letter-spacing:0.05em;margin-bottom:20px;font-variant-numeric:tabular-nums;}
        .err-title{font-size:22px;font-weight:700;color:#0B2545;margin-bottom:10px;}
        .err-desc{font-size:15px;color:#4A5568;line-height:1.65;margin-bottom:16px;}
        .err-hint{font-size:13px;color:#7A8FA8;line-height:1.6;background:#F0F6FF;border:1px solid #B8D4F5;border-radius:10px;padding:12px 16px;margin-bottom:28px;text-align:left;}
        .err-hint-icon{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;background:#1D5FA8;color:#fff;font-size:9px;font-weight:700;margin-right:6px;flex-shrink:0;vertical-align:middle;}
        .err-actions{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}
        .err-btn-primary{padding:12px 24px;font-size:14px;font-weight:600;background:#0B2545;color:#fff;border:none;border-radius:9px;cursor:pointer;font-family:inherit;transition:background .15s;letter-spacing:0.02em;}
        .err-btn-primary:hover{background:#1a3a60;}
        .err-btn-secondary{padding:12px 24px;font-size:14px;font-weight:500;background:#fff;color:#0B2545;border:1.5px solid #C8C0B5;border-radius:9px;cursor:pointer;font-family:inherit;transition:background .15s;}
        .err-btn-secondary:hover{background:#F5F0EA;}
        .err-footer{margin-top:24px;font-size:12px;color:#5B7A9A;text-align:center;}
        .err-footer a{color:#7AADCF;text-decoration:none;}
        .err-footer a:hover{color:#A8D0F0;}
        @media(max-width:600px){
          .err-card{padding:28px 22px;border-radius:12px;}
          .err-badge{font-size:22px;}
          .err-title{font-size:18px;}
          .err-desc{font-size:14px;}
          .err-actions{flex-direction:column;}
          .err-btn-primary,.err-btn-secondary{width:100%;text-align:center;}
        }
      `}</style>

      <div className="err-page">
        <div className="err-brand">
          <div className="err-brand-icon">
            <svg width="48" height="48" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="36" cy="36" r="34" stroke="rgba(255,255,255,0.1)" strokeWidth="2"/>
              <circle cx="36" cy="36" r="6" fill="rgba(255,255,255,0.9)"/>
              <line x1="36" y1="30" x2="36" y2="16" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="36" y1="42" x2="36" y2="56" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="30" y1="36" x2="16" y2="36" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="42" y1="36" x2="56" y2="36" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="36" cy="14" r="3" fill="rgba(255,255,255,0.8)"/>
              <circle cx="36" cy="58" r="3" fill="rgba(255,255,255,0.8)"/>
              <circle cx="14" cy="36" r="3" fill="rgba(255,255,255,0.8)"/>
              <circle cx="58" cy="36" r="3" fill="rgba(255,255,255,0.8)"/>
            </svg>
          </div>
          <div className="err-brand-name">NeuroTrack</div>
        </div>

        <div className="err-card">
          <div
            className="err-badge"
            style={{ color: cfg.color, background: cfg.badgeBg }}
          >
            {cfg.code}
          </div>

          <div className="err-title">{cfg.title}</div>
          <div className="err-desc">{cfg.desc}</div>

          <div className="err-hint">
            <span className="err-hint-icon">i</span>
            {cfg.hint}
          </div>

          <div className="err-actions">
            <button className="err-btn-primary" onClick={cfg.btn1Action}>
              {cfg.btn1Label}
            </button>
            {cfg.btn2Label && (
              <button className="err-btn-secondary" onClick={cfg.btn2Action}>
                {cfg.btn2Label}
              </button>
            )}
          </div>
        </div>

        <div className="err-footer">
          NeuroTrack · Plataforma de monitoreo de síntomas de Parkinson — PUCP
        </div>
      </div>
    </>
  )
}
