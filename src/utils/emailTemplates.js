export const resetPasswordTemplate = (userName, resetLink) => `
  <div style="font-family: Arial, sans-serif; color: #222;">
    <h2>Olá, ${userName} 👋</h2>
    <p>Recebemos uma solicitação para redefinir sua senha na <strong>BlinkGames</strong>.</p>
    <p>Para criar uma nova senha, clique no link abaixo:</p>
    <a href="${resetLink}" style="background-color: #ff00c8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">
      Redefinir senha
    </a>
    <p style="margin-top: 20px;">Se você não fez essa solicitação, pode ignorar este e-mail.</p>
    <p>— Equipe BlinkGames 🎮</p>
  </div>
`;

export const confirmationTemplate = (userName) => `
  <div style="font-family: Arial, sans-serif; color: #222;">
    <h2>Bem-vindo à BlinkGames, ${userName}! 🚀</h2>
    <p>Sua conta foi criada com sucesso.</p>
    <p>Agora você já pode participar das rifas mais insanas do mundo gamer!</p>
    <p>Boa sorte! 🍀</p>
  </div>
`;
