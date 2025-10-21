import mongoose from "mongoose";
import dotenv from "dotenv";
import Raffle from "../models/Raffle.js";

dotenv.config();

const rifasIniciais = [
  {
    titulo: "PS5 MÍDIA FÍSICA",
    descricao: "Console PlayStation 5 edição mídia física — novo, lacrado e com nota fiscal.",
    preco: 10.0,
    dataSorteio: "2025-12-31",
    imagem: "img/ps5.png",
    maxNumeros: 10000,
    ativo: true,
  },
  {
    titulo: "TECLADO + MOUSE GAMER COMBO 1",
    descricao: "Combo gamer RGB com teclado mecânico e mouse 7200 DPI.",
    preco: 1.5,
    dataSorteio: "2025-12-01",
    imagem: "img/combo1.png",
    maxNumeros: 10000,
    ativo: true,
  },
  {
    titulo: "TECLADO + MOUSE GAMER COMBO 2",
    descricao: "Combo gamer RGB com teclado e mouse óptico de alto desempenho.",
    preco: 1.5,
    dataSorteio: "2026-01-05",
    imagem: "img/combo2.png",
    maxNumeros: 10000,
    ativo: true,
  },
  {
    titulo: "TECLADO + MOUSE GAMER COMBO 3",
    descricao: "Combo gamer RGB com teclado semi-mecânico e mouse com LED.",
    preco: 1.5,
    dataSorteio: "2026-02-06",
    imagem: "img/combo3.png",
    maxNumeros: 10000,
    ativo: true,
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Raffle.deleteMany({});
    await Raffle.insertMany(rifasIniciais);
    console.log("✅ Rifas iniciais criadas com sucesso!");
    process.exit(0);
  } catch (err) {
    console.error("Erro ao popular rifas:", err);
    process.exit(1);
  }
}

seed();
