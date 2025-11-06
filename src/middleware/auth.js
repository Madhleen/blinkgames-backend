// ============================================================
// 🧠 BlinkGames — middlewares/auth.js (v7.5 Produção Corrigida)
// ============================================================

import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Token ausente." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Garante que o ID do usuário estará disponível para o checkoutController
    req.user = { id: decoded.id };

    next();
  } catch (err) {
    console.error("Erro de autenticação JWT:", err.message);
    return res.status(403).json({ error: "Token inválido ou expirado." });
  }
};

