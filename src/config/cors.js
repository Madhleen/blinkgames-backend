import cors from "cors";

const allowedOrigins = [
  "https://blinkgamesrifa.vercel.app", // seu frontend
  "http://localhost:5173",             // ambiente local (vite)
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Origem não permitida pelo CORS"));
    }
  },
  credentials: true,
}));

