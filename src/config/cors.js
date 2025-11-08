// ============================================================
// 🌐 BlinkGames — config/cors.js (v7.7 Produção Corrigido)
// ============================================================

const allowedOrigins = [
  "https://blinkgamesrifa.vercel.app",
  "https://blinkgames-frontend.vercel.app",
  "https://blinkgames-frontend-ibl2lz0wx-madhleens-projects.vercel.app",
  "https://blinkgames-frontend-r0eo0jk1q-madhleens-projects.vercel.app",
  "https://blinkgames-frontend-4qx5kvagp-madhleens-projects.vercel.app", // 🟢 novo domínio vercel liberado
  "http://localhost:5173",
  "http://127.0.0.1:5500",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      console.log("✅ CORS liberado para:", origin || "requisição interna");
      callback(null, true);
    } else {
      console.warn("🚫 CORS bloqueado para:", origin);
      callback(new Error("CORS não permitido"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-admin-key"],
};

export default corsOptions;

