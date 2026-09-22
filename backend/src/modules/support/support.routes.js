import { Router } from "express";
import { coreApiUrl, coreHeaders, coreRequest } from "../../config/coreApi.js";

const router = Router();

// Anexo de mensagem: exceção ao repasse JSON abaixo.
//
// O forward genérico faz JSON.parse no corpo — uma imagem passando por lá
// seria corrompida. Aqui o binário é repassado como binário, preservando
// Content-Type, Content-Disposition e o cache que o core definiu.
//
// O core continua sendo quem autoriza: o Authorization do atendente segue
// junto, e sem ele a resposta é 401 lá, não aqui.
router.get(/^\/messages\/[^/]+\/media$/, async (req, res) => {
  try {
    const upstream = await fetch(`${coreApiUrl()}/admin/support${req.path}`, {
      headers: coreHeaders(req),
    });

    if (!upstream.ok) {
      // Erro do core é JSON: repassa como veio, para a tela mostrar o motivo.
      const detalhe = await upstream.text().catch(() => "");
      return res.status(upstream.status).type("application/json").send(
        detalhe || JSON.stringify({ error: "Falha ao carregar o anexo." })
      );
    }

    for (const h of ["content-type", "content-length", "content-disposition", "cache-control"]) {
      const v = upstream.headers.get(h);
      if (v) res.setHeader(h, v);
    }
    return res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch (error) {
    return res.status(502).json({
      error: `Falha ao carregar o anexo: ${error.message}`,
      code: "SUPPORT_GATEWAY_UNAVAILABLE",
    });
  }
});

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
