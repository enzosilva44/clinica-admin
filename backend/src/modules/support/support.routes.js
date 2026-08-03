import { Router } from "express";
import { coreRequest } from "../../config/coreApi.js";

const router = Router();

// Mesma escolha do namespace IOS: o BFF não conhece o domínio do suporte, só
// repassa. Assim endpoint novo no core não exige mexer aqui de novo.
router.use(async (req, res) => {
  try {
    const query = new URLSearchParams(req.query).toString();
    const path = `/admin/support${req.path}${query ? `?${query}` : ""}`;
    const method = req.method;
    const result = await coreRequest(req, path, {
      method,
      body: ["GET", "HEAD"].includes(method) ? undefined : req.body,
    });
    return res.status(result.status).json(result.data);
  } catch (error) {
    return res.status(502).json({
      error: `Falha ao conectar com a central de suporte: ${error.message}`,
      code: "SUPPORT_GATEWAY_UNAVAILABLE",
    });
  }
});

export default router;
