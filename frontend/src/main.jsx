import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AdminAuthProvider } from "./contexts/AdminAuthContext";
import AppRoutes from "./routes/AppRoutes";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AdminAuthProvider>
        <Toaster position="top-right" />
        <AppRoutes />
      </AdminAuthProvider>
    </BrowserRouter>
  </StrictMode>
);
