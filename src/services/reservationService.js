import Reservation from "../models/Reservation.js";

// 🔹 Cria reserva temporária (15 min)
export async function criarReserva(userId, raffleId, numeros) {
  const reserva = new Reservation({
    userId,
    raffleId,
    numeros,
    expiraEm: new Date(Date.now() + 15 * 60 * 1000), // TTL de 15 minutos
  });
  await reserva.save();
  return reserva;
}

// 🔹 Cancela reserva (ex: pagamento rejeitado ou expirada)
export async function cancelarReserva(reservaId) {
  await Reservation.findByIdAndDelete(reservaId);
}

// 🔹 Remove reservas expiradas (executado periodicamente)
export async function limparReservasExpiradas() {
  await Reservation.deleteMany({ expiraEm: { $lt: new Date() } });
}
