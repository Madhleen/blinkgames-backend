// ============================================================
// 📦 BlinkGames — orderController.js (v12 — LIMPO E CORRIGIDO)
// ============================================================
//
// ❗ IMPORTANTE:
// ESTE ARQUIVO NÃO CONTÉM MAIS createCheckout.
// O createCheckout oficial está em controllers/checkoutController.js
//
// Este arquivo agora só cuida das ORDENS DO USUÁRIO.
// ============================================================

import Order from "../models/Order.js";

// ============================================================
// 📦 Ordens do usuário (GET /api/orders/my)
// ============================================================
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const orders = await Order.find({ userId })
      .populate({
        path: "itens.raffleId",
        select: "title image price",
        strictPopulate: false,
      })
      .sort({ createdAt: -1 });

    return res.json(orders);

  } catch (err) {
    console.error("❌ Erro ao buscar ordens:", err);
    return res.status(500).json({ error: "Erro ao buscar ordens." });
  }
};

