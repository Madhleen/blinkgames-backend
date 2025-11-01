import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";

dotenv.config();

// Configura a API Key do SendGrid
sgMail.setApiKey(process.env.SMTP_PASS);

export const transporter = {
  sendMail: async ({ to, subject, html }) => {
    try {
      const msg = {
        to,
        from: process.env.SMTP_FROM,
        subject,
        html,
      };
      await sgMail.send(msg);
      console.log(`📧 E-mail enviado com sucesso para ${to}`);
    } catch (error) {
      console.error("❌ Erro ao enviar e-mail via SendGrid:", error.response?.body || error);
      throw error;
    }
  },
};

