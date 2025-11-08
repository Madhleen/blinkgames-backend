// ============================================================
// 🔐 BlinkGames — routes/authRoutes.js (v8.1 Produção Corrigida)
// ============================================================

import express from "express";
import {
  registerUser,
  loginUser,
  getProfile,
} from "../controllers/authController.js";
import { verifyToken } from "../middlewares/auth.js"; // ✅ caminho corrigido (middlewares no plural)

const router = express.Router();

// 🔹 Registro e login
router.post("/register", registerUser);
router.post("/login", loginUser);

// 🔹 Perfil autenticado
router.get("/me", verifyToken, getProfile);

export default router;

