import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    raffle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Raffle",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    numbers: {
      type: [Number],
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 15 * 60 * 1000), // 15 min
    },
  },
  { timestamps: true }
);

// TTL index automático (libera números expirados)
reservationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Reservation", reservationSchema);

