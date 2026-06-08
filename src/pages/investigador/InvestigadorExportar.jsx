import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import api from '../../api/client'

export default function InvestigadorExportar() {
  const { setTitle } = useOutletContext()
  const today = new Date().toISOString().split('T')[0]

  const [modulo,      setModulo]      = useState('')
  const [startDate,   setStartDate]   = useState('2025-01-01')
  const [endDate,     setEndDate]     = useState(today)
  const [soloAlertas, setSoloAlertas] = useState(false)
  const [loading,     setLoading]     = useState(false)

  useEffect(() => { setTitle('Exportar CSV') }, [setTitle])

  async function doExport() {
    setLoading(true)
    try {
      const params = { start_date: startDate, end_date: endDate }
      if (modulo)      params.modulo       = modulo
      if (soloAlertas) params.solo_alertas = 'true'

      const res = await api.get('/investigador/exportar', {
        params,
        responseType: 'blob',
      })

      const url  = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
      const link = document.createElement('a')
      link.href  = url
      link.download = `neurotrack_export_${today}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Error al exportar. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-panel">
      <div className="anon-banner anon-banner-i">
        <div className="anon-dot" />
        El CSV exportado no contiene nombre, DNI ni timestamps exactos — solo métricas y códigos PAT-XXXX.
      </div>
      <div className="content-wrap" style={{ alignItems: 'flex-start' }}>
        <div className="content-main" style={{ overflow: 'visible', maxWidth: 560 }}>
          <div className="export-card">
            <div className="export-title">Exportar datos de sesiones</div>
            <div className="export-sub">
              Selecciona los filtros y descarga el CSV anonimizado de eventos motores.
            </div>
            <div className="export-grid">
              <div className="export-field">
                <label className="export-field-label">Módulo</label>
                <select className="export-select" value={modulo} onChange={e => setModulo(e.target.value)}>
                  <option value="">Todos los módulos</option>
                  <option value="tremor">Temblor</option>
                  <option value="fog">FOG</option>
                  <option value="bradykinesia">Bradicinesia</option>
                </select>
              </div>
              <div className="export-field">
                <label className="export-field-label">Desde</label>
                <input className="export-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="export-field">
                <label className="export-field-label">Hasta</label>
                <input className="export-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
              <div className="export-field">
                <label className="export-field-label">Solo con alertas</label>
                <select className="export-select" value={soloAlertas ? 'true' : ''} onChange={e => setSoloAlertas(e.target.value === 'true')}>
                  <option value="">Todos los eventos</option>
                  <option value="true">Solo alertas</option>
                </select>
              </div>
            </div>
            <div className="export-info">
              Campos incluidos: <strong>PAT-XXXX · módulo · timestamp relativo · métricas del evento · alert_flag</strong><br />
              Campos excluidos: nombre completo · DNI · edad · timestamp exacto · IP
            </div>
            <button className="btn-export" onClick={doExport} disabled={loading}>
              {loading ? 'Exportando...' : 'Descargar CSV'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
