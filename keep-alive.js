// ============================================================
// 🔁 BlinkGames — keep-alive.js (v3.1 Corrigido)
// ============================================================
import fetch from "node-fetch";

const URL = "https://blinkgames-backend-p4as.onrender.com/api/raffles"; // ✅ corrigido

const ping = async () => {
  try {
    const res = await fetch(URL);
    console.log(`[KeepAlive] Ping enviado — ${res.status}`);
  } catch (err) {
    console.error("[KeepAlive] Falha no ping:", err.message);
  }
};

setInterval(ping, 5 * 60 * 1000);
ping();

