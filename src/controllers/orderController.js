import Order from "../models/Order.js";
import Raffle from "../models/Raffle.js";
import User from "../models/User.js";
import { gerarNumerosUnicos } from "../utils/numberGenerator.js";
import { client } from "../config/mercadoPago.js";
import { Preference } from "mercadopago";

// ============================================================
// 💳 Criar ordem e preference no Mercado Pago
// ============================================================
export const createCheckout = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { cart } = req.body; // [{ raffleId || id, qtd || quantity }]

    if (!userId || !cart || cart.length === 0) {
      return res.status(400).json({ error: "Carrinho vazio ou usuário inválido" });
    }

    // 🔹 Busca usuário no banco
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const itens = [];
    const orderItens = [];

    // 🔹 Monta os itens da compra
    for (const item of cart) {
      // compatibilidade com os nomes vindos do frontend
      const raffleId = item.raffleId || item.id || item._id;
      const qtd = item.qtd || item.quantity || 1;

      const rifa = await Raffle.findById(raffleId);
      if (!rifa) {
        console.warn("⚠️ Rifa não encontrada:", raffleId);
        continue;
      }

      const numeros = gerarNumerosUnicos(qtd, rifa.maxNumeros, rifa.numerosVendidos);

      orderItens.push({
        raffleId: rifa._id,
        numeros,
        precoUnit: rifa.preco,
      });

      itens.push({
        title: rifa.titulo,
        quantity: Number(qtd),
        unit_price: Number(rifa.preco),
        currency_id: "BRL",
      });
    }

    if (orderItens.length === 0) {
      return res.status(400).json({ error: "Nenhuma rifa válida encontrada" });
    }

    const total = orderItens.reduce(
      (sum, i) => sum + i.precoUnit * i.numeros.length,
      0
    );

    // 🔹 Cria uma instância Preference vinculada ao client
    const preference = new Preference(client);

    // 🔹 Cria a preferência no Mercado Pago
    const mpPreference = await preference.create({
      body: {
        items: itens,
        payer: {
          name: user.nome,
          email: user.email,
          identification: { type: "CPF", number: user.cpf },
        },
        metadata: { userId, cart: orderItens },
        back_urls: {
          success: `${process.env.BASE_URL_FRONTEND}/pagamento/sucesso`,
          failure: `${process.env.BASE_URL_FRONTEND}/pagamento/erro`,
          pending: `${process.env.BASE_URL_FRONTEND}/pagamento/pendente`,
        },
        auto_return: "approved",
        notification_url: `${process.env.BASE_URL_BACKEND}/api/webhooks/mercadopago`,
      },
    });

    // 🔹 Salva pedido no banco
    const order = new Order({
      userId,
      itens: orderItens,
      total,
      status: "pending",
      mpPreferenceId: mpPreference.id,
    });

    await order.save();

    res.json({ init_point: mpPreference.init_point });
  } catch (err) {
    console.error("❌ Erro ao criar checkout:", err);
    res.status(500).json({ error: err.message || "Erro ao criar checkout" });
  }
};

// ============================================================
// 📦 Buscar ordens do usuário logado
// ============================================================
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (err) {
    console.error("❌ Erro ao buscar ordens:", err);
    res.status(500).json({ error: "Erro ao buscar ordens" });
  }
};

