import { validarCPF } from "../../utils/cpf.js";

describe("Validação de CPF", () => {
  test("Deve validar CPFs corretos", () => {
    expect(validarCPF("111.444.777-35")).toBe(true);
  });

  test("Deve rejeitar CPFs inválidos", () => {
    expect(validarCPF("123.456.789-00")).toBe(false);
  });

  test("Deve rejeitar CPFs com formato incorreto", () => {
    expect(validarCPF("abc123")).toBe(false);
  });
});
