import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // não usa SSL direto
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // evita erro de certificado no Render
  },
  connectionTimeout: 20000, // aumenta o tempo pra evitar timeout no handshake
});

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Erro ao configurar e-mail:", error);
  } else {
    console.log("✅ Servidor de e-mail pronto para envio!");
  }
});

