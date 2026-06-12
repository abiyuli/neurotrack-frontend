import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import client from '../../api/client';
import '../../styles/SesionDetalle.css';
import { useEscLogout } from '../../hooks/useEscLogout';

function OnOffChart({ chartData, hasData, title }) {
  if (!hasData) return null;
  return (
    <div style={{ background: '#f0f4f8', border: '1px solid #c8d6e5', borderRadius: '8px', padding: '16px', marginBottom: '20px' }}>
      <h4 style={{ margin: '0 0 4px 0', color: '#0B2545', fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        Comparativa Medicación — {title}
      </h4>
      <p style={{ margin: '0 0 12px 0', fontSize: '11px', color: '#5a6a7a' }}>
        Promedio por estado de medicación. Azul = ON · Naranja = OFF
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="metric" tick={{ fontSize: 11, fill: '#333' }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip formatter={(v, name) => [`${v}`, `Medicación ${name}`]} />
          <Legend formatter={(v) => `Medicación ${v}`} />
          <Bar dataKey="ON"  fill="#1a5276" radius={[3,3,0,0]} name="ON" />
          <Bar dataKey="OFF" fill="#e67e22" radius={[3,3,0,0]} name="OFF" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function SesionDetalle() {
  const { patientId: routePatientId } = useParams()
  const location  = useLocation()
  const navigate  = useNavigate()
  useEscLogout()

  const paciente  = location.state?.paciente ?? null
  const patientId = paciente?.patient_id ?? routePatientId
  const onVolver  = () => navigate(-1)
  const [activeTab, setActiveTab] = useState('tremor');
  const [bradySubTab, setBradySubTab] = useState(null);
  const [tremorSubTab, setTremorSubTab] = useState(null);
  const [fogSubTab, setFogSubTab] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    start: '2025-01-01',
    end: new Date().toISOString().split('T')[0],
  });

  const tabsRef        = useRef(null)
  const tremorPanelRef = useRef(null)
  const fogPanelRef    = useRef(null)
  const exerciseRef    = useRef(null)

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [])
  useEffect(() => { tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, [activeTab])
  useEffect(() => { if (tremorSubTab) tremorPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, [tremorSubTab])
  useEffect(() => { if (fogSubTab)    fogPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, [fogSubTab])
  useEffect(() => { if (bradySubTab)  exerciseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, [bradySubTab])

  useEffect(() => {
    if (!isPrinting) return
    const reset = () => setIsPrinting(false)
    window.addEventListener('afterprint', reset, { once: true })
    const t = setTimeout(() => window.print(), 350)
    return () => {
      clearTimeout(t)
      window.removeEventListener('afterprint', reset)
    }
  }, [isPrinting])

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        start_date: dateRange.start,
        end_date: dateRange.end,
      });

      const response = await client.get(
        `/sessions/${patientId}?${params.toString()}`
      );

      setSessionData(response.data);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('No se pudieron cargar las sesiones. Intenta más tarde.');
    } finally {
      setLoading(false);
    }
  }, [patientId, dateRange]);

  useEffect(() => {
    if (patientId) fetchSessions();
  }, [patientId, fetchSessions]);

  if (loading) {
    return (
      <div className="session-container">
        <div className="loading">Cargando sesiones...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="session-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="session-container">
        <div className="no-data">No hay sesiones disponibles para este paciente.</div>
      </div>
    );
  }

  const renderTremorChart = () => {
    const data = sessionData.tremor || [];
    if (data.length === 0) {
      return <p className="no-data-tab">No hay datos de Tremor disponibles.</p>;
    }

    const formatTime = (ts) =>
      new Date(ts).toLocaleString('es-PE', {
        timeZone: 'America/Lima',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

    const clasificationLabel = (cls) => {
      if (!cls || cls === 'normal') return '✅ Normal';
      // Clinical type taxonomy (firmware ML output)
      if (cls === 'rest')     return '🔴 Temblor de Reposo';
      if (cls === 'essential') return '🟠 Temblor Esencial';
      // Severity taxonomy (DynamoDB severity field)
      if (cls === 'leve')     return '🟡 Temblor Leve';
      if (cls === 'moderado') return '🟠 Temblor Moderado';
      if (cls === 'severo')   return '🔴 Temblor Severo';
      return cls;
    };

    // RF-TREM-03: aceleración triaxial
    const accelData = data.map((event) => ({
      timestamp: formatTime(event.timestamp),
      accel_x: parseFloat(event.accel?.x ?? event.accel_x) || 0,
      accel_y: parseFloat(event.accel?.y ?? event.accel_y) || 0,
      accel_z: parseFloat(event.accel?.z ?? event.accel_z) || 0,
    }));

    // RF-TREM-04 + RF-TREM-05: frecuencia y amplitud
    const freqAmpData = data.map((event) => ({
      timestamp: formatTime(event.timestamp),
      frequency: parseFloat(event.frequency ?? event.tremor_frequency) || 0,
      amplitude: parseFloat(event.amplitude ?? event.tremor_amplitude) || 0,
    }));

    // Estadísticas resumen
    const avgFreq = (freqAmpData.reduce((s, d) => s + d.frequency, 0) / freqAmpData.length).toFixed(2);
    const avgAmp  = (freqAmpData.reduce((s, d) => s + d.amplitude,  0) / freqAmpData.length).toFixed(3);
    const classCount = data.reduce((acc, e) => {
      const c = e.severity ?? e.tremor_class ?? 'normal';
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {});
    const dominantClass = Object.entries(classCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'normal';

    const graficasTremor = [
      { key: 'accel', label: '📡 Aceleración Triaxial' },
      { key: 'freq',  label: '📈 Frecuencia' },
      { key: 'amp',   label: '📉 Amplitud' },
    ];

    return (
      <div className="chart-wrapper">

        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div className="stat-card">
            <span className="stat-label">Registros totales</span>
            <span className="stat-value">{data.length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Frecuencia promedio</span>
            <span className="stat-value">{avgFreq} Hz</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Amplitud promedio</span>
            <span className="stat-value">{avgAmp} m/s²</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Clasificación predominante</span>
            <span className="stat-value">{clasificationLabel(dominantClass)}</span>
          </div>
        </div>

        <div className="data-table data-table--scroll" style={{ marginBottom: '28px' }}>
          <h3>📋 Historial de Registros de Temblor</h3>
          <table>
            <thead>
              <tr>
                <th>Hora</th>
                <th>Acel. X (m/s²)</th>
                <th>Acel. Y (m/s²)</th>
                <th>Acel. Z (m/s²)</th>
                <th>Frecuencia (Hz)</th>
                <th>Amplitud (m/s²)</th>
                <th>Clasificación</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 20).map((event, idx) => {
                const cls = event.severity ?? event.tremor_class ?? 'normal';
                return (
                  <tr key={idx}>
                    <td>{formatTime(event.timestamp)}</td>
                    <td>{(parseFloat(event.accel?.x ?? event.accel_x) || 0).toFixed(3)}</td>
                    <td>{(parseFloat(event.accel?.y ?? event.accel_y) || 0).toFixed(3)}</td>
                    <td>{(parseFloat(event.accel?.z ?? event.accel_z) || 0).toFixed(3)}</td>
                    <td>{(parseFloat(event.frequency ?? event.tremor_frequency) || 0).toFixed(2)}</td>
                    <td>{(parseFloat(event.amplitude ?? event.tremor_amplitude) || 0).toFixed(3)}</td>
                    <td>
                      <span className={`prediction-badge ${cls}`}>
                        {clasificationLabel(cls)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="no-print" style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {graficasTremor.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTremorSubTab(tremorSubTab === key ? null : key)}
              className={`brady-exercise-btn ${tremorSubTab === key ? 'active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div ref={tremorPanelRef} />
        {(tremorSubTab === 'accel' || isPrinting) && (
          <div className="brady-exercise-panel">
            <h3>📡 Aceleración Triaxial (Sensor IMU — ESP32-C6)</h3>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
              Valores de aceleración en los ejes X, Y y Z capturados durante la sesión
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={accelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis label={{ value: 'm/s²', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="accel_x" stroke="#FF6B6B" name="Eje X" isAnimationActive={false} dot={false} />
                <Line type="monotone" dataKey="accel_y" stroke="#4ECDC4" name="Eje Y" isAnimationActive={false} dot={false} />
                <Line type="monotone" dataKey="accel_z" stroke="#572364" name="Eje Z" isAnimationActive={false} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {(tremorSubTab === 'freq' || isPrinting) && (
          <div className="brady-exercise-panel">
            <h3>📈 Frecuencia del Temblor</h3>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              Frecuencia detectada en Hz a lo largo del tiempo
            </p>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', fontSize: '11px' }}>
              <span style={{ background: '#d4edda', color: '#155724', padding: '2px 8px', borderRadius: '4px' }}>Normal &lt; 3 Hz</span>
              <span style={{ background: '#fff3cd', color: '#856404', padding: '2px 8px', borderRadius: '4px' }}>T. Reposo 3–6 Hz</span>
              <span style={{ background: '#f8d7da', color: '#721c24', padding: '2px 8px', borderRadius: '4px' }}>T. Esencial &gt; 6 Hz</span>
            </div>
            <ResponsiveContainer width="100%" height={270}>
              <LineChart data={freqAmpData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis label={{ value: 'Hz', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(v) => `${Number(v).toFixed(2)} Hz`} />
                <Legend />
                <ReferenceArea y1={0} y2={3}  fill="#d4edda" fillOpacity={0.25} />
                <ReferenceArea y1={3} y2={6}  fill="#fff3cd" fillOpacity={0.35} />
                <ReferenceArea y1={6} y2={20} fill="#f8d7da" fillOpacity={0.30} />
                <ReferenceLine y={3} stroke="#F39C12" strokeDasharray="5 4" label={{ value: 'Inicio T. Reposo',  position: 'insideTopRight', fontSize: 10, fill: '#856404' }} />
                <ReferenceLine y={6} stroke="#E74C3C" strokeDasharray="5 4" label={{ value: 'Inicio T. Esencial', position: 'insideTopRight', fontSize: 10, fill: '#721c24' }} />
                <Line type="monotone" dataKey="frequency" stroke="#E67E22" name="Frecuencia (Hz)" isAnimationActive={false} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {(tremorSubTab === 'amp' || isPrinting) && (
          <div className="brady-exercise-panel">
            <h3>📉 Amplitud del Temblor</h3>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              Amplitud del temblor detectada a lo largo del tiempo
            </p>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', fontSize: '11px' }}>
              <span style={{ background: '#d4edda', color: '#155724', padding: '2px 8px', borderRadius: '4px' }}>Normal &lt; 0.5 m/s²</span>
              <span style={{ background: '#fff3cd', color: '#856404', padding: '2px 8px', borderRadius: '4px' }}>Leve 0.5–1.0 m/s²</span>
              <span style={{ background: '#f8d7da', color: '#721c24', padding: '2px 8px', borderRadius: '4px' }}>Moderado &gt; 1.0 m/s²</span>
            </div>
            <ResponsiveContainer width="100%" height={270}>
              <LineChart data={freqAmpData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis label={{ value: 'm/s²', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(v) => `${Number(v).toFixed(3)} m/s²`} />
                <Legend />
                <ReferenceArea y1={0}   y2={0.5} fill="#d4edda" fillOpacity={0.25} />
                <ReferenceArea y1={0.5} y2={1.0} fill="#fff3cd" fillOpacity={0.35} />
                <ReferenceArea y1={1.0} y2={10}  fill="#f8d7da" fillOpacity={0.30} />
                <ReferenceLine y={0.5} stroke="#F39C12" strokeDasharray="5 4" label={{ value: 'Umbral leve',     position: 'insideTopRight', fontSize: 10, fill: '#856404' }} />
                <ReferenceLine y={1.0} stroke="#E74C3C" strokeDasharray="5 4" label={{ value: 'Umbral moderado', position: 'insideTopRight', fontSize: 10, fill: '#721c24' }} />
                <Line type="monotone" dataKey="amplitude" stroke="#8E44AD" name="Amplitud" isAnimationActive={false} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>
    );
  };

  const renderFOGChart = () => {
    const data = sessionData.fog || [];
    if (data.length === 0) {
      return <p className="no-data-tab">No hay datos de FOG disponibles.</p>;
    }

    const accelData = data.map((event) => ({
      timestamp: new Date(event.timestamp).toLocaleString('es-PE', {
        timeZone: 'America/Lima',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      accel_x: parseFloat(event.accel?.x || 0),
      accel_y: parseFloat(event.accel?.y || 0),
      accel_z: parseFloat(event.accel?.z || 0),
    }));

    const fogData = data.map((event) => ({
      timestamp: new Date(event.timestamp).toLocaleString('es-PE', {
        timeZone: 'America/Lima',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      fog_probability: parseFloat(event.fog_probability) || 0,
      prediction: event.prediction || 'normal',
    }));

    const graficasFOG = [
      { key: 'accel', label: '📊 Aceleración Triaxial' },
      { key: 'prob',  label: '🚫 Probabilidad FOG' },
    ];

    return (
      <div className="chart-wrapper">

        <div className="data-table data-table--scroll" style={{ marginBottom: '28px' }}>
          <h3>📋 Detalle de Eventos FOG</h3>
          <table>
            <thead>
              <tr>
                <th>Hora</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Duración (s)</th>
                <th>Probabilidad</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 15).map((event, idx) => (
                <tr key={idx}>
                  <td>{new Date(event.timestamp).toLocaleString('es-PE', {
                    timeZone: 'America/Lima',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}</td>
                  <td>{event.event_start > 0 ? new Date(event.event_start).toLocaleTimeString('es-PE') : '—'}</td>
                  <td>{event.event_end > 0 ? new Date(event.event_end).toLocaleTimeString('es-PE') : '—'}</td>
                  <td>{event.duration_ms ? (event.duration_ms / 1000).toFixed(1) : '0'}</td>
                  <td>{(parseFloat(event.fog_probability) || 0).toFixed(2)}</td>
                  <td>
                    <span className={`prediction-badge ${event.prediction}`}>
                      {event.prediction === 'freeze' || event.prediction === 'Freezing' ? '🚫 Congelamiento' : '✅ Normal'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="no-print" style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {graficasFOG.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFogSubTab(fogSubTab === key ? null : key)}
              className={`brady-exercise-btn ${fogSubTab === key ? 'active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div ref={fogPanelRef} />
        {(fogSubTab === 'accel' || isPrinting) && (
          <div className="brady-exercise-panel">
            <h3>📊 Datos Crudos de Aceleración (Triaxial)</h3>
            <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
              Aceleración en m/s² capturada por sensores IMU en tobillo, muslo y cadera
            </p>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={accelData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis label={{ value: 'm/s²', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="accel_x" stroke="#FF6B6B" name="Eje X" isAnimationActive={false} dot={false} />
                <Line type="monotone" dataKey="accel_y" stroke="#4ECDC4" name="Eje Y" isAnimationActive={false} dot={false} />
                <Line type="monotone" dataKey="accel_z" stroke="#572364" name="Eje Z" isAnimationActive={false} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {(fogSubTab === 'prob' || isPrinting) && (
          <div className="brady-exercise-panel">
            <h3>🚫 Probabilidad de FOG Detectado</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={fogData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis domain={[0, 1]} label={{ value: 'Probabilidad', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => (value != null ? Number(value).toFixed(2) : '—')} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="fog_probability"
                  stroke="#E74C3C"
                  name="Probabilidad FOG"
                  isAnimationActive={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>
    );
  };

  const renderBradycinesiaChart = () => {
    const data = sessionData.bradykinesia || [];
    if (data.length === 0) {
      return <p className="no-data-tab">No hay datos de Bradicinesia disponibles.</p>;
    }

    const fmt = (ts) =>
      new Date(ts).toLocaleString('es-PE', {
        timeZone: 'America/Lima',
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      });

    const fv = (v) => parseFloat(v) || 0;

    const fmtDay = (ts) =>
      new Date(ts).toLocaleDateString('es-PE', {
        timeZone: 'America/Lima',
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      }).replace(/^\w/, (c) => c.toUpperCase());

    const renderGrouped = (rows, colCount, renderRow) => {
      let lastDay = null;
      return rows.map((e, idx) => {
        const day = fmtDay(e.timestamp);
        const isNew = day !== lastDay;
        lastDay = day;
        return (
          <React.Fragment key={idx}>
            {isNew && (
              <tr className="date-group-header">
                <td colSpan={colCount}>{day}</td>
              </tr>
            )}
            {renderRow(e, idx)}
          </React.Fragment>
        );
      });
    };



    // Separar por tipo de ejercicio
    const normalize = (t = '') => t.toLowerCase().replace(/[^a-z]/g, '');
    const ftData = data.filter((e) => ['fingertapping', 'ft', 'fingertap'].includes(normalize(e.test_type)));
    const hoData = data.filter((e) => ['handopening', 'ho', 'aperturacierre', 'opening'].includes(normalize(e.test_type)));
    const psData = data.filter((e) => ['pronationsupination', 'ps', 'pronacion', 'supination'].includes(normalize(e.test_type)));

    const ftFinal = ftData.length > 0 ? ftData : data;
    const hoFinal = hoData;
    const psFinal = psData;

    // ── Datos por ejercicio ──
    const ftChartData = ftFinal.map((e) => ({
      label: fmt(e.timestamp),
      taps_izq: fv(e.total_taps_left  ?? e.taps_left  ?? (e.hand === 'left'  ? e.total_taps : null)),
      taps_der: fv(e.total_taps_right ?? e.taps_right ?? (e.hand === 'right' ? e.total_taps : null)),
      freq_izq: fv(e.tap_frequency_left  ?? (e.hand === 'left'  ? e.tap_frequency ?? e.frequency : null)),
      freq_der: fv(e.tap_frequency_right ?? (e.hand === 'right' ? e.tap_frequency ?? e.frequency : null)),
      amp_izq:  fv(e.mean_amplitude_left  ?? (e.hand === 'left'  ? e.amplitude : null)),
      amp_der:  fv(e.mean_amplitude_right ?? (e.hand === 'right' ? e.amplitude : null)),
    }));

    const decrementData = ftFinal.map((e) => ({
      label: fmt(e.timestamp),
      dec_5:  fv(e.decrement_5  ?? e.amp_decrement_5),
      dec_7:  fv(e.decrement_7  ?? e.amp_decrement_7),
      dec_10: fv(e.decrement_10 ?? e.amp_decrement_10),
    })).filter((d) => d.dec_5 || d.dec_7 || d.dec_10);

    const hoChartData = hoFinal.map((e) => ({
      label: fmt(e.timestamp),
      velocity:  fv(e.velocity ?? e.mean_velocity),
      amplitude: fv(e.amplitude ?? e.mean_amplitude),
      frequency: fv(e.frequency ?? e.dominant_frequency),
    }));

    const psChartData = psFinal.map((e) => ({
      label: fmt(e.timestamp),
      velocity:  fv(e.velocity ?? e.mean_velocity),
      amplitude: fv(e.amplitude ?? e.mean_amplitude),
      frequency: fv(e.frequency ?? e.dominant_frequency),
    }));

    // ── Helpers ON/OFF ──
    const medState = (e) =>
      (e.medication ?? e.medication_condition ?? '').toUpperCase() === 'ON' ? 'ON' : 'OFF';

    const buildOnOffChart = (dataset, fields) => {
      const on  = dataset.filter((e) => medState(e) === 'ON');
      const off = dataset.filter((e) => medState(e) === 'OFF');
      const avg = (arr, getter) =>
        arr.length === 0 ? 0 : arr.reduce((s, e) => s + fv(getter(e)), 0) / arr.length;
      return fields.map(({ label, getter }) => ({
        metric: label,
        ON:  parseFloat(avg(on,  getter).toFixed(2)),
        OFF: parseFloat(avg(off, getter).toFixed(2)),
      }));
    };

    const hasOnOff = (dataset) =>
      dataset.some((e) => medState(e) === 'ON') && dataset.some((e) => medState(e) === 'OFF');

    // ── Sub-vistas por ejercicio ──
    const renderFingerTapping = () => (
      <div>
        <OnOffChart
          chartData={buildOnOffChart(ftFinal, [
            { label: 'Taps Izq.',   getter: (e) => e.total_taps_left  ?? e.taps_left  ?? (e.hand === 'left'  ? e.total_taps : 0) },
            { label: 'Taps Der.',   getter: (e) => e.total_taps_right ?? e.taps_right ?? (e.hand === 'right' ? e.total_taps : 0) },
            { label: 'Frec. Izq.', getter: (e) => e.tap_frequency_left  ?? (e.hand === 'left'  ? e.tap_frequency ?? e.frequency : 0) },
            { label: 'Frec. Der.', getter: (e) => e.tap_frequency_right ?? (e.hand === 'right' ? e.tap_frequency ?? e.frequency : 0) },
            { label: 'Amp. Izq.',  getter: (e) => e.mean_amplitude_left  ?? (e.hand === 'left'  ? e.amplitude : 0) },
            { label: 'Amp. Der.',  getter: (e) => e.mean_amplitude_right ?? (e.hand === 'right' ? e.amplitude : 0) },
          ])}
          hasData={hasOnOff(ftFinal)}
          title="Finger Tapping"
        />
        <h4 style={{ color: '#444', marginBottom: '8px' }}>Taps totales y amplitud media por sesión</h4>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={ftChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis /><Tooltip /><Legend />
            <Bar dataKey="taps_izq" fill="#3498DB" name="Taps izquierda" />
            <Bar dataKey="taps_der" fill="#E74C3C" name="Taps derecha" />
            <Bar dataKey="amp_izq"  fill="#85C1E9" name="Amplitud izq. (mm)" />
            <Bar dataKey="amp_der"  fill="#F1948A" name="Amplitud der. (mm)" />
          </BarChart>
        </ResponsiveContainer>

        <h4 style={{ color: '#444', margin: '20px 0 4px' }}>Frecuencia de tapping por sesión</h4>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '10px', fontSize: '11px' }}>
          <span style={{ background: '#d4edda', color: '#155724', padding: '2px 8px', borderRadius: '4px' }}>Normal ≥ 4 Hz</span>
          <span style={{ background: '#fff3cd', color: '#856404', padding: '2px 8px', borderRadius: '4px' }}>Leve 3–4 Hz</span>
          <span style={{ background: '#f8d7da', color: '#721c24', padding: '2px 8px', borderRadius: '4px' }}>Bradicinesia &lt; 3 Hz</span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={ftChartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis label={{ value: 'Hz', angle: -90, position: 'insideLeft' }} />
            <Tooltip /><Legend />
            <ReferenceLine y={4} stroke="#27AE60" strokeDasharray="5 4" label={{ value: 'Normal ≥ 4 Hz', position: 'insideTopLeft', fontSize: 10, fill: '#155724' }} />
            <ReferenceLine y={3} stroke="#E74C3C" strokeDasharray="5 4" label={{ value: 'Bradicinesia < 3 Hz', position: 'insideBottomLeft', fontSize: 10, fill: '#721c24' }} />
            <Bar dataKey="freq_izq" fill="#1ABC9C" name="Frecuencia izquierda (Hz)" radius={[3,3,0,0]} />
            <Bar dataKey="freq_der" fill="#E67E22" name="Frecuencia derecha (Hz)" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>

        {decrementData.length > 0 && (
          <>
            <h4 style={{ color: '#444', margin: '20px 0 8px' }}>Decremento de amplitud (5, 7 y 10 taps)</h4>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={decrementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                <Tooltip /><Legend />
                <Bar dataKey="dec_5"  fill="#8E44AD" name="Decremento 5 taps" />
                <Bar dataKey="dec_7"  fill="#D35400" name="Decremento 7 taps" />
                <Bar dataKey="dec_10" fill="#C0392B" name="Decremento 10 taps" />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}

      </div>
    );

    const renderMovimientoSimple = (ejercicioData, chartData, titulo) => (
      ejercicioData.length === 0
        ? <p style={{ color: '#888', fontSize: '14px' }}>No hay registros de {titulo.toLowerCase()}.</p>
        : (
          <div>
            <OnOffChart
              chartData={buildOnOffChart(ejercicioData, [
                { label: 'Velocidad',  getter: (e) => e.velocity  ?? e.mean_velocity },
                { label: 'Amplitud',   getter: (e) => e.amplitude ?? e.mean_amplitude },
                { label: 'Frecuencia', getter: (e) => e.frequency ?? e.dominant_frequency },
              ])}
              hasData={hasOnOff(ejercicioData)}
              title={titulo}
            />
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis /><Tooltip /><Legend />
                <Bar dataKey="velocity"  fill="#E74C3C" name="Velocidad (mm/s)" />
                <Bar dataKey="amplitude" fill="#3498DB" name="Amplitud (mm)" />
                <Bar dataKey="frequency" fill="#2ECC71" name="Frecuencia (Hz)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )
    );

    const ejercicios = [
      { key: 'ft', label: '👆 Finger Tapping' },
      { key: 'ho', label: '✋ Apertura / Cierre' },
      { key: 'ps', label: '🔄 Pronación / Supinación' },
    ];

    const fd = (v) => {
      const n = parseFloat(v)
      return (v == null || isNaN(n)) ? '—' : n.toFixed(2)
    }
    const fi = (v) => {
      const n = parseInt(v, 10)
      return (v == null || isNaN(n)) ? '—' : String(n)
    }
    const isFT = (e) => ['fingertapping','ft','fingertap'].includes(normalize(e.test_type))
    const isHO = (e) => ['handopening','ho','aperturacierre','opening'].includes(normalize(e.test_type))
    const isPS = (e) => ['pronationsupination','ps','pronacion','supination'].includes(normalize(e.test_type))

    return (
      <div className="chart-wrapper">

        <div className="data-table data-table--scroll" style={{ marginBottom: '28px' }}>
          <h3 style={{ marginBottom: '12px' }}>📋 Historial de Sesiones — Bradicinesia</h3>
          <table>
            <thead>
              <tr>
                <th>Sesión</th>
                <th>Fecha</th>
                <th>Ejercicio</th>
                <th>Taps Izq.</th>
                <th>Taps Der.</th>
                <th>Frec. Izq. (Hz)</th>
                <th>Frec. Der. (Hz)</th>
                <th>Amp. Izq. (mm)</th>
                <th>Amp. Der. (mm)</th>
                <th>Variabilidad amp.</th>
                <th>Velocidad (mm/s)</th>
                <th>Amplitud (mm)</th>
                <th>Frecuencia (Hz)</th>
                <th>Medicación</th>
              </tr>
            </thead>
            <tbody>
              {renderGrouped(data.slice(0, 30), 14, (e, idx) => {
                const ft = isFT(e)
                const simple = isHO(e) || isPS(e)
                return (
                  <tr key={idx}>
                    <td>{e.session_id ?? e._id ?? idx + 1}</td>
                    <td>{fmt(e.timestamp)}</td>
                    <td>{e.test_type ?? '—'}</td>
                    {/* Finger Tapping específicos */}
                    <td>{ft ? fi(e.total_taps_left  ?? e.taps_left  ?? (e.hand === 'left'  ? e.total_taps : null)) : '—'}</td>
                    <td>{ft ? fi(e.total_taps_right ?? e.taps_right ?? (e.hand === 'right' ? e.total_taps : null)) : '—'}</td>
                    <td>{ft ? fd(e.tap_frequency_left  ?? (e.hand === 'left'  ? e.tap_frequency ?? e.frequency : null)) : '—'}</td>
                    <td>{ft ? fd(e.tap_frequency_right ?? (e.hand === 'right' ? e.tap_frequency ?? e.frequency : null)) : '—'}</td>
                    <td>{ft ? fd(e.mean_amplitude_left  ?? (e.hand === 'left'  ? e.amplitude : null)) : '—'}</td>
                    <td>{ft ? fd(e.mean_amplitude_right ?? (e.hand === 'right' ? e.amplitude : null)) : '—'}</td>
                    <td>{ft ? fd(e.amplitude_variability ?? e.amp_variability) : '—'}</td>
                    {/* Comunes a HO / PS, también aplica a FT */}
                    <td>{fd(e.velocity ?? e.mean_velocity)}</td>
                    <td>{simple ? fd(e.amplitude ?? e.mean_amplitude) : '—'}</td>
                    <td>{simple ? fd(e.frequency ?? e.dominant_frequency) : '—'}</td>
                    <td>{medState(e)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="no-print" style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {ejercicios.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setBradySubTab(bradySubTab === key ? null : key)}
              className={`brady-exercise-btn ${bradySubTab === key ? 'active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div ref={exerciseRef} />
        {(bradySubTab === 'ft' || isPrinting) && (
          <div className="brady-exercise-panel">
            <h3>👆 Finger Tapping — Variables Cinemáticas</h3>
            {renderFingerTapping()}
          </div>
        )}
        {(bradySubTab === 'ho' || isPrinting) && (
          <div className="brady-exercise-panel">
            <h3>✋ Apertura y Cierre de Mano</h3>
            {renderMovimientoSimple(hoFinal, hoChartData, 'apertura y cierre de mano')}
          </div>
        )}
        {(bradySubTab === 'ps' || isPrinting) && (
          <div className="brady-exercise-panel">
            <h3>🔄 Pronación y Supinación</h3>
            {renderMovimientoSimple(psFinal, psChartData, 'pronación y supinación')}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="no-print" style={{ padding: '16px 20px' }}>
        <button onClick={onVolver} className="btn btn-icon btn-secondary" title="Volver a ficha">
          ←
        </button>
      </div>

      <div className="session-container">

        <div className="print-only print-header">
          <div className="print-header-brand">
            <div className="print-header-title">NeuroTrack</div>
            <div className="print-header-sub">Plataforma de Monitoreo de Síntomas · Parkinson — PUCP</div>
          </div>
          <div className="print-header-meta">
            <div><strong>Paciente:</strong> {paciente?.nombre ?? patientId}</div>
            {paciente?.diagnostico && <div><strong>Diagnóstico:</strong> {paciente.diagnostico}</div>}
            <div><strong>Sección:</strong> {activeTab === 'tremor' ? 'Tremor' : activeTab === 'fog' ? 'FOG — Congelamiento de marcha' : 'Bradicinesia'}</div>
            <div><strong>Período:</strong> {dateRange.start} — {dateRange.end}</div>
            <div><strong>Exportado:</strong> {new Date().toLocaleString('es-PE', { timeZone: 'America/Lima', dateStyle: 'long', timeStyle: 'short' })}</div>
          </div>
        </div>

        <div className="session-header">
          <div className="session-header-top">
            <h1>Sesión de Monitoreo — Paciente {patientId}</h1>
            <button
              className="btn btn-secondary"
              onClick={() => setIsPrinting(true)}
              disabled={isPrinting}
              title="Imprimir o guardar como PDF"
            >
              {isPrinting ? 'Preparando...' : '🖨 Imprimir / Exportar'}
            </button>
          </div>
          <div className="date-filter no-print">
            <label>
              Desde:
              <input
                type="date"
                min="2026-01-01"
                max={dateRange.end}
                value={dateRange.start}
                onKeyDown={(e) => e.stopPropagation()}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
              />
            </label>
            <label>
              Hasta:
              <input
                type="date"
                min="2026-01-01"
                max={new Date().toISOString().split('T')[0]}
                value={dateRange.end}
                onKeyDown={(e) => e.stopPropagation()}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
              />
            </label>
            <button onClick={fetchSessions} className="btn btn-primary">
              Filtrar
            </button>
          </div>
        </div>

        <div ref={tabsRef} className="tabs no-print">
          <button
            className={`tab-button ${activeTab === 'tremor' ? 'active' : ''}`}
            onClick={() => setActiveTab('tremor')}
          >
            🔴 Tremor
          </button>
          <button
            className={`tab-button ${activeTab === 'fog' ? 'active' : ''}`}
            onClick={() => setActiveTab('fog')}
          >
            🚶 FOG (Congelamiento)
          </button>
          <button
            className={`tab-button ${activeTab === 'bradykinesia' ? 'active' : ''}`}
            onClick={() => setActiveTab('bradykinesia')}
          >
            🐢 Bradycinesia
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'tremor' && renderTremorChart()}
          {activeTab === 'fog' && renderFOGChart()}
          {activeTab === 'bradykinesia' && renderBradycinesiaChart()}
        </div>
      </div>
    </>
  );
}