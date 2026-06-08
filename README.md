# NeuroTrack — Frontend

Plataforma web de monitoreo de síntomas para pacientes con enfermedad de Parkinson, desarrollada en el marco de investigación de la **PUCP**. Permite a médicos, cuidadores, investigadores, pacientes y administradores visualizar y analizar datos de sensores de movimiento en tiempo real.

---

## Tabla de contenidos

- [Descripción](#descripción)
- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Requisitos previos](#requisitos-previos)
- [Configuración local](#configuración-local)
- [Variables de entorno](#variables-de-entorno)
- [Scripts disponibles](#scripts-disponibles)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Roles y rutas](#roles-y-rutas)
- [Despliegue en producción](#despliegue-en-producción)
- [Infraestructura AWS](#infraestructura-aws)

---

## Descripción

NeuroTrack captura datos de acelerómetro y giroscopio de dispositivos wearables usados por pacientes con Parkinson. El frontend web ofrece:

- **Tremor**: análisis de aceleración, frecuencia dominante y amplitud de temblor.
- **FOG (Freezing of Gait)**: detección de episodios de congelamiento de marcha con predicción ML.
- **Bradicinesia**: evaluación de Finger Tapping, Hand Opening y Pronation-Supination.
- Exportación formal a PDF con cabecera institucional y todas las tablas y gráficas del módulo activo.
- Filtrado por rango de fechas para todas las sesiones.

---

## Stack tecnológico

| Tecnología | Versión | Rol |
|---|---|---|
| React | 19.2 | UI |
| Vite | 8.0 | Bundler / Dev server |
| React Router DOM | 7.15 | Enrutamiento SPA |
| Recharts | 3.8 | Visualización de datos |
| Axios | 1.16 | Cliente HTTP |
| @fontsource/inter | 5.2 | Tipografía |

---

## Arquitectura

```
Dispositivo wearable (sensor)
        │
        ▼
  AWS API Gateway  ──►  Lambda  ──►  DynamoDB
        │
        ▼
  React SPA (esta repo)
  hosted en S3 + CloudFront
        │
  Auth vía AWS Cognito (idToken JWT)
```

El frontend es una SPA estática. No tiene servidor propio — toda la lógica de negocio vive en el backend serverless.

---

## Requisitos previos

- Node.js >= 18
- npm >= 9

---

## Configuración local

```bash
# 1. Clonar el repositorio
git clone https://github.com/abiyuli/neurotrack-frontend.git
cd neurotrack-frontend

# 2. Instalar dependencias
npm install

# 3. Copiar variables de entorno y completarlas
cp .env.example .env

# 4. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

---

## Variables de entorno

Copia `.env.example` como `.env` y rellena los valores:

| Variable | Descripción |
|---|---|
| `VITE_API_BASE_URL` | URL base del API Gateway (sin trailing slash) |

> **Nota**: las variables `VITE_*` son expuestas al navegador por Vite. No coloques secretos en ellas.

---

## Scripts disponibles

```bash
npm run dev       # Servidor de desarrollo con HMR
npm run build     # Build de producción → dist/
npm run preview   # Sirve el build de producción localmente
npm run lint      # ESLint sobre todos los archivos
```

---

## Estructura del proyecto

```
src/
├── api/
│   └── client.js              # Instancia Axios con interceptor de auth
├── components/
│   ├── AvatarMenu.jsx         # Menú de usuario en navbar
│   └── ProtectedRoute.jsx     # Guard de rutas autenticadas
├── context/
│   └── AuthContext.jsx        # Estado global de autenticación (idToken, user)
├── hooks/
│   └── useEscLogout.js        # Atajo de teclado Esc → logout
├── pages/
│   ├── Login.jsx
│   ├── Registro.jsx
│   ├── admin/                 # Panel de administración
│   ├── cuidador/              # Vista de cuidador
│   ├── investigador/          # Exportación de datos para investigación
│   ├── medico/
│   │   ├── MedicoHome.jsx     # Lista de pacientes
│   │   ├── FichaPaciente.jsx  # Perfil y datos del paciente
│   │   └── SesionDetalle.jsx  # Gráficas y tablas de sesiones (módulo principal)
│   └── paciente/              # Portal del paciente
├── styles/
│   └── SesionDetalle.css      # Estilos de sesión + reglas @media print
├── App.jsx                    # Árbol de rutas
└── main.jsx                   # Entry point
```

---

## Roles y rutas

| Rol | Ruta base | Acceso principal |
|---|---|---|
| Médico | `/medico` | Lista de pacientes, ficha, sesiones con gráficas |
| Administrador | `/admin` | Panel, usuarios, dispositivos, asignaciones, auditoría |
| Cuidador | `/cuidador` | Pacientes asignados, alertas |
| Investigador | `/investigador` | Sesiones globales, exportación de datos |
| Paciente | `/paciente` | Dashboard propio, sesiones, alertas |

Todas las rutas están protegidas por `ProtectedRoute`. El rol se determina a partir del perfil devuelto por `/auth/me` y el enrutamiento lo realiza el backend al login.

---

## Despliegue en producción

### Build

```bash
npm run build
# Genera: dist/
```

### Subir a S3

```bash
aws s3 sync dist/ s3://<BUCKET_NAME>/ --delete
```

### Invalidar caché de CloudFront

```bash
aws cloudfront create-invalidation \
  --distribution-id <DISTRIBUTION_ID> \
  --paths "/*"
```

---

## Infraestructura AWS

| Servicio | Uso |
|---|---|
| S3 | Hosting de archivos estáticos (SPA) |
| CloudFront | CDN + HTTPS + caché global |
| API Gateway | Endpoints REST del backend |
| Lambda | Lógica de negocio serverless |
| DynamoDB | Base de datos de sesiones y pacientes |
| Cognito | Autenticación y emisión de JWT |
| WAF | Protección contra ataques web (rate limiting, reglas gestionadas) |

---

## Licencia

Proyecto académico — PUCP. Uso restringido a fines de investigación.
