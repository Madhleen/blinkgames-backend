import mongoose from "mongoose";

const raffleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    totalNumbers: {
      type: Number,
      required: true,
    },
    soldNumbers: {
      type: [Number],
      default: [],
    },
    active: {
      type: Boolean,
      default: true,
    },
    drawDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Raffle", raffleSchema);

