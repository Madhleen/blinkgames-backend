import express from "express";
import {
  getDashboard,
  listUsers,
  listRaffles,
  listPayments,
  exportCSV,
} from "../controllers/adminController.js";

import { createRaffle } from "../controllers/raffleController.js";
import { adminMiddleware } from "../middleware/admin.js";

const router = express.Router();

// 🔹 Dashboard
router.get("/dashboard", adminMiddleware, getDashboard);

// 🔹 Listagens
router.get("/users", adminMiddleware, listUsers);
router.get("/raffles", adminMiddleware, listRaffles);
router.get("/payments", adminMiddleware, listPayments);

// 🔹 Exportação CSV
router.get("/export", adminMiddleware, exportCSV);

// 🔹 Criação de rifas com chave admin
router.post("/rifas", adminMiddleware, createRaffle);

export default router;


