import dotenv from "dotenv";
dotenv.config();

export const adminMiddleware = (req, res, next) => {
  const queryKey = req.query.key;
  if (queryKey && queryKey === process.env.ADMIN_KEY) return next();

  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Acesso negado. Permissão de admin necessária." });
  }

  next();
};
