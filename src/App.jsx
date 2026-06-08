import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Registro from './pages/Registro'
import MedicoHome from './pages/medico/MedicoHome'
import FichaPaciente from './pages/medico/FichaPaciente'
import SesionDetalle from './pages/medico/SesionDetalle'
import AdminLayout from './pages/admin/AdminLayout'
import AdminPanel from './pages/admin/AdminPanel'
import AdminUsuarios from './pages/admin/AdminUsuarios'
import AdminDispositivos from './pages/admin/AdminDispositivos'
import AdminAsignaciones from './pages/admin/AdminAsignaciones'
import AdminAuditoria from './pages/admin/AdminAuditoria'
import CuidadorLayout from './pages/cuidador/CuidadorLayout'
import CuidadorPacientes from './pages/cuidador/CuidadorPacientes'
import CuidadorAlertas from './pages/cuidador/CuidadorAlertas'
import InvestigadorLayout from './pages/investigador/InvestigadorLayout'
import InvestigadorSesiones from './pages/investigador/InvestigadorSesiones'
import InvestigadorExportar from './pages/investigador/InvestigadorExportar'
import PacienteLayout from './pages/paciente/PacienteLayout'
import PacienteDashboard from './pages/paciente/PacienteDashboard'
import PacienteSesiones from './pages/paciente/PacienteSesiones'
import PacienteAlertas from './pages/paciente/PacienteAlertas'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />

          {/* Rutas médico */}
          <Route path="/medico" element={<ProtectedRoute><MedicoHome /></ProtectedRoute>} />
          <Route path="/medico/nuevo" element={<ProtectedRoute><FichaPaciente /></ProtectedRoute>} />
          <Route path="/medico/paciente/:patientId" element={<ProtectedRoute><FichaPaciente /></ProtectedRoute>} />
          <Route path="/medico/paciente/:patientId/sesiones" element={<ProtectedRoute><SesionDetalle /></ProtectedRoute>} />

          {/* Rutas admin */}
          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/admin/panel" replace />} />
            <Route path="panel"        element={<AdminPanel />} />
            <Route path="usuarios"     element={<AdminUsuarios />} />
            <Route path="dispositivos" element={<AdminDispositivos />} />
            <Route path="asignaciones" element={<AdminAsignaciones />} />
            <Route path="auditoria"    element={<AdminAuditoria />} />
          </Route>

          {/* Rutas cuidador */}
          <Route path="/cuidador" element={<ProtectedRoute><CuidadorLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/cuidador/pacientes" replace />} />
            <Route path="pacientes" element={<CuidadorPacientes />} />
            <Route path="alertas"   element={<CuidadorAlertas />} />
          </Route>

          {/* Rutas investigador */}
          <Route path="/investigador" element={<ProtectedRoute><InvestigadorLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/investigador/sesiones" replace />} />
            <Route path="sesiones" element={<InvestigadorSesiones />} />
            <Route path="exportar" element={<InvestigadorExportar />} />
          </Route>

          {/* Rutas paciente */}
          <Route path="/paciente" element={<ProtectedRoute><PacienteLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/paciente/inicio" replace />} />
            <Route path="inicio"   element={<PacienteDashboard />} />
            <Route path="sesiones" element={<PacienteSesiones />} />
            <Route path="alertas"  element={<PacienteAlertas />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}