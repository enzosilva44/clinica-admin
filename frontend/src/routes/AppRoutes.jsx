import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import TecnologiaHome from "../pages/tecnologia/TecnologiaHome";
import Clinicas from "../pages/tecnologia/Clinicas";
import SaudeSistema from "../pages/tecnologia/SaudeSistema";
import FeaturesPlanos from "../pages/tecnologia/FeaturesPlanos";
import LogsAuditoria from "../pages/tecnologia/LogsAuditoria";
import Infraestrutura from "../pages/tecnologia/Infraestrutura";
import Tasks from "../pages/Tasks";
import Financeiro from "../pages/Financeiro";
import CustomerSuccess from "../pages/CustomerSuccess";
import Comercial from "../pages/Comercial";
import PlanejamentoSandbox from "../modules/financeiro/PlanejamentoSandbox";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("admin_token");
  const raw   = localStorage.getItem("admin_user");
  let user = null;
  try { user = raw ? JSON.parse(raw) : null; } catch { /* */ }
  if (!token || user?.role !== "ADMIN") return <Navigate to="/login" replace />;
  return children;
}

function P({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"     element={<Login />} />
      <Route path="/"                    element={<P><Dashboard /></P>} />
      <Route path="/tecnologia"          element={<P><TecnologiaHome /></P>} />
      <Route path="/tecnologia/clinicas" element={<P><Clinicas /></P>} />
      <Route path="/tecnologia/saude"    element={<P><SaudeSistema /></P>} />
      <Route path="/tecnologia/features" element={<P><FeaturesPlanos /></P>} />
      <Route path="/tecnologia/logs"     element={<P><LogsAuditoria /></P>} />
      <Route path="/tecnologia/infra"    element={<P><Infraestrutura /></P>} />
      <Route path="/tasks"      element={<P><Tasks /></P>} />
      <Route path="/financial" element={<P><Financeiro /></P>} />
      <Route path="/cs"        element={<P><CustomerSuccess /></P>} />
      <Route path="/comercial" element={<P><Comercial /></P>} />
      <Route path="/planejamento" element={<P><PlanejamentoSandbox /></P>} />
      <Route path="*"          element={<Navigate to="/" replace />} />
    </Routes>
  );
}
