// ============================================================
// 💳 BlinkGames — orderController.js (v8.7 FINAL — Corrigido retorno SDK v2 Mercado Pago)
// ============================================================

import Order from "../models/Order.js";
import Raffle from "../models/Raffle.js";
import User from "../models/User.js";
import { gerarNumerosUnicos } from "../utils/numberGenerator.js";
import { client } from "../config/mercadoPago.js";
import { Preference } from "mercadopago";

// ------------------------------------------------------------
// Helper para extrair campos independente da versão do SDK
// ------------------------------------------------------------
function getPrefValue(resp, key) {
  return (
    resp?.[key] ||
    resp?.body?.[key] ||
    resp?.response?.[key] ||
    resp?.response?.body?.[key] ||
    null
  );
}

// ============================================================
// 💰 Criação do Checkout / Preferência
// ============================================================
export const createCheckout = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { cart } = req.body;

    if (!userId || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio ou usuário inválido." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

    const itens = [];
    const orderItens = [];

    // Monta itens
    for (const item of cart) {
      const raffleId = item.raffleId || item.id || item._id;
      const qtd = Math.max(1, Number(item.quantity) || 1);
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

    const preference = new Preference(client);

    const payer = {
      name: user.name || user.nome || "Cliente BlinkGames",
      email: user.email || "sem-email@blinkgames.com",
    };
    if (user.cpf) payer.identification = { type: "CPF", number: user.cpf };

    const prefResp = await preference.create({
      body: {
        items: itens,
        payer,
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

    // ============================================================
    // 💡 Corrige a leitura dos campos (SDK v2)
    // ============================================================
    const prefId =
      getPrefValue(prefResp, "id") ||
      getPrefValue(prefResp, "preference_id");

    const initPoint =
      getPrefValue(prefResp, "init_point") ||
      getPrefValue(prefResp, "sandbox_init_point") ||
      getPrefValue(prefResp, "url") || // fallback de segurança
      null;

    console.log("🔍 DEBUG MercadoPago:", {
      prefId,
      initPoint,
      topKeys: Object.keys(prefResp || {}),
      hasBody: !!prefResp?.body,
      hasResponse: !!prefResp?.response,
    });

    if (!initPoint) {
      console.error("❌ Nenhum link de pagamento retornado:", prefResp);
      return res.status(500).json({
        error: "O servidor não retornou o link de pagamento.",
        raw: prefResp,
      });
    }

    // ============================================================
    // 💾 Salva pedido no banco
    // ============================================================
    const order = new Order({
      userId,
      itens: orderItens,
      total,
      status: "pending",
      preferenceId: prefId,
      mpPreferenceId: prefId,
    });

    await order.save();
    console.log("✅ Pedido salvo com sucesso:", order._id);

    // ============================================================
    // 🔁 Retorna link e ID
    // ============================================================
    return res.json({
      ok: true,
      preference_id: prefId,
      init_point: initPoint,
    });
  } catch (err) {
    console.error("❌ Erro ao criar checkout:", err);
    return res.status(500).json({ error: "Erro ao criar checkout." });
  }
};

// ============================================================
// 📦 Buscar ordens do usuário logado
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

