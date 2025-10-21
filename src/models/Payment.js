import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    method: String,
    payerEmail: String,
    raw: Object, // snapshot completo retornado pelo Mercado Pago
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);

