import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId, // 🔥 Agora puxa User certo
      ref: "User",
      required: true,
    },

    mpPreferenceId: {
      type: String, // 🔥 usado pra localizar no webhook
      required: true,
    },

    mpPaymentId: {
      type: String,
      default: null, // 🔥 ID do pagamento aprovado
    },

    itens: [
      {
        raffleId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Raffle",
        },
        numeros: {
          type: [Number], // 🔥 números comprados
          default: [],
        },
        precoUnit: Number,
        titulo: String,
      },
    ],

    cart: {
      type: Array, // 🔥 carrinho bruto — usado pelo front
      default: [],
    },

    total: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);

