// ============================================================
// 🧠 BlinkGames — middlewares/auth.js (v7.6 — Produção Final)
// ============================================================

import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ------------------------------------------------------------
    // 🚨 1. Sem token → bloqueia
    // ------------------------------------------------------------
    if (!authHeader || authHeader === "Bearer undefined") {
      return res.status(401).json({ error: "Token ausente." });
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2) {
      return res.status(401).json({ error: "Token malformado." });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
      return res.status(401).json({ error: "Token inválido (formato)." });
    }

    if (!token || token === "undefined") {
      return res.status(401).json({ error: "Token inválido." });
    }

    // ------------------------------------------------------------
    // 🔐 2. Valida o token
    // ------------------------------------------------------------
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Garante que sempre tenha userId
    req.user = {
      id: decoded.id || decoded._id,
    };

    // ------------------------------------------------------------
    // 🚀 3. Continua fluxo
    // ------------------------------------------------------------
    return next();
  } catch (err) {
    console.error("Erro de autenticação JWT:", err.message);
    return res.status(403).json({ error: "Token inválido ou expirado." });
  }
};

