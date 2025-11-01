import nodemailer from "nodemailer";
import sgTransport from "nodemailer-sendgrid";
import dotenv from "dotenv";

dotenv.config();

export const transporter = nodemailer.createTransport(
  sgTransport({
    apiKey: process.env.SENDGRID_API_KEY,
  })
);

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Erro ao configurar o SendGrid:", error);
  } else {
    console.log("✅ SendGrid pronto para envio de e-mails!");
  }
});

