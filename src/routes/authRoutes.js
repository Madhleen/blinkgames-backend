// ============================================================
// 🔐 BlinkGames — routes/authRoutes.js (v8.2 Produção Corrigida Final)
// ============================================================

import express from "express";
import {
  registerUser,
  loginUser,
  getProfile,
  logoutUser,
} from "../controllers/authController.js";
import { verifyToken } from "../middleware/auth.js"; // ✅ CORRIGIDO: pasta 'middleware' (sem 's')

const router = express.Router();

// 🔹 Registro e login
router.post("/register", registerUser);
router.post("/login", loginUser);

// 🔹 Perfil autenticado
router.get("/me", verifyToken, getProfile);

// 🔹 Logout simbólico
router.post("/logout", logoutUser);

export default router;

