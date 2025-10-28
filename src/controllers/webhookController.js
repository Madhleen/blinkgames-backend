import Order from "../models/Order.js";
import Raffle from "../models/Raffle.js";
import User from "../models/User.js";
iimport { client, Preference } from "../config/mercadopago.js";




// 🔹 Recebe notificações do Mercado Pago
export const handleMercadoPagoWebhook = async (req, res) => {
  try {
    const { action, data } = req.body;

    if (action !== "payment.created" && action !== "payment.updated") {
      return res.status(200).json({ message: "Evento ignorado." });
    }

    const paymentId = data.id;
    const payment = await mercadopagoClient.payment.findById(paymentId);

    if (!payment || !payment.body) {
      console.error("Pagamento não encontrado no Mercado Pago:", paymentId);
      return res.status(404).json({ error: "Pagamento não encontrado." });
    }

    const status = payment.body.status;
    const metadata = payment.body.metadata;

    const order = await Order.findOne({ mpPreferenceId: payment.body.order.id });
    if (!order) {
      console.error("Ordem não encontrada:", payment.body.order.id);
      return res.status(404).json({ error: "Ordem não encontrada." });
    }

    // Atualiza status da ordem
    order.status = status;
    order.mpPaymentId = paymentId;
    await order.save();

    // Se pagamento aprovado → vincula os números à rifa e ao usuário
    if (status === "approved" && metadata?.cart) {
      const user = await User.findById(metadata.userId);

      for (const item of metadata.cart) {
        const rifa = await Raffle.findById(item.raffleId);
        if (rifa) {
          rifa.numerosVendidos.push(...item.numeros);
          await rifa.save();
        }

        user.purchases.push({
          raffleId: item.raffleId,
          numeros: item.numeros,
          precoUnit: item.precoUnit,
          paymentId,
          date: new Date(),
        });
      }

      await user.save();
    }

    res.status(200).json({ message: "Webhook processado com sucesso." });
  } catch (err) {
    console.error("Erro no webhook:", err);
    res.status(500).json({ error: "Erro ao processar webhook." });
  }
};
