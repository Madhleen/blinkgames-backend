import User from "../models/User.js";
import Order from "../models/Order.js";
import Raffle from "../models/Raffle.js";

// 🔹 Dashboard geral (totais e métricas)
export const getDashboard = async (req, res) => {
  try {
    const totalUsuarios = await User.countDocuments();
    const totalRifas = await Raffle.countDocuments({ ativo: true });
    const totalPagamentos = await Order.countDocuments({ status: "approved" });
    const receita = await Order.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);

    res.json({
      totalUsuarios,
      totalRifas,
      totalPagamentos,
      receita: receita[0]?.total || 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao carregar dashboard." });
  }
};

// 🔹 Listar usuários
export const listUsers = async (req, res) => {
  try {
    const users = await User.find().select("-senhaHash -resetToken -resetTokenExp");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar usuários." });
  }
};

// 🔹 Listar rifas
export const listRaffles = async (req, res) => {
  try {
    const rifas = await Raffle.find().sort({ createdAt: -1 });
    res.json(rifas);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar rifas." });
  }
};

// 🔹 Listar pagamentos
export const listPayments = async (req, res) => {
  try {
    const pagamentos = await Order.find()
      .populate("userId", "nome email cpf")
      .populate("itens.raffleId", "titulo preco")
      .sort({ createdAt: -1 });
    res.json(pagamentos);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar pagamentos." });
  }
};

// 🔹 Exportar CSV (usuários, rifas, pagamentos)
export const exportCSV = async (req, res) => {
  try {
    const tipo = req.query.tipo;

    let dados = [];
    if (tipo === "users") {
      dados = await User.find().select("nome email cpf telefone createdAt");
    } else if (tipo === "raffles") {
      dados = await Raffle.find().select("titulo preco ativo dataSorteio createdAt");
    } else if (tipo === "orders") {
      dados = await Order.find()
        .populate("userId", "nome email")
        .select("status total createdAt");
    } else {
      return res.status(400).json({ error: "Tipo inválido para exportação." });
    }

    const csv = [
      Object.keys(dados[0].toObject()).join(","),
      ...dados.map((d) => Object.values(d.toObject()).join(",")),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=${tipo}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: "Erro ao exportar CSV." });
  }
};
