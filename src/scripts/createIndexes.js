import mongoose from "mongoose";
import dotenv from "dotenv";
import Reservation from "../models/Reservation.js";

dotenv.config();

async function createIndexes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // 🔹 TTL index para expirar reservas em 15 minutos
    await Reservation.collection.createIndex({ expiraEm: 1 }, { expireAfterSeconds: 0 });

    console.log("✅ Índices criados com sucesso!");
    process.exit(0);
  } catch (err) {
    console.error("Erro ao criar índices:", err);
    process.exit(1);
  }
}

createIndexes();
