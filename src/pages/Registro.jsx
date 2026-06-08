import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

const ROLES = [
  { key: 'cuidador',     label: 'Cuidador',     desc: 'Seguimiento de pacientes a cargo',      type: 'instant' },
  { key: 'paciente',     label: 'Paciente',     desc: 'Acceso a mis propios registros',         type: 'instant' },
  { key: 'medico',       label: 'Médico',       desc: 'Requiere aprobación del administrador',  type: 'pending' },
  { key: 'investigador', label: 'Investigador', desc: 'Requiere aprobación del administrador',  type: 'pending' },
]

export default function Registro() {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState(null)
  const [form, setForm] = useState({
    nombre: '', dni: '', telefono: '', email: '', password: '', cmp: '', codigoInstitucional: '',
  })
  const [error,       setError]       = useState('')
  const [fieldErrors, setFieldErrors] = useState({ nombre: '', dni: '', telefono: '', password: '' })
  const [loading,     setLoading]     = useState(false)

  const roleData = ROLES.find(r => r.key === selectedRole)

  const set = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }))
    if (fieldErrors[field]) setFieldErrors(prev => ({ ...prev, [field]: '' }))
  }

  function toTitleCase(val) {
    return val.trim().replace(/\s+/g, ' ')
      .split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
  }

  function validateNombre(val) {
    const palabras = val.trim().split(/\s+/).filter(Boolean)
    if (!val.trim())         return 'Este campo es obligatorio.'
    if (palabras.length < 2) return 'Ingresa al menos nombre y apellido.'
    return ''
  }

  function validateDni(val) {
    if (!val.trim())              return 'Este campo es obligatorio.'
    if (!/^\d{8}$/.test(val.trim())) return 'El DNI debe tener exactamente 8 dígitos numéricos.'
    return ''
  }

  function validatePassword(val) {
    if (!val) return 'La contraseña es obligatoria.'
    const missing = []
    if (val.length < 8)                                        missing.push('mínimo 8 caracteres')
    if (!/[A-Z]/.test(val))                                    missing.push('una letra mayúscula')
    if (!/[a-z]/.test(val))                                    missing.push('una letra minúscula')
    if (!/\d/.test(val))                                       missing.push('un número')
    if (!/[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?]/.test(val))   missing.push('un carácter especial')
    return missing.length ? `Falta: ${missing.join(', ')}.` : ''
  }

  function validateTelefono(val) {
    const digits = val.replace(/\s+/g, '')
    if (!digits)           return 'Este campo es obligatorio.'
    if (!/^\d{9}$/.test(digits)) return 'Ingresa los 9 dígitos de tu número (sin el +51).'
    return ''
  }

  function blurNombre() {
    const formatted = toTitleCase(form.nombre)
    setForm(p => ({ ...p, nombre: formatted }))
    setFieldErrors(p => ({ ...p, nombre: validateNombre(formatted) }))
  }
  function blurDni()      { setFieldErrors(p => ({ ...p, dni:      validateDni(form.dni) })) }
  function blurTelefono() { setFieldErrors(p => ({ ...p, telefono: validateTelefono(form.telefono) })) }
  function blurPassword() { setFieldErrors(p => ({ ...p, password: validatePassword(form.password) })) }

  async function handleSubmit() {
    const errNombre   = validateNombre(form.nombre)
    const errDni      = validateDni(form.dni)
    const errTelefono = validateTelefono(form.telefono)
    const errPassword = validatePassword(form.password)
    setFieldErrors({ nombre: errNombre, dni: errDni, telefono: errTelefono, password: errPassword })
    if (errNombre || errDni || errTelefono || errPassword) return

    if (!selectedRole) { setError('Selecciona un rol para continuar.'); return }

    setError('')
    setLoading(true)
    try {
      const payload = { ...form, telefono: '+51' + form.telefono.replace(/\s+/g, ''), role: selectedRole }
      const { data } = await api.post('/register', payload)
      const msg = data.estado === 'Pendiente'
        ? 'Solicitud enviada. Un administrador debe aprobar tu cuenta antes de que puedas iniciar sesión.'
        : 'Cuenta creada. Ya puedes iniciar sesión.'
      navigate('/login', { state: { mensaje: msg } })
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear la cuenta. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#FAF6F0;min-height:100vh;}
        .reg-center{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;}
        .brand{text-align:center;margin-bottom:28px;}
        .brand-name{font-size:26px;font-weight:500;letter-spacing:0.14em;color:#0B2545;text-transform:uppercase;}
        .brand-sub{font-size:11px;letter-spacing:0.05em;color:#7A8FA8;margin-top:6px;}
        .reg-card{background:#FFFFFF;border:0.5px solid #DDD5C8;border-radius:12px;padding:32px 40px;width:100%;max-width:480px;}
        .card-title{font-size:14px;font-weight:500;color:#0B2545;margin-bottom:20px;}
        .row-2{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:start;}
        .field-wrap{margin-bottom:14px;}
        .field-label{font-size:11px;font-weight:500;letter-spacing:0.05em;text-transform:uppercase;color:#5B7FA6;margin-bottom:5px;display:block;}
        .input-field{width:100%;padding:10px 14px;font-size:13px;border:0.5px solid #C8C0B5;border-radius:8px;background:#FDFAF7;color:#0B2545;outline:none;font-family:inherit;}
        .input-field:focus{border-color:#1D5FA8;background:#fff;}
        .role-label{font-size:11px;font-weight:500;letter-spacing:0.05em;text-transform:uppercase;color:#5B7FA6;margin-bottom:8px;display:block;}
        .role-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
        .role-btn{padding:10px 12px;border:0.5px solid #C8C0B5;border-radius:8px;background:#FDFAF7;cursor:pointer;text-align:left;font-family:inherit;transition:border-color 0.15s,background 0.15s;width:100%;}
        .role-btn:hover{border-color:#7A8FA8;}
        .role-btn.selected{border-color:#1D5FA8;background:#EBF2FB;}
        .role-btn.selected .role-name{color:#1D5FA8;}
        .role-name{font-size:12px;font-weight:500;color:#0B2545;display:block;margin-bottom:2px;}
        .role-desc{font-size:10px;color:#7A8FA8;line-height:1.4;}
        .extra-field{overflow:hidden;max-height:0;opacity:0;transition:max-height 0.3s ease,opacity 0.25s ease,margin-top 0.3s ease;margin-top:0;}
        .extra-field.visible{max-height:120px;opacity:1;margin-top:12px;}
        .extra-hint{font-size:10px;color:#7A8FA8;margin-top:4px;display:block;}
        .notice{margin-top:10px;padding:10px 12px;border-radius:8px;font-size:11px;line-height:1.6;}
        .notice-pending{background:#FDF3E0;border-left:3px solid #E8A020;color:#7A5010;}
        .notice-instant{background:#E8F5EE;border-left:3px solid #2A9E6A;color:#1A5C3A;}
        .btn-primary{width:100%;padding:11px;font-size:13px;font-weight:500;letter-spacing:0.04em;margin-top:6px;}
        .link-row{text-align:center;font-size:12px;color:#7A8FA8;margin-top:16px;}
        .link-row a{color:#1D5FA8;text-decoration:none;font-weight:500;}
        .error-box{background:#fff0f0;border:1px solid #fcc;border-radius:8px;padding:10px 14px;color:#c00;font-size:12px;margin-bottom:14px;}
        .pwd-reqs{margin-top:6px;padding:8px 10px;background:#F8F6F2;border:0.5px solid #E0D9D0;border-radius:8px;}
        .pwd-req{display:flex;align-items:center;gap:7px;font-size:11px;color:#9AABB8;margin-bottom:4px;transition:color .2s;}
        .pwd-req:last-child{margin-bottom:0;}
        .pwd-req.ok{color:#2A9E6A;}
        .pwd-req-dot{width:5px;height:5px;border-radius:50%;background:#C8C0B5;flex-shrink:0;transition:background .2s;}
        .pwd-req.ok .pwd-req-dot{background:#2A9E6A;}
        .input-field.invalid{border-color:#E24B4A !important;background:#FFF8F8;}
        .field-bubble{display:flex;align-items:center;gap:5px;margin-top:5px;padding:5px 10px;background:#FFF0F0;border:0.5px solid #F5B8B8;border-radius:6px;font-size:11px;color:#B91C1C;animation:bubbleIn .18s ease;}
        .field-bubble-dot{width:6px;height:6px;border-radius:50%;background:#E24B4A;flex-shrink:0;}
        @keyframes bubbleIn{from{opacity:0;transform:translateY(-4px);}to{opacity:1;transform:translateY(0);}}
        .phone-wrap{display:flex;border:0.5px solid #C8C0B5;border-radius:8px;background:#FDFAF7;overflow:hidden;transition:border-color .15s;}
        .phone-wrap:focus-within{border-color:#1D5FA8;background:#fff;}
        .phone-wrap.invalid{border-color:#E24B4A !important;background:#FFF8F8;}
        .phone-prefix{padding:10px 10px 10px 14px;font-size:13px;color:#5B7FA6;font-weight:500;white-space:nowrap;user-select:none;}
        .phone-input{flex:1;padding:10px 14px 10px 4px;font-size:13px;border:none;background:transparent;color:#0B2545;outline:none;font-family:inherit;}
        @media(max-width:600px){
          .reg-center{padding:20px 14px;}
          .brand-name{font-size:20px;}
          .reg-card{padding:24px 18px;}
          .row-2{grid-template-columns:1fr;}
          .role-grid{grid-template-columns:1fr;}
        }
      `}</style>

      <div className="reg-center">
        <div className="brand">
          <div className="brand-name">NeuroTrack</div>
          <div className="brand-sub">Plataforma de monitoreo de síntomas de Parkinson</div>
        </div>

        <div className="reg-card">
          <div className="card-title">Crear cuenta</div>

          {error && <div className="error-box">{error}</div>}

          <div className="row-2">
            <div className="field-wrap">
              <label className="field-label">Nombre completo</label>
              <input
                className={`input-field${fieldErrors.nombre ? ' invalid' : ''}`}
                type="text" placeholder="Nombre Apellido"
                value={form.nombre} onChange={set('nombre')} onBlur={blurNombre} disabled={loading}
              />
              {fieldErrors.nombre && (
                <div className="field-bubble" role="alert">
                  <span className="field-bubble-dot" />
                  {fieldErrors.nombre}
                </div>
              )}
            </div>
            <div className="field-wrap">
              <label className="field-label">DNI</label>
              <input
                className={`input-field${fieldErrors.dni ? ' invalid' : ''}`}
                type="text" placeholder="12345678" maxLength={8}
                value={form.dni} onChange={set('dni')} onBlur={blurDni} disabled={loading}
              />
              {fieldErrors.dni && (
                <div className="field-bubble" role="alert">
                  <span className="field-bubble-dot" />
                  {fieldErrors.dni}
                </div>
              )}
            </div>
          </div>

          <div className="field-wrap">
            <label className="field-label">Correo electrónico</label>
            <input className="input-field" type="email" placeholder="usuario@correo.com"
              value={form.email} onChange={set('email')} disabled={loading} autoComplete="email" />
          </div>

          <div className="field-wrap">
            <label className="field-label">Teléfono</label>
            <div className={`phone-wrap${fieldErrors.telefono ? ' invalid' : ''}`}>
              <span className="phone-prefix">+51</span>
              <input
                className="phone-input"
                type="tel" placeholder="999 999 999" maxLength={11}
                value={form.telefono}
                onChange={set('telefono')}
                onBlur={blurTelefono}
                disabled={loading}
              />
            </div>
            {fieldErrors.telefono && (
              <div className="field-bubble" role="alert">
                <span className="field-bubble-dot" />
                {fieldErrors.telefono}
              </div>
            )}
          </div>

          <div className="field-wrap">
            <label className="field-label">Contraseña</label>
            <input
              className={`input-field${fieldErrors.password ? ' invalid' : ''}`}
              type="password" placeholder="Mínimo 8 caracteres"
              value={form.password} onChange={set('password')} onBlur={blurPassword} disabled={loading}
            />
            {fieldErrors.password && (
              <div className="field-bubble" role="alert">
                <span className="field-bubble-dot" />
                {fieldErrors.password}
              </div>
            )}
            {form.password && (
              <div className="pwd-reqs">
                {[
                  { ok: form.password.length >= 8,                                          txt: 'Mínimo 8 caracteres' },
                  { ok: /[A-Z]/.test(form.password),                                        txt: 'Al menos una mayúscula' },
                  { ok: /[a-z]/.test(form.password),                                        txt: 'Al menos una minúscula' },
                  { ok: /\d/.test(form.password),                                           txt: 'Al menos un número' },
                  { ok: /[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?]/.test(form.password),        txt: 'Al menos un carácter especial' },
                ].map(({ ok, txt }) => (
                  <div key={txt} className={`pwd-req${ok ? ' ok' : ''}`}>
                    <span className="pwd-req-dot" />
                    {txt}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="field-wrap">
            <label className="role-label">Rol</label>
            <div className="role-grid">
              {ROLES.map(({ key, label, desc }) => (
                <button
                  key={key}
                  className={`role-btn${selectedRole === key ? ' selected' : ''}`}
                  onClick={() => setSelectedRole(key)}
                  disabled={loading}
                >
                  <span className="role-name">{label}</span>
                  <span className="role-desc">{desc}</span>
                </button>
              ))}
            </div>

            <div className={`extra-field${selectedRole === 'medico' ? ' visible' : ''}`}>
              <label className="field-label">Número de CMP</label>
              <input className="input-field" type="text" placeholder="Ej. 123456" maxLength={10}
                value={form.cmp} onChange={set('cmp')} disabled={loading} />
              <span className="extra-hint">Colegio Médico del Perú — se usará para validar tu cuenta</span>
            </div>

            <div className={`extra-field${selectedRole === 'investigador' ? ' visible' : ''}`}>
              <label className="field-label">Código institucional</label>
              <input className="input-field" type="text" placeholder="Ej. UPCH-2024-001"
                value={form.codigoInstitucional} onChange={set('codigoInstitucional')} disabled={loading} />
              <span className="extra-hint">Código asignado por tu institución de investigación</span>
            </div>

            {roleData?.type === 'instant' && (
              <div className="notice notice-instant">
                Tu cuenta se activará de inmediato al registrarte.
              </div>
            )}
            {roleData?.type === 'pending' && (
              <div className="notice notice-pending">
                Tu solicitud quedará <strong>pendiente de aprobación</strong>. Un administrador deberá validar tu cuenta antes de que puedas iniciar sesión.
              </div>
            )}
          </div>

          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
          <div className="link-row">
            ¿Ya tienes cuenta? <a href="/login">Inicia sesión</a>
          </div>
        </div>
      </div>
    </>
  )
}
