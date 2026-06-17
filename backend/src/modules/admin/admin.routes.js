import { Router } from "express";
import { coreRequest } from "../../config/coreApi.js";

const router = Router();

async function forward(req, res, path, method = req.method) {
  try {
    const result = await coreRequest(req, path, {
      method,
      body: ["GET", "HEAD"].includes(method) ? undefined : req.body,
    });
    return res.status(result.status).json(result.data);
  } catch (e) {
    return res.status(502).json({ error: `Falha ao conectar com API principal: ${e.message}` });
  }
}

// Clinics
router.get("/clinics",      (req, res) => forward(req, res, "/admin/clinics"));
router.patch("/clinics/:id",(req, res) => forward(req, res, `/admin/clinics/${req.params.id}`, "PATCH"));

// Stats
router.get("/stats",        (req, res) => forward(req, res, "/admin/stats"));

// Team
router.get("/team",         (req, res) => forward(req, res, "/admin/team"));

// Tasks
router.get("/tasks",                          (req, res) => forward(req, res, `/admin/tasks?${new URLSearchParams(req.query)}`));
router.get("/tasks/:id",                      (req, res) => forward(req, res, `/admin/tasks/${req.params.id}`));
router.post("/tasks",                         (req, res) => forward(req, res, "/admin/tasks", "POST"));
router.patch("/tasks/:id",                    (req, res) => forward(req, res, `/admin/tasks/${req.params.id}`, "PATCH"));
router.delete("/tasks/:id",                   (req, res) => forward(req, res, `/admin/tasks/${req.params.id}`, "DELETE"));
router.post("/tasks/:id/comments",            (req, res) => forward(req, res, `/admin/tasks/${req.params.id}/comments`, "POST"));
router.delete("/tasks/:taskId/comments/:cid", (req, res) => forward(req, res, `/admin/tasks/${req.params.taskId}/comments/${req.params.cid}`, "DELETE"));

// Leads
router.get("/leads",        (req, res) => forward(req, res, "/admin/leads"));
router.post("/leads",       (req, res) => forward(req, res, "/admin/leads", "POST"));
router.patch("/leads/:id",  (req, res) => forward(req, res, `/admin/leads/${req.params.id}`, "PATCH"));
router.delete("/leads/:id", (req, res) => forward(req, res, `/admin/leads/${req.params.id}`, "DELETE"));

// Notifications
router.get("/notifications",            (req, res) => forward(req, res, "/admin/notifications"));
router.patch("/notifications/read-all", (req, res) => forward(req, res, "/admin/notifications/read-all", "PATCH"));
router.patch("/notifications/:id/read", (req, res) => forward(req, res, `/admin/notifications/${req.params.id}/read`, "PATCH"));

// Financial
router.get("/financial",                    (req, res) => forward(req, res, "/admin/financial"));
router.get("/financial/billing",                    (req, res) => forward(req, res, "/admin/financial/billing"));
router.patch("/financial/billing/:id/cycle",        (req, res) => forward(req, res, `/admin/financial/billing/${req.params.id}/cycle`, "PATCH"));
router.get("/financial/entries",            (req, res) => forward(req, res, `/admin/financial/entries?${new URLSearchParams(req.query)}`));
router.get("/financial/recorrentes",        (req, res) => forward(req, res, "/admin/financial/recorrentes"));

// Estimativas do Planejamento Financeiro
router.get("/financial/estimates",          (req, res) => forward(req, res, "/admin/financial/estimates"));
router.post("/financial/estimates",         (req, res) => forward(req, res, "/admin/financial/estimates", "POST"));
router.delete("/financial/estimates/:id",   (req, res) => forward(req, res, `/admin/financial/estimates/${req.params.id}`, "DELETE"));
router.get("/financial/premissas",          (req, res) => forward(req, res, "/admin/financial/premissas"));
router.put("/financial/premissas",          (req, res) => forward(req, res, "/admin/financial/premissas", "PUT"));
router.post("/financial/entries",           (req, res) => forward(req, res, "/admin/financial/entries", "POST"));
router.patch("/financial/entries/:id",      (req, res) => forward(req, res, `/admin/financial/entries/${req.params.id}`, "PATCH"));
router.delete("/financial/entries/:id",     (req, res) => forward(req, res, `/admin/financial/entries/${req.params.id}`, "DELETE"));

// Customer Success
router.get("/cs",                       (req, res) => forward(req, res, "/admin/cs"));
router.post("/cs/notes",                (req, res) => forward(req, res, "/admin/cs/notes", "POST"));
router.delete("/cs/notes/:id",          (req, res) => forward(req, res, `/admin/cs/notes/${req.params.id}`, "DELETE"));
router.patch("/cs/clinics/:id/cancel",  (req, res) => forward(req, res, `/admin/cs/clinics/${req.params.id}/cancel`, "PATCH"));
router.patch("/cs/clinics/:id/reactivate",(req,res)=> forward(req, res, `/admin/cs/clinics/${req.params.id}/reactivate`, "PATCH"));

export default router;
