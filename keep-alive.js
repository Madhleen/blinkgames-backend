// ============================================================
// BlinkGames — keep-alive.js
// Mantém o Render acordado com ping periódico
// ============================================================

import fetch from "node-fetch";

const URL = "https://blinkgames-backend-p4as.onrender.com/api/rifas"; // sua API
const INTERVALO = 10 * 60 * 1000; // 10 minutos

async function ping() {
  try {
    const res = await fetch(URL);
    console.log(`[KeepAlive] Ping enviado — ${res.status}`);
  } catch (err) {
    console.error("[KeepAlive] Falha no ping:", err.message);
  }
}

// executa logo e repete a cada 10 minutos
ping();
setInterval(ping, INTERVALO);

