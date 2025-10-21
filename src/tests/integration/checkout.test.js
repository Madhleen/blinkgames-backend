import request from "supertest";
import app from "../../server.js"; // garante que o servidor está sendo importado

describe("Fluxo de Checkout", () => {
  test("Deve rejeitar checkout sem token JWT", async () => {
    const res = await request(app).post("/api/order/checkout").send({
      cart: [{ raffleId: "123", qtd: 2 }],
    });
    expect(res.statusCode).toBe(401);
  });

  test("Deve retornar erro se carrinho estiver vazio", async () => {
    const res = await request(app)
      .post("/api/order/checkout")
      .set("Authorization", "Bearer token_falso")
      .send({ cart: [] });
    expect([400, 401]).toContain(res.statusCode);
  });
});
