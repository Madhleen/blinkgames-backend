// ============================================================
// 🎟️ BlinkGames — raffleController.js (v8.2 Produção Corrigida e Padronizada)
// ============================================================

import Raffle from "../models/Raffle.js";
import { gerarNumerosUnicos } from "../utils/numberGenerator.js";

// 🔹 Listar rifas ativas
export const getRaffles = async (req, res) => {
  try {
    const rifas = await Raffle.find({ active: true });
    const ordenadas = rifas.sort((a, b) => {
      const aTitle = (a.title || a.titulo || "").toLowerCase();
      const bTitle = (b.title || b.titulo || "").toLowerCase();
      if (aTitle.includes("ps5")) return -1;
      if (bTitle.includes("ps5")) return 1;
      return 0;
    });
    res.json(ordenadas);
  } catch (err) {
    console.error("❌ Erro ao buscar rifas:", err);
    res.status(500).json({ error: "Erro ao buscar rifas" });
  }
};

// 🔹 Detalhar uma rifa
export const getRaffleById = async (req, res) => {
  try {
    const rifa = await Raffle.findById(req.params.id);
    if (!rifa) return res.status(404).json({ error: "Rifa não encontrada" });
    res.json(rifa);
  } catch (err) {
    console.error("❌ Erro ao buscar rifa:", err);
    res.status(500).json({ error: "Erro ao buscar rifa" });
  }
};

// 🔹 Criar nova rifa
export const createRaffle = async (req, res) => {
  try {
    const {
      titulo,
      descricao,
      imagem,
      preco,
      maxNumeros,
      dataSorteio,
      title,
      description,
      image,
      price,
      totalNumbers,
      drawDate,
      ativo,
    } = req.body;

    const novaRifa = new Raffle({
      title: title || titulo,
      description: description || descricao,
      image: image || imagem,
      price: price || preco,
      totalNumbers: totalNumbers || maxNumeros,
      drawDate: drawDate || dataSorteio,
      active: ativo ?? true,
      soldNumbers: [],
    });

    await novaRifa.save();
    res.status(201).json(novaRifa);
  } catch (err) {
    console.error("❌ Erro ao criar rifa:", err);
    res.status(500).json({ error: "Erro ao criar rifa" });
  }
};

// 🔹 Atualizar rifa
export const updateRaffle = async (req, res) => {
  try {
    const updated = await Raffle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated) return res.status(404).json({ error: "Rifa não encontrada" });
    res.json(updated);
  } catch (err) {
    console.error("❌ Erro ao atualizar rifa:", err);
    res.status(500).json({ error: "Erro ao atualizar rifa" });
  }
};

// 🔹 Desativar rifa
export const deactivateRaffle = async (req, res) => {
  try {
    const updated = await Raffle.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Rifa não encontrada" });
    res.json({ message: "Rifa desativada com sucesso!" });
  } catch (err) {
    console.error("❌ Erro ao desativar rifa:", err);
    res.status(500).json({ error: "Erro ao desativar rifa" });
  }
};

// 🔹 Gerar números disponíveis
export const generateNumbers = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantidade } = req.body;
    const rifa = await Raffle.findById(id);

    if (!rifa) return res.status(404).json({ error: "Rifa não encontrada" });

    const numerosGerados = gerarNumerosUnicos(
      quantidade,
      rifa.totalNumbers,
      rifa.soldNumbers
    );

    res.json({ numeros: numerosGerados });
  } catch (err) {
    console.error("❌ Erro ao gerar números:", err);
    res.status(500).json({ error: "Erro ao gerar números" });
  }
};

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

