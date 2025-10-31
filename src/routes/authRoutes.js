import express from "express";
import {
  register,
  login,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

const router = express.Router();

// 🧍 Cadastro e Login
router.post("/register", register);
router.post("/login", login);

// ✉️ Recuperação de senha
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;

