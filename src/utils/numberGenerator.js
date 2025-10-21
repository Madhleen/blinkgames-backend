/**
 * Gera números únicos aleatórios entre 1 e maxNumeros.
 * Evita duplicar números já vendidos ou reservados.
 */
export function gerarNumerosUnicos(qtd, maxNumeros, numerosOcupados = []) {
  const numerosGerados = new Set();

  while (numerosGerados.size < qtd) {
    const numero = Math.floor(Math.random() * maxNumeros) + 1;
    if (!numerosOcupados.includes(numero)) {
      numerosGerados.add(numero);
    }
  }

  return Array.from(numerosGerados);
}
