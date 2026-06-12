/**
 * Diccionario de datos canónico — NeuroTrack
 *
 * Fuente única de verdad para los valores que llegan del API /sessions/{id}
 * tras la normalización del Lambda neurotrack-sessions.
 *
 * DynamoDB tiene dos schemas según la fuente del evento:
 *   Schema A (app móvil): test_type sin guiones, tremor_class = rest/essential/normal
 *   Schema B (Firebase bridge / dispositivo): movement con guiones, tremor_class = leve/moderado/severo
 * El Lambda los unifica antes de llegar aquí.
 */

// ── TREMOR ────────────────────────────────────────────────────────────────────

/** Todos los valores posibles de tremor.severity tras normalización en Lambda */
export const TREMOR_SEVERITY_LABEL = {
  normal:    '✅ Normal',
  // Taxonomía clínica (tipo)
  rest:      '🔴 Temblor de Reposo',
  essential: '🟠 Temblor Esencial',
  // Taxonomía de severidad (dispositivo)
  leve:      '🟡 Temblor Leve',
  moderado:  '🟠 Temblor Moderado',
  severo:    '🔴 Temblor Severo',
};

/** Clase CSS para prediction-badge según severidad de temblor */
export const TREMOR_SEVERITY_CSS = {
  normal:    'normal',
  rest:      'rest',
  essential: 'essential',
  leve:      'leve',
  moderado:  'moderado',
  severo:    'severo',
};

export const tremorSeverityLabel = (cls) =>
  TREMOR_SEVERITY_LABEL[cls] ?? cls ?? '—';

export const tremorSeverityCSS = (cls) =>
  TREMOR_SEVERITY_CSS[cls] ?? '';

// ── FOG ───────────────────────────────────────────────────────────────────────

/**
 * Tras normalización en Lambda, fog.prediction solo tiene dos valores:
 *   "freeze"  → episodio de congelamiento
 *   "normal"  → sin congelamiento
 */
export const isFogFreeze = (val) =>
  String(val || '').toLowerCase() === 'freeze';

export const fogPredictionLabel = (val) =>
  isFogFreeze(val) ? '🚫 Congelamiento' : '✅ Normal';

// ── BRADYKINESIA ──────────────────────────────────────────────────────────────

/**
 * Tras normalización en Lambda, test_type no tiene guiones ni espacios:
 *   "fingertapping"       ← finger_tapping / fingertapping / ft
 *   "handopening"         ← hand_opening / handopening / ho
 *   "pronationsupination" ← pronation_supination / pronationsupination / ps
 *   "unknown"             ← cualquier valor no reconocido
 */
export const BRADY_TYPE_FILTERS = {
  fingertapping:        (t) => ['fingertapping', 'ft', 'fingertap'].includes(t),
  handopening:          (t) => ['handopening', 'ho', 'aperturacierre', 'opening'].includes(t),
  pronationsupination:  (t) => ['pronationsupination', 'ps', 'pronacion', 'supination'].includes(t),
};

export const BRADY_TYPE_LABEL = {
  fingertapping:       'Finger Tapping',
  handopening:         'Apertura / Cierre',
  pronationsupination: 'Pronación / Supinación',
  unknown:             'Sin clasificar',
};

export const normBradyType = (val = '') =>
  String(val).toLowerCase().replace(/[^a-z]/g, '');

// ── ALERTA ────────────────────────────────────────────────────────────────────

export const ALERT_LEVEL_LABEL = {
  HIGH:   'Alta',
  MEDIUM: 'Media',
  LOW:    'Baja',
  NONE:   'Sin alerta',
};

// ── MEDICACIÓN ────────────────────────────────────────────────────────────────

export const medState = (e) =>
  String(e?.medication ?? e?.medication_condition ?? '').toUpperCase() === 'ON' ? 'ON' : 'OFF';
