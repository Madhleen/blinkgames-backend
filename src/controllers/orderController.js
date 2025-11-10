// ============================================================
// 💳 BlinkGames — orderController.js (v8.6 Produção • SDK v2 safe)
// ============================================================

import Order from "../models/Order.js";
import Raffle from "../models/Raffle.js";
import User from "../models/User.js";
import { gerarNumerosUnicos } from "../utils/numberGenerator.js";
import { client } from "../config/mercadoPago.js";
import { Preference } from "mercadopago";

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function pickPrefField(resp, key) {
  // Tenta nas duas formas (top-level e .body)
  return resp?.[key] ?? resp?.body?.[key] ?? null;
}

// ============================================================
// 💰 Criar ordem e preference no Mercado Pago
// ============================================================
export const createCheckout = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { cart } = req.body; // [{ raffleId, quantity, ... }]

    if (!userId || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio ou usuário inválido." });
    }

    // 🔍 Usuário
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

    const itens = [];
    const orderItens = [];

    // 🧩 Monta itens e gera números
    for (const item of cart) {
      const raffleId = item.raffleId || item.id || item._id;
      const qtd = Math.max(1, Number(item.qtd || item.quantity || 1));

      const rifa = await Raffle.findById(raffleId);
      if (!rifa) continue;

      const numeros = gerarNumerosUnicos(qtd, rifa.totalNumbers, rifa.soldNumbers);

      orderItens.push({
        raffleId: rifa._id,
        numeros,
        precoUnit: Number(rifa.price),
        titulo: rifa.title,
      });

      itens.push({
        title: rifa.title,
        quantity: qtd,
        unit_price: Number(rifa.price),
        currency_id: "BRL",
      });
    }

    if (orderItens.length === 0) {
      return res.status(400).json({ error: "Nenhuma rifa válida encontrada." });
    }

    const total = orderItens.reduce(
      (sum, i) => sum + i.precoUnit * i.numeros.length,
      0
    );

    // 🧠 Preferência Mercado Pago
    const preference = new Preference(client);

    const payerData = {
      name: user.name || user.nome || "Cliente BlinkGames",
      email: user.email || "sem-email@blinkgames.com",
    };
    if (user.cpf) {
      payerData.identification = { type: "CPF", number: user.cpf };
    }

    const prefResp = await preference.create({
      body: {
        items: itens,
        payer: payerData,
        metadata: { userId, cart: orderItens },
        back_urls: {
          success: `${process.env.BASE_URL_FRONTEND}/sucesso.html`,
          failure: `${process.env.BASE_URL_FRONTEND}/erro.html`,
          pending: `${process.env.BASE_URL_FRONTEND}/aguardando.html`,
        },
        auto_return: "approved",
        notification_url: `${process.env.BASE_URL_BACKEND}/api/webhooks/payment`,
      },
    });

    // ⚙️ Extrai campos de forma resiliente (SDK v1/v2)
    const prefId =
      pickPrefField(prefResp, "id") ||
      pickPrefField(prefResp, "preference_id");

    const initPoint =
      pickPrefField(prefResp, "init_point") ||
      pickPrefField(prefResp, "sandbox_init_point");

    if (!prefId || !initPoint) {
      console.error("❌ Preferência inválida/inesperada:", {
        topKeys: Object.keys(prefResp || {}),
        bodyKeys: prefResp?.body ? Object.keys(prefResp.body) : null,
        prefResp,
      });
      return res.status(500).json({ error: "Erro ao criar preferência no Mercado Pago." });
    }

    // 💾 Salva pedido
    const order = new Order({
      userId,
      itens: orderItens,
      total,
      status: "pending",
      preferenceId: prefId,   // campo compatível com seu schema
      mpPreferenceId: prefId, // mantém ambos para compat (se existir no schema)
    });

    await order.save();
    console.log("✅ Pedido salvo:", order._id, "pref:", prefId);

    // 🔁 Resposta padronizada
    return res.json({
      ok: true,
      preference_id: prefId,
      init_point: initPoint,             // usado no front
      sandbox_init_point: pickPrefField(prefResp, "sandbox_init_point") || null,
    });
  } catch (err) {
    console.error("❌ Erro ao criar checkout:", err);
    return res.status(500).json({ error: "Erro ao criar checkout." });
  }
};

// ============================================================
// 📦 Ordens do usuário logado
// ============================================================
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Usuário não autenticado." });

    const orders = await Order.find({ userId })
      .populate("itens.raffleId", "title image price")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("❌ Erro ao buscar ordens:", err);
    res.status(500).json({ error: "Erro ao buscar ordens." });
  }
};

