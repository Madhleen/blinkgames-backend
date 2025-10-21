import request from "supertest";
import app from "../../server.js";

describe("Webhook do Mercado Pago", () => {
  test("Deve ignorar eventos desconhecidos", async () => {
    const res = await request(app).post("/api/webhooks/mercadopago").send({
      action: "random.event",
      data: { id: "123" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Evento ignorado.");
  });

  test("Deve retornar erro se faltar dados", async () => {
    const res = await request(app).post("/api/webhooks/mercadopago").send({});
    expect([400, 500]).toContain(res.statusCode);
  });
});
