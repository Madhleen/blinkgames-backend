// ============================================================
// 👤 BlinkGames — User.js (v6.6 corrigido e validado)
// ============================================================

import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    resetToken: String,
    resetTokenExpires: Date,

    // 🔹 Histórico de rifas compradas (usado em "Minhas Rifas")
    purchases: [
      {
        raffleId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Raffle",
        },
        numeros: [Number],
        precoUnit: Number,
        paymentId: String,
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);

