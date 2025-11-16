// ============================================================
// 💳 BlinkGames — orderController.js (v11.2 — FIX FINAL)
// ============================================================

import Order from "../models/Order.js";
import Raffle from "../models/Raffle.js";
import User from "../models/User.js";
import { client } from "../config/mercadoPago.js";
import { Preference } from "mercadopago";

export const createCheckout = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { cart } = req.body;

    if (!userId || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio ou usuário inválido." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

    const itensMP = [];
    const itensPedido = [];

    for (const item of cart) {
      const raffleId = item.raffleId || item.id || item._id;
      const quantidade = Number(item.quantity) || 1;

      const rifa = await Raffle.findById(raffleId);
      if (!rifa) continue;

      itensPedido.push({
        raffleId,
        numeros: item.numeros || item.numbers || [],
        precoUnit: Number(rifa.price),
        titulo: rifa.title,
      });

      itensMP.push({
        title: rifa.title,
        quantity: quantidade,
        unit_price: Number(rifa.price),
        currency_id: "BRL",
      });
    }

    const total = itensPedido.reduce(
      (sum, r) => sum + r.precoUnit * r.numeros.length,
      0
    );

    const preference = new Preference(client);

    const pref = await preference.create({
      body: {
        items: itensMP,

        payer: {
          name: user.name || user.nome,
          email: user.email,
        },

        // ============================================================
        // 🔥 FIX CRÍTICO — Mercado Pago SÓ aceita metadata simples
        // ============================================================
        metadata: {
          userId: String(userId),
          orderType: "rifa",    // campo simples só pra garantir
          hasCart: true          // boolean simples = SEM ERRO
        },

        back_urls: {
          success: `${process.env.BASE_URL_FRONTEND}/sucesso.html`,
          failure: `${process.env.BASE_URL_FRONTEND}/erro.html`,
          pending: `${process.env.BASE_URL_FRONTEND}/aguardando.html`,
        },

        auto_return: "approved",

        // 🔥 Aqui NÃO pode falhar
        notification_url: `${process.env.BASE_URL_BACKEND}/api/webhooks/mercadopago`,
      },
    });

    // ============================================================
    // 🔍 Captura certa do PreferenceID e init_point
    // ============================================================
    const prefId =
      pref?.id ||
      pref?.body?.id ||
      pref?.response?.id ||
      null;

    const initPoint =
      pref?.init_point ||
      pref?.body?.init_point ||
      pref?.response?.init_point ||
      null;

    const sandbox =
      pref?.sandbox_init_point ||
      pref?.body?.sandbox_init_point ||
      null;

    console.log("🔗 Preferência criada:", { prefId, initPoint });

    if (!prefId || !initPoint) {
      console.error("❌ Preferência inválida:", pref);
      return res.status(500).json({ error: "Erro ao criar preferência." });
    }

    // ============================================================
    // 💾 Salva pedido
    // ============================================================
    const order = new Order({
      userId,
      itens: itensPedido,
      total,
      status: "pending",
      mpPreferenceId: prefId,
    });

    await order.save();

    console.log("💾 Pedido criado:", order._id);

    return res.json({
      ok: true,
      preference_id: prefId,
      init_point: initPoint,
      sandbox_init_point: sandbox,
    });

  } catch (err) {
    console.error("❌ Erro no createCheckout:", err);
    return res.status(500).json({ error: "Erro ao criar checkout." });
  }
};

