import Order from "../models/Order.js";
import Raffle from "../models/Raffle.js";
import User from "../models/User.js";
import { gerarNumerosUnicos } from "../utils/numberGenerator.js";
import { mercadopagoClient } from "../config/mercadoPago.js"; // ✅ ajuste principal

// 🔹 Criar ordem e preference no Mercado Pago
export const createCheckout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { cart } = req.body; // [{ raffleId, qtd }]

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const itens = [];
    const orderItens = [];

    for (const item of cart) {
      const rifa = await Raffle.findById(item.raffleId);
      if (!rifa) continue;

      const numeros = gerarNumerosUnicos(
        item.qtd,
        rifa.maxNumeros,
        rifa.numerosVendidos
      );

      orderItens.push({
        raffleId: rifa._id,
        numeros,
        precoUnit: rifa.preco,
      });

      itens.push({
        title: rifa.titulo,
        unit_price: rifa.preco,
        quantity: item.qtd,
        currency_id: "BRL",
      });
    }

    const total = orderItens.reduce(
      (sum, i) => sum + i.precoUnit * i.numeros.length,
      0
    );

    // ✅ cria a preferência corretamente
    const mpPreference = await mercadopagoClient.preferences.create({
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
    });

    // ✅ salva pedido no banco
    const order = new Order({
      userId,
      itens: orderItens,
      total,
      status: "pending",
      mpPreferenceId: mpPreference.id,
    });
    await order.save();

    // ✅ responde ao frontend com o link de pagamento
    res.json({ init_point: mpPreference.init_point });
  } catch (err) {
    console.error("❌ Erro ao criar checkout:", err);
    res.status(500).json({ error: "Erro ao criar checkout" });
  }
};

// 🔹 Consultar ordens do usuário
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

