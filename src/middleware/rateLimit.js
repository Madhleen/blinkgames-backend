import rateLimit from "express-rate-limit";

// Limita 100 requisições por IP a cada 15 minutos
export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Muitas requisições. Tente novamente mais tarde." },
  standardHeaders: true,
  legacyHeaders: false,
});
