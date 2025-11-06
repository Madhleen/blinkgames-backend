// ============================================================
// 🔐 BlinkGames — routes/authRoutes.js (v8.0 Produção)
// ============================================================

import express from "express";
import {
  registerUser,
  loginUser,
  getProfile,
} from "../controllers/authController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// 🔹 Registro e login
router.post("/register", registerUser);
router.post("/login", loginUser);

// 🔹 Perfil autenticado
router.get("/me", verifyToken, getProfile);

export default router;

