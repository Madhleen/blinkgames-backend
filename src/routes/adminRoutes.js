import express from "express";
import {
  getDashboard,
  listUsers,
  listRaffles,
  listPayments,
  exportCSV,
} from "../controllers/adminController.js";

import { authMiddleware } from "../middleware/auth.js";
import { adminMiddleware } from "../middleware/admin.js";

const router = express.Router();

// 🔹 Dashboard
router.get("/dashboard", authMiddleware, adminMiddleware, getDashboard);

// 🔹 Listagens
router.get("/users", authMiddleware, adminMiddleware, listUsers);
router.get("/raffles", authMiddleware, adminMiddleware, listRaffles);
router.get("/payments", authMiddleware, adminMiddleware, listPayments);

// 🔹 Exportação CSV
router.get("/export", authMiddleware, adminMiddleware, exportCSV);

export default router;
