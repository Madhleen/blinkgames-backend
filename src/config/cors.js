// ============================================================
// 🌐 BlinkGames — config/cors.js (v7.5 Produção Estável)
// ============================================================

const allowedOrigins = [
  "https://blinkgamesrifa.vercel.app",
  "https://blinkgames-frontend.vercel.app",
  "https://blinkgames-frontend-ibl2lz0wx-madhleens-projects.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      console.log("✅ CORS liberado para:", origin || "requisicao interna");
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

