import dotenv from "dotenv";
dotenv.config();

export const adminMiddleware = (req, res, next) => {
  // aceita por header OU por querystring
  const headerKey = req.header("x-admin-key");
  const queryKey  = req.query.key;

  const okByKey =
    (headerKey && headerKey === process.env.ADMIN_KEY) ||
    (queryKey  && queryKey  === process.env.ADMIN_KEY);

  if (okByKey) {
    // marca como admin e segue
    req.user = { ...(req.user || {}), isAdmin: true, via: "key" };
    return next();
  }

  // caminho alternativo: JWT com flag de admin
  if (req.user && (req.user.isAdmin || req.user.role === "admin")) {
    return next();
  }

  return res.status(401).json({ error: "Unauthorized" });
};


