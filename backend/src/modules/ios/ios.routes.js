import { Router } from "express";
import { coreRequest } from "../../config/coreApi.js";

const router = Router();

// O BFF permanece sem regra de negócio: todo o domínio IOS vive no core.
// O namespace dedicado evita registrar manualmente cada endpoint novo em dois
// arquivos, preservando método, body, query string e status HTTP.
router.use(async (req, res) => {
  try {
    const query = new URLSearchParams(req.query).toString();
    const path = `/admin/ios${req.path}${query ? `?${query}` : ""}`;
    const method = req.method;
    const result = await coreRequest(req, path, {
      method,
      body: ["GET", "HEAD"].includes(method) ? undefined : req.body,
    });
    return res.status(result.status).json(result.data);
  } catch (error) {
    return res.status(502).json({
      error: `Falha ao conectar com o IASO Operating System: ${error.message}`,
      code: "IOS_GATEWAY_UNAVAILABLE",
    });
  }
});

export default router;
