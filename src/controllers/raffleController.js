import Raffle from "../models/Raffle.js";
import { gerarNumerosUnicos } from "../utils/numberGenerator.js";

// 🔹 Listar rifas ativas
export const getRaffles = async (req, res) => {
  try {
    const rifas = await Raffle.find({ active: true }).sort({ createdAt: -1 });
    res.json(rifas);
  } catch (err) {
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
    res.status(500).json({ error: "Erro ao buscar rifa" });
  }
};

// 🔹 Criar nova rifa (apenas admin)
export const createRaffle = async (req, res) => {
  try {
    const { title, description, image, price, totalNumbers, drawDate } = req.body;
    const novaRifa = new Raffle({
      title,
      description,
      image,
      price,
      totalNumbers,
      drawDate,
    });
    await novaRifa.save();
    res.status(201).json(novaRifa);
  } catch (err) {
    res.status(500).json({ error: "Erro ao criar rifa" });
  }
};

// 🔹 Atualizar rifa (admin)
export const updateRaffle = async (req, res) => {
  try {
    const updated = await Raffle.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "Rifa não encontrada" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Erro ao atualizar rifa" });
  }
};

// 🔹 Desativar rifa (admin)
export const deactivateRaffle = async (req, res) => {
  try {
    const updated = await Raffle.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
    if (!updated) return res.status(404).json({ error: "Rifa não encontrada" });
    res.json({ message: "Rifa desativada com sucesso!" });
  } catch (err) {
    res.status(500).json({ error: "Erro ao desativar rifa" });
  }
};

// 🔹 Gerar números disponíveis (usado antes de comprar)
export const generateNumbers = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantidade } = req.body;
    const rifa = await Raffle.findById(id);
    if (!rifa) return res.status(404).json({ error: "Rifa não encontrada" });

    const numerosGerados = gerarNumerosUnicos(quantidade, rifa.totalNumbers, rifa.soldNumbers);
    res.json({ numeros: numerosGerados });
  } catch (err) {
    res.status(500).json({ error: "Erro ao gerar números" });
  }
};
