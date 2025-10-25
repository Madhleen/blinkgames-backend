// src/config/cors.js
const allowedOrigins = [
  "https://blinkgamesrifa.vercel.app",
  "https://blinkgames-frontend.vercel.app",
  "http://localhost:5173",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Origem não permitida pelo CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,

  // 🧩 adicione isto ↓
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-admin-key"],
};

export default corsOptions;

