import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
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
  { _id: false }
);

const cartItemSchema = new mongoose.Schema(
  {
    raffleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Raffle",
    },
    title: String,
    price: Number,
    quantity: Number,
    numeros: {
      type: [Number],
      default: [],
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId, // 🔥 puxa User certo
      ref: "User",
      required: true,
    },

    // 🔥 AGORA NÃO É MAIS OBRIGATÓRIO
    // A Order nasce sem mpPreferenceId e depois o checkout preenche
    mpPreferenceId: {
      type: String,
      default: null,
    },

    mpPaymentId: {
      type: String,
      default: null, // 🔥 ID do pagamento aprovado
    },

    // 🔹 Estrutura antiga (mantida por compatibilidade)
    itens: {
      type: [itemSchema],
      default: [],
    },

    // 🔹 Carrinho “bruto” salvo no checkout v16 (normalizedCart)
    cart: {
      type: [cartItemSchema],
      default: [],
    },

    total: {
      type: Number,
      required: true,
    },

    // 🔥 TIRA O ENUM PRA NÃO QUEBRAR COM STATUS DIFERENTE DO MP
    status: {
      type: String,
      default: "pending", // pending | approved | rejected | cancelled | error | etc
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);

