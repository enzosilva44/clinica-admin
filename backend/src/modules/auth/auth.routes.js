import { Router } from "express";
import { coreRequest } from "../../config/coreApi.js";

const router = Router();

router.post("/login", async (req, res) => {
  try {
    const result = await coreRequest(req, "/auth/login", {
      method: "POST",
      body: req.body,
    });

    if (result.status >= 400) {
      return res.status(result.status).json(result.data);
    }

    if (result.data?.user?.role !== "ADMIN") {
      return res.status(403).json({ error: "Acesso negado — conta sem permissão de admin." });
    }

    return res.json(result.data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
