import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import TecnologiaHome from "../pages/tecnologia/TecnologiaHome";
import Clinicas from "../pages/tecnologia/Clinicas";
import SaudeSistema from "../pages/tecnologia/SaudeSistema";
import FeaturesPlanos from "../pages/tecnologia/FeaturesPlanos";
import LogsAuditoria from "../pages/tecnologia/LogsAuditoria";
import Infraestrutura from "../pages/tecnologia/Infraestrutura";
import CotasConsumo from "../pages/tecnologia/CotasConsumo";
import CustoWhatsApp from "../pages/tecnologia/CustoWhatsApp";
import Tasks from "../pages/Tasks";
import Financeiro from "../pages/Financeiro";
import CustomerSuccess from "../pages/CustomerSuccess";
import Comercial from "../pages/Comercial";
import PlanejamentoSandbox from "../modules/financeiro/PlanejamentoSandbox";
import { isOwner } from "../config/owner";

const IosCockpit = lazy(() => import("../modules/ios/pages/IosCockpit"));
const IosStrategy = lazy(() => import("../modules/ios/pages/IosStrategy"));
const IosMetrics = lazy(() => import("../modules/ios/pages/IosMetrics"));
const IosDecisions = lazy(() => import("../modules/ios/pages/IosDecisions"));
const IosPerformance = lazy(() => import("../modules/ios/pages/IosPerformance"));
const IosCommercial = lazy(() => import("../modules/ios/pages/IosCommercial"));
const IosProduct = lazy(() => import("../modules/ios/pages/IosProduct"));
const IosPeople = lazy(() => import("../modules/ios/pages/IosPeople"));

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

function IosProtectedRoute({ children }) {
  const raw = localStorage.getItem("admin_user");
  let user = null;
  try { user = raw ? JSON.parse(raw) : null; } catch { /* */ }
  if (!isOwner(user)) return <Navigate to="/" replace />;
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

function IOS({ children }) {
  return (
    <IosProtectedRoute>
      <Suspense fallback={<div className="min-h-screen bg-[#F2F0EB] p-8 text-sm text-gray-400">Carregando IOS…</div>}>
        {children}
      </Suspense>
    </IosProtectedRoute>
  );
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
      <Route path="/tecnologia/cotas"    element={<P><CotasConsumo /></P>} />
      <Route path="/tecnologia/custo-whatsapp" element={<P><CustoWhatsApp /></P>} />
      <Route path="/tasks"      element={<P><Tasks /></P>} />
      <Route path="/financial" element={<P><Financeiro /></P>} />
      <Route path="/cs"        element={<P><CustomerSuccess /></P>} />
      <Route path="/comercial" element={<P><Comercial /></P>} />
      <Route path="/planejamento" element={<P><PlanejamentoSandbox /></P>} />
      <Route path="/ios"           element={<IOS><IosCockpit /></IOS>} />
      <Route path="/ios/strategy"  element={<IOS><IosStrategy /></IOS>} />
      <Route path="/ios/metrics"   element={<IOS><IosMetrics /></IOS>} />
      <Route path="/ios/decisions" element={<IOS><IosDecisions /></IOS>} />
      <Route path="/ios/performance" element={<IOS><IosPerformance /></IOS>} />
      <Route path="/ios/commercial"  element={<IOS><IosCommercial /></IOS>} />
      <Route path="/ios/product"     element={<IOS><IosProduct /></IOS>} />
      <Route path="/ios/people"      element={<IOS><IosPeople /></IOS>} />
      <Route path="*"          element={<Navigate to="/" replace />} />
    </Routes>
  );
}
