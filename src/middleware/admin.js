import dotenv from "dotenv";
dotenv.config();

export const adminMiddleware = (req, res, next) => {
  const queryKey = req.query.key;
  const bodyKey = req.body?.key;
  const headerKey = req.header("x-admin-key");
  const validKey = process.env.ADMIN_KEY;

  if (queryKey === validKey || bodyKey === validKey || headerKey === validKey) {
    return next();
  }

  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Acesso negado. Permissão de admin necessária." });
  }

  next();
};

