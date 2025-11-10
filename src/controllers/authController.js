// ============================================================
// 🔐 BlinkGames — controllers/authController.js (v8.0 Produção Corrigido)
// ============================================================

import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// ============================================================
// 🔹 Gera token JWT
// ============================================================
const gerarToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// ============================================================
// 🧍‍♀️ Registro de novo usuário
// ============================================================
export const registerUser = async (req, res) => {
  try {
    const { nome, email, password, cpf } = req.body;

    if (!nome || !email || !password) {
      return res.status(400).json({ error: "Preencha todos os campos." });
    }

    const usuarioExistente = await User.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ error: "E-mail já cadastrado." });
    }

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(password, salt);

    const novoUsuario = await User.create({
      name: nome,
      email,
      cpf,
      password: senhaHash,
      role: "user",
    });

    const token = gerarToken(novoUsuario);

    res.status(201).json({
      message: "Usuário registrado com sucesso!",
      user: {
        id: novoUsuario._id,
        nome: novoUsuario.name,
        email: novoUsuario.email,
      },
      token,
    });
  } catch (err) {
    console.error("❌ Erro ao registrar usuário:", err);
    res.status(500).json({ error: "Erro interno ao registrar usuário." });
  }
};

// ============================================================
// 🔑 Login do usuário
// ============================================================
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Preencha todos os campos." });
    }

    const usuario = await User.findOne({ email }).select("+password");
    if (!usuario) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const senhaValida = await bcrypt.compare(password, usuario.password);
    if (!senhaValida) {
      return res.status(401).json({ error: "Senha incorreta." });
    }

    const token = gerarToken(usuario);

    res.json({
      message: "Login realizado com sucesso!",
      user: {
        id: usuario._id,
        nome: usuario.name,
        email: usuario.email,
        role: usuario.role,
      },
      token,
    });
  } catch (err) {
    console.error("❌ Erro no login:", err);
    res.status(500).json({ error: "Erro interno no login." });
  }
};

// ============================================================
// 👤 Perfil do usuário logado
// ============================================================
export const getProfile = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const foundUser = await User.findById(user.id).select("-password");
    if (!foundUser) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    res.json(foundUser);
  } catch (err) {
    console.error("❌ Erro ao obter perfil:", err);
    res.status(500).json({ error: "Erro ao obter perfil do usuário." });
  }
};

// ============================================================
// 🚪 Logout (simbólico — controlado no front)
// ============================================================
export const logoutUser = async (req, res) => {
  try {
    res.json({ message: "Logout realizado com sucesso!" });
  } catch (err) {
    console.error("❌ Erro no logout:", err);
    res.status(500).json({ error: "Erro ao sair da conta." });
  }
};

