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
  },
purchases: [
  {
    raffleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Raffle",
    },
{
    numeros: [Number],
    precoUnit: Number,
    paymentId: String,
    date: {
      type: Date,
      default: Date.now,
    },
  },
],
  { timestamps: true }
);

export default mongoose.model("User", userSchema);

