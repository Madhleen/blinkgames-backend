import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import { validarCPF } from "../utils/cpf.js";
import { resetPasswordTemplate } from "../utils/emailTemplates.js";
import { transporter } from "../config/mailer.js";

const JWT_SECRET = process.env.JWT_SECRET;

// ============================================================
// 🧍‍♂️ Cadastro
// ============================================================
export const register = async (req, res) => {
  try {
    const nome = req.body.nome || req.body.name;
    const email = req.body.email?.toLowerCase();
    const senha = req.body.senha || req.body.password;
    const cpf = req.body.cpf;
    const telefone = req.body.telefone;

    if (!nome || !email || !senha) {
      return res.status(400).json({ error: "Preencha todos os campos obrigatórios." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Usuário já existe." });
    }

    const hash = await bcrypt.hash(senha, 10);
    const user = new User({
      name: nome,
      email,
      password: hash,
      cpf,
      telefone,
    });

    await user.save();
    res.status(201).json({ message: "Usuário cadastrado com sucesso!" });
  } catch (err) {
    console.error("❌ Erro no cadastro:", err);
    res.status(500).json({ error: "Erro ao registrar usuário" });
  }
};

// ============================================================
// 🔑 Login
// ============================================================
export const login = async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase();
    const senha = req.body.senha || req.body.password;

    if (!email || !senha) {
      return res.status(400).json({ error: "Preencha e-mail e senha." });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

    const isMatch = await bcrypt.compare(senha, user.password);
    if (!isMatch) return res.status(400).json({ error: "Email ou senha incorretos." });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login realizado com sucesso!",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("❌ Erro no login:", err);
    res.status(500).json({ error: "Erro ao fazer login" });
  }
};

// ============================================================
// ✉️ Esqueci minha senha
// ============================================================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Informe o e-mail." });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

    // Gera token aleatório
    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpires = Date.now() + 3600000; // expira em 1h
    await user.save();

    // Link de redefinição
    const resetLink = `${process.env.BASE_URL_FRONTEND}/nova-senha.html?token=${token}`;

    // Monta o e-mail
    const mailOptions = {
      from: `"BlinkGames" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Redefinição de senha - BlinkGames",
      html: resetPasswordTemplate(user.name || "usuário", resetLink),
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 E-mail de redefinição enviado para ${email}`);

    res.json({ message: "E-mail de redefinição enviado com sucesso!" });
  } catch (err) {
    console.error("❌ Erro no esqueci minha senha:", err);
    res.status(500).json({ error: "Erro ao enviar e-mail de redefinição." });
  }
};

// ============================================================
// 🔐 Redefinir senha
// ============================================================
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword)
      return res.status(400).json({ error: "Token e nova senha são obrigatórios." });

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ error: "Token inválido ou expirado." });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    res.json({ message: "Senha redefinida com sucesso!" });
  } catch (err) {
    console.error("❌ Erro ao redefinir senha:", err);
    res.status(500).json({ error: "Erro ao redefinir senha." });
  }
};

