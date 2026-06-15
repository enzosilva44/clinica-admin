import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const AdminAuthContext = createContext({});

export function AdminAuthProvider({ children }) {
  const navigate = useNavigate();

  function getStoredUser() {
    try {
      const raw = localStorage.getItem("admin_user");
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  const [adminUser, setAdminUser] = useState(getStoredUser);

  async function adminLogin(email, password) {
    const res = await api.post("/auth/login", { email, password });
    const { token, user } = res.data;
    if (user.role !== "ADMIN") throw new Error("Acesso negado — conta sem permissão de admin.");
    localStorage.setItem("admin_token", token);
    localStorage.setItem("admin_user", JSON.stringify(user));
    setAdminUser(user);
    navigate("/");
  }

  function adminLogout() {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    setAdminUser(null);
    navigate("/login");
  }

  return (
    <AdminAuthContext.Provider value={{ adminUser, adminLogin, adminLogout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
