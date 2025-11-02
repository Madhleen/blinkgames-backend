import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: String, // 🔹 vem direto do metadata (não precisa ser ObjectId)
    },
    mpPreferenceId: {
      type: String, // 🔹 usado pra o webhook localizar o pagamento
    },
    cart: {
      type: Array, // 🔹 salva o carrinho inteiro
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
    mpPaymentId: String, // 🔹 ID real do pagamento do MP
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);


