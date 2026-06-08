import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useEscLogout } from '../../hooks/useEscLogout'
import api from '../../api/client'

// Campos genéricos — nombre/dni/telefono/edad se renderizan aparte con validación especial
const CAMPOS = [
  { key: 'medicacion',         label: 'Medicación',         type: 'text' },
  { key: 'dosis',              label: 'Dosis',              type: 'text' },
  { key: 'diagnostico',        label: 'Diagnóstico',        type: 'text' },
  { key: 'tiempo_diagnostico', label: 'Tiempo diagnóstico', type: 'text' },
  { key: 'estado',             label: 'Estado',             type: 'select', options: ['Activo','Inactivo'] },
  { key: 'comorbilidades',     label: 'Comorbilidades',     type: 'textarea' },
]

const stripPrefix = (tel) => (tel || '').replace(/^\+51\s?/, '')

const VACIO = {
  nombre:'', edad:'', dni:'', telefono:'',
  medicacion:'', dosis:'', diagnostico:'',
  tiempo_diagnostico:'', estado:'Activo', comorbilidades:''
}

export default function FichaPaciente() {
  const { patientId } = useParams()
  const location      = useLocation()
  const navigate      = useNavigate()
  useEscLogout()

  const esNuevo = !patientId
  const paciente = esNuevo ? null : (location.state?.paciente ?? null)

  // If not new and no patient data in navigation state (e.g. page refresh), go back to list
  useEffect(() => {
    if (!esNuevo && !paciente) navigate('/medico', { replace: true })
  }, [])

  const initForm = paciente ? { ...paciente, telefono: stripPrefix(paciente.telefono) } : VACIO
  const [form, setForm] = useState(initForm)
  const [editando, setEditando] = useState(esNuevo)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [exito,     setExito]     = useState('')
  const [fieldErrors, setFieldErrors] = useState({ nombre: '', dni: '', telefono: '', edad: '' })

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
    if (!val.trim())                    return 'Este campo es obligatorio.'
    if (!/^\d{8}$/.test(val.trim()))    return 'El DNI debe tener exactamente 8 dígitos numéricos.'
    return ''
  }
  function validateTelefono(val) {
    const digits = val.replace(/\s+/g, '')
    if (!digits)                        return 'Este campo es obligatorio.'
    if (!/^\d{9}$/.test(digits))        return 'Ingresa los 9 dígitos de tu número (sin el +51).'
    return ''
  }
  function validateEdad(val) {
    const s = String(val).trim()
    if (!s) return ''
    const n = Number(s)
    if (!Number.isInteger(n) || n < 0 || n > 120) return 'Ingresa una edad válida entre 0 y 120 años (número entero).'
    return ''
  }
  function blurEdad() { setFieldErrors(p => ({ ...p, edad: validateEdad(form.edad) })) }
  function blurNombre() {
    const formatted = toTitleCase(form.nombre)
    setForm(p => ({ ...p, nombre: formatted }))
    setFieldErrors(p => ({ ...p, nombre: validateNombre(formatted) }))
  }
  function blurDni()      { setFieldErrors(p => ({ ...p, dni:      validateDni(form.dni) })) }
  function blurTelefono() { setFieldErrors(p => ({ ...p, telefono: validateTelefono(form.telefono) })) }
  function setField(field) {
    return (e) => {
      setForm(p => ({ ...p, [field]: e.target.value }))
      if (fieldErrors[field]) setFieldErrors(p => ({ ...p, [field]: '' }))
    }
  }

  const initials = (nombre) => {
    if (!nombre) return '?'
    const p = nombre.trim().split(' ')
    return p.length >= 2 ? p[0][0] + p[1][0] : nombre.substring(0, 2)
  }

  async function guardar() {
    setError('')
    setExito('')
    const errNombre   = validateNombre(form.nombre)
    const errDni      = validateDni(form.dni)
    const errTelefono = validateTelefono(form.telefono)
    const errEdad     = validateEdad(form.edad)
    setFieldErrors({ nombre: errNombre, dni: errDni, telefono: errTelefono, edad: errEdad })
    if (errNombre || errDni || errTelefono || errEdad) return
    setLoading(true)
    try {
      const payload = { ...form, telefono: '+51' + form.telefono.replace(/\s+/g, '') }
      if (esNuevo) {
        await api.post('/patients', payload)
        navigate('/medico', { replace: true })
      } else {
        await api.put(`/patients/${paciente.patient_id}`, payload)
        setExito('Actualización exitosa')
        setEditando(false)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-size:14px;color:var(--c-navy);background:var(--c-bg-shell);}
        .ficha-page{min-height:100vh;background:var(--c-bg-shell);}
        .ficha-topbar{display:flex;align-items:center;justify-content:space-between;padding:14px 28px;background:#fff;border-bottom:1px solid var(--c-border);}
        .ficha-topbar-title{font-size:15px;font-weight:600;color:var(--c-navy);letter-spacing:0.03em;text-transform:uppercase;}
        .breadcrumb{display:flex;align-items:center;gap:8px;padding:11px 28px;background:#fff;border-bottom:1px solid var(--c-border);}
        .bc-link{font-size:13px;color:var(--c-blue);cursor:pointer;background:none;border:none;font-family:inherit;padding:0;}
        .bc-link:hover{text-decoration:underline;}
        .bc-sep{font-size:13px;color:var(--c-border-input);}
        .bc-cur{font-size:13px;color:var(--c-text-sec);}
        .ficha-body{display:flex;gap:18px;padding:20px 28px;}
        .ficha-panel{width:240px;flex-shrink:0;}
        .ficha-card{background:#fff;border:1px solid var(--c-border);border-radius:12px;overflow:hidden;}
        .ficha-header{background:var(--c-navy);padding:16px 18px;display:flex;align-items:center;gap:12px;}
        .ficha-avatar{width:40px;height:40px;border-radius:50%;background:var(--c-blue);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;color:#fff;flex-shrink:0;text-transform:uppercase;}
        .ficha-name{font-size:14px;font-weight:600;color:#fff;}
        .ficha-code{font-size:11px;color:var(--c-blue-400);margin-top:2px;}
        .ficha-info{padding:16px 18px;}
        .ficha-row{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px;}
        .ficha-label{font-size:var(--t-label);text-transform:uppercase;letter-spacing:0.05em;color:var(--c-text-muted);}
        .ficha-val{font-size:13px;color:var(--c-navy);text-align:right;}
        .ficha-div{height:1px;background:var(--c-border-sub);margin:10px 0;}
        .estado-activo{color:var(--c-ok);font-weight:600;}
        .estado-inactivo{color:var(--c-danger-text);font-weight:600;}
        .form-section{flex:1;background:#fff;border:1px solid var(--c-border);border-radius:12px;padding:24px 28px;}
        .form-title{font-size:14px;font-weight:600;color:var(--c-navy);margin-bottom:20px;padding-bottom:12px;border-bottom:1px solid var(--c-border-sub);}
        .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px 24px;}
        .form-group{display:flex;flex-direction:column;gap:6px;}
        .form-group.full{grid-column:1/-1;}
        .form-label{font-size:var(--t-label);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--c-text-sec);}
        .form-input{padding:10px 12px;font-size:13px;border:1px solid var(--c-border-input);border-radius:8px;background:var(--c-input-bg);color:var(--c-navy);outline:none;font-family:inherit;}
        .form-input:focus{border-color:var(--c-blue);background:#fff;}
        .form-input:disabled{background:var(--c-surface-alt);color:var(--c-text-muted);cursor:not-allowed;}
        .form-select{padding:10px 12px;font-size:13px;border:1px solid var(--c-border-input);border-radius:8px;background:var(--c-input-bg);color:var(--c-navy);outline:none;font-family:inherit;cursor:pointer;}
        .form-select:disabled{background:var(--c-surface-alt);color:var(--c-text-muted);cursor:not-allowed;}
        .form-textarea{padding:10px 12px;font-size:13px;border:1px solid var(--c-border-input);border-radius:8px;background:var(--c-input-bg);color:var(--c-navy);outline:none;font-family:inherit;resize:vertical;min-height:80px;line-height:1.6;}
        .form-textarea:focus{border-color:var(--c-blue);background:#fff;}
        .form-textarea:disabled{background:var(--c-surface-alt);color:var(--c-text-muted);cursor:not-allowed;}
        .form-actions{display:flex;gap:10px;margin-top:24px;padding-top:16px;border-top:1px solid var(--c-border-sub);}
        .msg-ok{padding:10px 14px;background:var(--c-ok-bg);border:1px solid #A8DFC9;border-radius:8px;color:#085041;font-size:13px;margin-bottom:16px;}
        .msg-err{padding:10px 14px;background:#fff0f0;border:1px solid #fcc;border-radius:8px;color:#c00;font-size:13px;margin-bottom:16px;}
        .form-input.invalid{border-color:var(--c-danger) !important;background:#FFF8F8;}
        .field-bubble{display:flex;align-items:center;gap:5px;margin-top:5px;padding:5px 10px;background:#FFF0F0;border:0.5px solid #F5B8B8;border-radius:6px;font-size:11px;color:#B91C1C;animation:bubbleIn .18s ease;}
        .field-bubble-dot{width:6px;height:6px;border-radius:50%;background:var(--c-danger);flex-shrink:0;}
        @keyframes bubbleIn{from{opacity:0;transform:translateY(-4px);}to{opacity:1;transform:translateY(0);}}
        .phone-wrap{display:flex;border:1px solid var(--c-border-input);border-radius:8px;background:var(--c-input-bg);overflow:hidden;transition:border-color .15s;}
        .phone-wrap:focus-within{border-color:var(--c-blue);background:#fff;}
        .phone-wrap.invalid{border-color:var(--c-danger) !important;background:#FFF8F8;}
        .phone-wrap.disabled{background:var(--c-surface-alt);}
        .phone-prefix{padding:10px 10px 10px 12px;font-size:13px;color:var(--c-text-sec);font-weight:500;white-space:nowrap;user-select:none;}
        .phone-input{flex:1;padding:10px 12px 10px 4px;font-size:13px;border:none;background:transparent;color:var(--c-navy);outline:none;font-family:inherit;}
        .phone-input:disabled{color:var(--c-text-muted);cursor:not-allowed;}
        .user-bubble{display:flex;align-items:flex-start;gap:10px;padding:12px 16px;border-radius:10px;font-size:12px;line-height:1.5;margin-bottom:14px;animation:bubbleIn .3s ease;}
        .user-bubble-ok{background:#EAF6F1;border:1px solid #7ECFB0;color:#054E38;}
        .user-bubble-info{background:#EBF3FD;border:1px solid #93C3F0;color:#0C3C6E;}
        .bubble-icon{font-size:16px;flex-shrink:0;margin-top:1px;}
        .bubble-title{font-weight:600;margin-bottom:2px;}
        @keyframes bubbleIn{from{opacity:0;transform:translateY(-6px);}to{opacity:1;transform:translateY(0);}}
        @media(max-width:600px){
          .ficha-topbar{padding:11px 16px;}
          .breadcrumb{padding:9px 16px;}
          .ficha-body{flex-direction:column;padding:14px 14px;gap:14px;}
          .ficha-panel{width:100%;}
          .form-section{padding:20px 18px;}
          .form-grid{grid-template-columns:1fr;}
        }
      `}</style>

      <div className="ficha-page">
        <div className="ficha-topbar">
          <div className="ficha-topbar-title">
            {esNuevo ? 'Nuevo paciente' : 'Ficha del paciente'}
          </div>
          <button className="btn btn-secondary" onClick={() => navigate('/medico')}>
            ← Volver a pacientes
          </button>
        </div>

        <div className="breadcrumb">
          <button className="bc-link" onClick={() => navigate('/medico')}>Mis pacientes</button>
          <span className="bc-sep">/</span>
          <span className="bc-cur">
            {esNuevo ? 'Nuevo paciente' : `${form.nombre} · ${paciente.patient_id}`}
          </span>
        </div>

        <div className="ficha-body">
          <div className="ficha-panel">
            <div className="ficha-card">
              <div className="ficha-header">
                <div className="ficha-avatar">{initials(form.nombre)}</div>
                <div>
                  <div className="ficha-name">{form.nombre || 'Nuevo paciente'}</div>
                  <div className="ficha-code">
                    {esNuevo ? 'ID asignado al guardar' : paciente.patient_id}
                  </div>
                </div>
              </div>
              <div className="ficha-info">
                <div className="ficha-row">
                  <span className="ficha-label">Edad</span>
                  <span className="ficha-val">{form.edad ? `${form.edad} años` : '—'}</span>
                </div>
                <div className="ficha-row">
                  <span className="ficha-label">DNI</span>
                  <span className="ficha-val">{form.dni || '—'}</span>
                </div>
                <div className="ficha-div"></div>
                <div className="ficha-row">
                  <span className="ficha-label">Medicación</span>
                  <span className="ficha-val">{form.medicacion || '—'}</span>
                </div>
                <div className="ficha-row">
                  <span className="ficha-label">Dosis</span>
                  <span className="ficha-val">{form.dosis || '—'}</span>
                </div>
                <div className="ficha-div"></div>
                <div className="ficha-row">
                  <span className="ficha-label">Estado</span>
                  <span className={form.estado === 'Activo' ? 'estado-activo' : 'estado-inactivo'}>
                    {form.estado}
                  </span>
                </div>
                {!esNuevo && !editando && (
  <>
    <button className="btn btn-secondary" style={{ width: '100%', marginTop: 12 }} onClick={() => setEditando(true)}>
      Editar ficha
    </button>
    <button
      className="btn btn-tonal"
      style={{ width: '100%', marginTop: 8 }}
      onClick={() => navigate(`/medico/paciente/${paciente.patient_id}/sesiones`, { state: { paciente } })}
    >
      Ver sesiones →
    </button>
  </>
)}
              </div>
            </div>
          </div>

          <div className="form-section">
            {exito && <div className="msg-ok">{exito}</div>}
            {error && <div className="msg-err">{error}</div>}

            <div className="form-title">
              {esNuevo ? 'Datos del nuevo paciente' : editando ? 'Editando datos del paciente' : 'Datos del paciente'}
            </div>

            <div className="form-grid">
              {/* Nombre */}
              <div className="form-group">
                <label className="form-label">Nombre completo</label>
                <input
                  className={`form-input${fieldErrors.nombre ? ' invalid' : ''}`}
                  type="text" placeholder="Nombre Apellido"
                  value={form.nombre}
                  disabled={!editando}
                  onChange={setField('nombre')}
                  onBlur={blurNombre}
                />
                {fieldErrors.nombre && (
                  <div className="field-bubble">
                    <span className="field-bubble-dot" />
                    {fieldErrors.nombre}
                  </div>
                )}
              </div>

              {/* DNI */}
              <div className="form-group">
                <label className="form-label">DNI</label>
                <input
                  className={`form-input${fieldErrors.dni ? ' invalid' : ''}`}
                  type="text" placeholder="12345678" maxLength={8}
                  value={form.dni}
                  disabled={!editando}
                  onChange={setField('dni')}
                  onBlur={blurDni}
                />
                {fieldErrors.dni && (
                  <div className="field-bubble">
                    <span className="field-bubble-dot" />
                    {fieldErrors.dni}
                  </div>
                )}
              </div>

              {/* Teléfono */}
              <div className="form-group">
                <label className="form-label">Teléfono</label>
                <div className={`phone-wrap${fieldErrors.telefono ? ' invalid' : ''}${!editando ? ' disabled' : ''}`}>
                  <span className="phone-prefix">+51</span>
                  <input
                    className="phone-input"
                    type="tel" placeholder="999 999 999" maxLength={11}
                    value={form.telefono}
                    disabled={!editando}
                    onChange={setField('telefono')}
                    onBlur={blurTelefono}
                  />
                </div>
                {fieldErrors.telefono && (
                  <div className="field-bubble">
                    <span className="field-bubble-dot" />
                    {fieldErrors.telefono}
                  </div>
                )}
              </div>

              {/* Edad */}
              <div className="form-group">
                <label className="form-label">Edad</label>
                <input
                  className={`form-input${fieldErrors.edad ? ' invalid' : ''}`}
                  type="number" placeholder="0 – 120" min={0} max={120} step={1}
                  value={form.edad}
                  disabled={!editando}
                  onChange={setField('edad')}
                  onBlur={blurEdad}
                />
                {fieldErrors.edad && (
                  <div className="field-bubble">
                    <span className="field-bubble-dot" />
                    {fieldErrors.edad}
                  </div>
                )}
              </div>

              {CAMPOS.map(campo => (
                <div
                  key={campo.key}
                  className={`form-group ${campo.type === 'textarea' ? 'full' : ''}`}
                >
                  <label className="form-label">{campo.label}</label>
                  {campo.type === 'textarea' ? (
                    <textarea
                      className="form-textarea"
                      value={form[campo.key]}
                      disabled={!editando}
                      onChange={e => setForm({...form, [campo.key]: e.target.value})}
                    />
                  ) : campo.type === 'select' ? (
                    <select
                      className="form-select"
                      value={form[campo.key]}
                      disabled={!editando}
                      onChange={e => setForm({...form, [campo.key]: e.target.value})}
                    >
                      {campo.options.map(op => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="form-input"
                      type={campo.type}
                      value={form[campo.key]}
                      disabled={!editando}
                      onChange={e => setForm({...form, [campo.key]: e.target.value})}
                    />
                  )}
                </div>
              ))}
            </div>

            {editando && (
              <div className="form-actions">
                <button
                  className="btn btn-primary"
                  onClick={guardar}
                  disabled={loading}
                >
                  {loading ? 'Guardando...' : esNuevo ? 'Crear paciente' : 'Guardar cambios'}
                </button>
                {!esNuevo && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => { setEditando(false); setForm({ ...paciente, telefono: stripPrefix(paciente.telefono) }); setFieldErrors({ nombre: '', dni: '', telefono: '', edad: '' }); setError(''); setExito('') }}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}