// ============================================================
// 🎟️ BlinkGames — raffleController.js (v8.1 FIX RESERVA ROBUSTO)
// ============================================================

import Raffle from "../models/Raffle.js";
import { gerarNumerosUnicos } from "../utils/numberGenerator.js";

// ... (todo o resto do arquivo igual até a função reserveNumbers)

// 🔹 Reservar números da rifa (para carrinho)
export const reserveNumbers = async (req, res) => {
  try {
    const { id } = req.params;
    const { numeros } = req.body;

    if (!numeros || !Array.isArray(numeros) || numeros.length === 0) {
      return res.status(400).json({ error: "Nenhum número informado para reserva." });
    }

    const rifa = await Raffle.findById(id);
    if (!rifa) return res.status(404).json({ error: "Rifa não encontrada" });

    // 🔧 garante que o campo sempre exista
    rifa.soldNumbers = rifa.soldNumbers || [];

    // 🔒 verifica duplicações
    const disponiveis = numeros.filter((n) => !rifa.soldNumbers.includes(n));
    if (disponiveis.length !== numeros.length) {
      return res
        .status(400)
        .json({ error: "Alguns números já foram reservados ou vendidos." });
    }

    // 💾 salva a reserva
    rifa.soldNumbers.push(...disponiveis);
    await rifa.save();

    res.json({
      message: "Números reservados com sucesso!",
      numeros: disponiveis,
    });
  } catch (err) {
    console.error("💥 Erro ao reservar números:", err);
    res.status(500).json({ error: "Erro ao reservar números" });
  }
};

