import { useState, useEffect, useRef, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import api from '../../api/client'

// ── Configuración de polling ──────────────────────────────────────────────────
const POLL_MS   = 2500   // intervalo entre checks
const MAX_POLLS = 120    // 120 × 2.5s = 5 minutos máximo

// ── Mapas de estado del job ───────────────────────────────────────────────────
const STATUS_PCT = { pending: 10, queued: 20, processing: 55, generating: 82, done: 100 }
const STATUS_LABEL = {
  pending:    'En cola — esperando worker disponible...',
  queued:     'En cola — esperando worker disponible...',
  processing: 'Procesando registros de sesiones...',
  generating: 'Generando archivo CSV...',
  done:       'Archivo listo · descarga iniciada',
  error:      'Error en el procesamiento',
}

function pct(status)   { return STATUS_PCT[status]   ?? 5 }
function label(status) { return STATUS_LABEL[status] ?? 'Procesando...' }

// ── Componente principal ──────────────────────────────────────────────────────
export default function InvestigadorExportar() {
  const { setTitle } = useOutletContext()
  const today = new Date().toISOString().split('T')[0]

  // Filtros
  const [modulo,      setModulo]      = useState('')
  const [startDate,   setStartDate]   = useState('2025-01-01')
  const [endDate,     setEndDate]     = useState(today)
  const [soloAlertas, setSoloAlertas] = useState(false)

  // Estado del job: null = inactivo
  const [job,     setJob]     = useState(null) // { jobId, status, downloadUrl, error }
  const [elapsed, setElapsed] = useState(0)

  const pollTimer    = useRef(null)
  const elapsedTimer = useRef(null)
  const startedAt    = useRef(null)

  useEffect(() => { setTitle('Exportar CSV') }, [setTitle])

  // Limpieza al desmontar
  useEffect(() => () => { stopTimers() }, [])

  // Auto-descarga cuando el job termina
  useEffect(() => {
    if (job?.status === 'done' && job?.downloadUrl) {
      const link = document.createElement('a')
      link.href = job.downloadUrl
      link.setAttribute('download', `neurotrack_export_${today}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }, [job?.status, job?.downloadUrl])

  function stopTimers() {
    clearTimeout(pollTimer.current)
    clearInterval(elapsedTimer.current)
  }

  const poll = useCallback(async (jobId, attempt = 0) => {
    if (attempt >= MAX_POLLS) {
      setJob(p => ({ ...p, status: 'error', error: 'Tiempo de espera agotado (5 min). El archivo puede no estar listo.' }))
      stopTimers()
      return
    }
    try {
      const { data } = await api.get(`/investigador/exportar/jobs/${jobId}`)
      setJob(p => ({ ...p, status: data.status, downloadUrl: data.downloadUrl ?? null }))

      if (data.status === 'done' || data.status === 'error') {
        if (data.status === 'error') setJob(p => ({ ...p, error: data.error || 'Error en el servidor.' }))
        stopTimers()
      } else {
        pollTimer.current = setTimeout(() => poll(jobId, attempt + 1), POLL_MS)
      }
    } catch {
      // Error de red — reintenta sin contar como fallo de job
      pollTimer.current = setTimeout(() => poll(jobId, attempt + 1), POLL_MS)
    }
  }, [])

  async function doExport() {
    stopTimers()
    setElapsed(0)
    startedAt.current = Date.now()
    setJob({ jobId: null, status: 'pending', downloadUrl: null, error: null })

    // Contador de tiempo transcurrido
    elapsedTimer.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000))
    }, 1000)

    try {
      const params = { start_date: startDate, end_date: endDate }
      if (modulo)      params.modulo       = modulo
      if (soloAlertas) params.solo_alertas = 'true'

      const { data } = await api.post('/investigador/exportar/jobs', params)
      setJob(p => ({ ...p, jobId: data.jobId, status: data.status || 'pending' }))
      poll(data.jobId)
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'No se pudo iniciar la exportación.'
      setJob({ jobId: null, status: 'error', downloadUrl: null, error: msg })
      stopTimers()
    }
  }

  function reset() {
    stopTimers()
    setJob(null)
    setElapsed(0)
  }

  const isRunning = job && job.status !== 'done' && job.status !== 'error'
  const jobPct    = job ? pct(job.status) : 0

  return (
    <>
      <style>{`
        .export-card{background:#fff;border:1px solid var(--c-border);border-radius:12px;padding:24px 28px;max-width:560px;}
        .export-title{font-size:15px;font-weight:600;color:var(--c-navy);margin-bottom:4px;}
        .export-sub{font-size:12px;color:var(--c-text-sec);margin-bottom:20px;line-height:1.5;}
        .export-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:18px;}
        .export-field{display:flex;flex-direction:column;gap:5px;}
        .export-field-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--c-text-sec);}
        .export-select,.export-input{padding:9px 11px;font-size:13px;border:1px solid var(--c-border-input);border-radius:8px;background:var(--c-input-bg);color:var(--c-navy);outline:none;font-family:inherit;width:100%;}
        .export-select:focus,.export-input:focus{border-color:var(--c-blue);}
        .export-select:disabled,.export-input:disabled{background:var(--c-surface-alt);color:var(--c-text-muted);cursor:not-allowed;}
        .export-info{font-size:11px;color:var(--c-text-muted);background:var(--c-surface-alt);border-radius:8px;padding:10px 12px;margin-bottom:18px;line-height:1.6;}
        .btn-export{width:100%;padding:11px;font-size:13px;font-weight:600;background:var(--c-navy);color:#fff;border:none;border-radius:8px;cursor:pointer;font-family:inherit;transition:background .15s;}
        .btn-export:hover:not(:disabled){background:#1a3a60;}
        .btn-export:disabled{opacity:0.5;cursor:not-allowed;}

        /* ── Job progress panel ── */
        .job-panel{border:1px solid var(--c-border);border-radius:12px;overflow:hidden;margin-top:0;}
        .job-header{padding:14px 18px;background:var(--c-surface-alt);border-bottom:1px solid var(--c-border);display:flex;align-items:center;justify-content:space-between;}
        .job-header-title{font-size:13px;font-weight:600;color:var(--c-navy);}
        .job-elapsed{font-size:11px;color:var(--c-text-muted);font-variant-numeric:tabular-nums;}
        .job-body{padding:20px 18px;display:flex;flex-direction:column;gap:14px;}
        .job-bar-wrap{width:100%;height:8px;background:#E8EDF5;border-radius:4px;overflow:hidden;}
        .job-bar{height:100%;border-radius:4px;background:var(--c-blue);transition:width 0.7s ease;}
        .job-bar.done{background:#2A9E6A;}
        .job-bar.error{background:var(--c-danger);}
        .job-steps{display:flex;gap:0;border:1px solid var(--c-border);border-radius:8px;overflow:hidden;}
        .job-step{flex:1;padding:8px 4px;text-align:center;font-size:10px;font-weight:600;color:var(--c-text-muted);background:var(--c-surface);border-right:1px solid var(--c-border);transition:background .4s,color .4s;text-transform:uppercase;letter-spacing:0.03em;}
        .job-step:last-child{border-right:none;}
        .job-step.active{background:var(--c-blue);color:#fff;}
        .job-step.done-step{background:#EAF6F1;color:#054E38;}
        .job-status-text{font-size:13px;color:var(--c-navy);display:flex;align-items:center;gap:8px;}
        .job-spinner{width:14px;height:14px;border:2px solid #c8d6e5;border-top-color:var(--c-blue);border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0;}
        @keyframes spin{to{transform:rotate(360deg)}}
        .job-done-icon{width:22px;height:22px;border-radius:50%;background:#EAF6F1;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;}
        .job-error-box{padding:10px 14px;background:#FFF0F0;border:1px solid #F5B8B8;border-radius:8px;font-size:12px;color:#B91C1C;line-height:1.5;}
        .job-actions{display:flex;gap:10px;}
        .btn-reset{padding:9px 18px;font-size:13px;font-weight:500;border:1px solid var(--c-border-strong);background:var(--c-surface);color:var(--c-text-sec);border-radius:8px;cursor:pointer;font-family:inherit;transition:background .15s;}
        .btn-reset:hover{background:var(--c-surface-alt);}
        .btn-download-again{padding:9px 18px;font-size:13px;font-weight:600;background:#EAF6F1;border:1px solid #A8DFC9;color:#054E38;border-radius:8px;cursor:pointer;font-family:inherit;transition:background .15s;}
        .btn-download-again:hover{background:#d4f0e6;}
        @media(max-width:600px){.export-grid{grid-template-columns:1fr;}.job-steps{display:none;}}
      `}</style>

      <div className="admin-panel">
        <div className="anon-banner anon-banner-i">
          <div className="anon-dot" />
          El CSV exportado no contiene nombre, DNI ni timestamps exactos — solo métricas y códigos PAT-XXXX.
        </div>

        <div className="content-wrap" style={{ alignItems: 'flex-start' }}>
          <div className="content-main" style={{ overflow: 'visible', maxWidth: 560 }}>

            {/* ── Formulario de filtros ── */}
            <div className="export-card" style={{ marginBottom: job ? 16 : 0 }}>
              <div className="export-title">Exportar datos de sesiones</div>
              <div className="export-sub">
                Selecciona los filtros y genera el CSV anonimizado. La exportación corre en segundo plano y se descarga automáticamente al terminar.
              </div>
              <div className="export-grid">
                <div className="export-field">
                  <label className="export-field-label">Módulo</label>
                  <select className="export-select" value={modulo} onChange={e => setModulo(e.target.value)} disabled={isRunning}>
                    <option value="">Todos los módulos</option>
                    <option value="tremor">Temblor</option>
                    <option value="fog">FOG</option>
                    <option value="bradykinesia">Bradicinesia</option>
                  </select>
                </div>
                <div className="export-field">
                  <label className="export-field-label">Desde</label>
                  <input className="export-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} disabled={isRunning} />
                </div>
                <div className="export-field">
                  <label className="export-field-label">Hasta</label>
                  <input className="export-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} disabled={isRunning} />
                </div>
                <div className="export-field">
                  <label className="export-field-label">Solo con alertas</label>
                  <select className="export-select" value={soloAlertas ? 'true' : ''} onChange={e => setSoloAlertas(e.target.value === 'true')} disabled={isRunning}>
                    <option value="">Todos los eventos</option>
                    <option value="true">Solo alertas</option>
                  </select>
                </div>
              </div>
              <div className="export-info">
                Campos incluidos: <strong>PAT-XXXX · módulo · timestamp relativo · métricas del evento · alert_flag</strong><br />
                Campos excluidos: nombre completo · DNI · edad · timestamp exacto · IP
              </div>
              <button className="btn-export" onClick={doExport} disabled={isRunning || job?.status === 'done'}>
                {isRunning ? 'Exportación en progreso...' : job?.status === 'done' ? 'Exportación completada ✓' : 'Generar y descargar CSV'}
              </button>
            </div>

            {/* ── Panel de progreso del job ── */}
            {job && (
              <div className="job-panel">
                <div className="job-header">
                  <div className="job-header-title">
                    {job.status === 'done'  ? 'Exportación completada' :
                     job.status === 'error' ? 'Error en exportación'   :
                     'Exportación en progreso'}
                  </div>
                  <div className="job-elapsed">
                    {job.status === 'done' || job.status === 'error'
                      ? `${elapsed}s`
                      : `${Math.floor(elapsed / 60).toString().padStart(2,'0')}:${(elapsed % 60).toString().padStart(2,'0')}`}
                  </div>
                </div>

                <div className="job-body">
                  {/* Pasos visuales */}
                  <div className="job-steps">
                    {[
                      { key: 'pending',    label: 'Cola' },
                      { key: 'processing', label: 'Procesando' },
                      { key: 'generating', label: 'Generando' },
                      { key: 'done',       label: 'Listo' },
                    ].map((step, i, arr) => {
                      const order  = ['pending','queued','processing','generating','done']
                      const curIdx = order.indexOf(job.status)
                      const stepIdx = order.indexOf(step.key)
                      const isActive   = step.key === job.status && job.status !== 'done'
                      const isDoneStep = curIdx > stepIdx || job.status === 'done'
                      return (
                        <div key={step.key} className={`job-step${isActive ? ' active' : ''}${isDoneStep ? ' done-step' : ''}`}>
                          {isDoneStep ? '✓ ' : ''}{step.label}
                        </div>
                      )
                    })}
                  </div>

                  {/* Barra de progreso */}
                  <div className="job-bar-wrap">
                    <div
                      className={`job-bar${job.status === 'done' ? ' done' : ''}${job.status === 'error' ? ' error' : ''}`}
                      style={{ width: `${job.status === 'error' ? 100 : jobPct}%` }}
                    />
                  </div>

                  {/* Texto de estado */}
                  {job.status !== 'error' && (
                    <div className="job-status-text">
                      {job.status === 'done'
                        ? <><div className="job-done-icon">✓</div> {label('done')}</>
                        : <><div className="job-spinner" /> {label(job.status)}</>
                      }
                    </div>
                  )}

                  {/* Error */}
                  {job.status === 'error' && (
                    <div className="job-error-box">
                      <strong>Error:</strong> {job.error}
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="job-actions">
                    <button className="btn-reset" onClick={reset}>
                      {job.status === 'done' || job.status === 'error' ? 'Nueva exportación' : 'Cancelar'}
                    </button>
                    {job.status === 'done' && job.downloadUrl && (
                      <a href={job.downloadUrl} download={`neurotrack_export_${today}.csv`}>
                        <button className="btn-download-again">Descargar de nuevo</button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  )
}
