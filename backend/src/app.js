import express from "express";
import cors from "cors";
import authRoutes from "./modules/auth/auth.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use("/auth",  authRoutes);
app.use("/admin", adminRoutes);

app.get("/", (_, res) => {
  res.json({
    service: "clinica-admin-backend",
    mode: "api-gateway",
    coreApi: process.env.CLINICA_APP_API_URL || process.env.CORE_API_URL || "http://localhost:3000",
    ok: true,
  });
});

export default app;
