export const errorHandler = (err, req, res, next) => {
  console.error("Erro capturado:", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Erro interno no servidor.";

  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
