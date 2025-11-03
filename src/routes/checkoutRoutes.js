// ============================================================
// 💳 BlinkGames — checkoutRoutes.js (v6.9 FINAL)
// ============================================================

import express from "express";
import { createCheckout } from "../controllers/checkoutController.js";

const router = express.Router();

// ============================================================
// 🔹 Criação de checkout (rota principal)
// ============================================================
router.post("/", async (req, res, next) => {
  try {
    await createCheckout(req, res);
  } catch (err) {
    console.error("💥 Erro interno em /api/checkout:", err);
    next(err);
  }
});

// ============================================================
// 🔎 Healthcheck /debug opcional (útil pra Render testar rota)
// ============================================================
router.get("/", (req, res) => {
  res.status(200).json({ message: "✅ Endpoint /api/checkout ativo" });
});

export default router;

