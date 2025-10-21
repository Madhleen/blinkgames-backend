import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { User } from "../models/User.js";
import { validarCPF } from "../utils/cpf.js";
import { resetPasswordTemplate } from "../utils/emailTemplates.js";
import { transporter } from "../config/mailer.js";

const JWT_SECRET = process.env.JWT_SECRET;

// 🔹 Cadastro
export const register = async (req, res) => {
  try {
    const { nome, cpf, telefone, email, senha } = req.body;

    if (!validarCPF(cpf)) return res.status(400).json({ error: "CPF inválido" });
    const existingUser = await User.findOne({ $or: [{ email }, { cpf }] });
    if (existingUser) return res.status(400).json({ error: "Usuário já existe" });

    const senhaHash = await bcrypt.hash(senha, 10);
    const user = new User({ nome, cpf, telefone, email, senhaHash });
    await user.save();

    res.status(201).json({ message: "Usuário cadastrado com sucesso!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao registrar usuário" });
  }
};

// 🔹 Login
export const login = async (req, res) => {
  try {
    const { email, senha } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const isMatch = await bcrypt.compare(senha, user.senhaHash);
    if (!isMatch) return res.status(400).json({ error: "Senha incorreta" });

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: "Erro ao fazer login" });
  }
};

// 🔹 Esqueci minha senha
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado" });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExp = Date.now() + 3600000; // 1 hora
    await user.save();

    const resetLink = `${process.env.BASE_URL_FRONTEND}/reset?token=${token}`;
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: "Redefinição de senha - BlinkGames",
      html: resetPasswordTemplate(user.nome, resetLink),
    };
    await transporter.sendMail(mailOptions);

    res.json({ message: "E-mail de redefinição enviado." });
  } catch (err) {
    res.status(500).json({ error: "Erro ao enviar e-mail de redefinição." });
  }
};

// 🔹 Redefinir senha
export const resetPassword = async (req, res) => {
  try {
    const { token, novaSenha } = req.body;
    const user = await User.findOne({ resetToken: token, resetTokenExp: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ error: "Token inválido ou expirado" });

    user.senhaHash = await bcrypt.hash(novaSenha, 10);
    user.resetToken = undefined;
    user.resetTokenExp = undefined;
    await user.save();

    res.json({ message: "Senha redefinida com sucesso!" });
  } catch (err) {
    res.status(500).json({ error: "Erro ao redefinir senha." });
  }
};
