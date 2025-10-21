import { gerarNumerosUnicos } from "../../utils/numberGenerator.js";

describe("Geração de números únicos", () => {
  test("Deve gerar a quantidade correta de números", () => {
    const numeros = gerarNumerosUnicos(5, 100);
    expect(numeros.length).toBe(5);
  });

  test("Não deve gerar números duplicados", () => {
    const numeros = gerarNumerosUnicos(100, 1000);
    const set = new Set(numeros);
    expect(set.size).toBe(numeros.length);
  });

  test("Deve evitar números já ocupados", () => {
    const ocupados = [1, 2, 3, 4, 5];
    const numeros = gerarNumerosUnicos(5, 10, ocupados);
    numeros.forEach((n) => {
      expect(ocupados.includes(n)).toBe(false);
    });
  });
});
