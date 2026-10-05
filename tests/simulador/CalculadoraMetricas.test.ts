import { describe, expect, it } from "vitest";
import { CalculadoraMetricas } from "../../src/simulador/CalculadoraMetricas.js";
import { DatosMetricas } from "../../src/simulador/Metricas.js";

const base: DatosMetricas = {
  memoriaTotal: 1000, memoriaOcupada: 0, memoriaLibreTotal: 1000, mayorBloqueLibre: 1000,
  ticksCpuOcupada: 0, ticksTranscurridos: 0, cambiosContexto: 0,
};

// RF09 - Formulas de las metricas
describe("CalculadoraMetricas (RF09)", () => {
  const calculadora = new CalculadoraMetricas();

  it("en el tick 0 la utilizacion de CPU es 0%", () => {
    expect(calculadora.calcular(base).utilizacionCpu).toBe(0);
  });

  it("calcula ocupacion, utilizacion y cambios de contexto", () => {
    const m = calculadora.calcular({ ...base, memoriaOcupada: 250, memoriaLibreTotal: 750, mayorBloqueLibre: 750, ticksCpuOcupada: 3, ticksTranscurridos: 4, cambiosContexto: 2 });

    expect(m.ocupacionMemoria).toBe(25);
    expect(m.utilizacionCpu).toBe(75);
    expect(m.cambiosContexto).toBe(2);
  });

  it("con huecos de 100 y 300 KB: libre 400, mayor 300 y fragmentacion 25%", () => {
    const m = calculadora.calcular({ ...base, memoriaOcupada: 600, memoriaLibreTotal: 400, mayorBloqueLibre: 300 });

    expect(m.memoriaLibreTotal).toBe(400);
    expect(m.mayorBloqueLibre).toBe(300);
    expect(m.fragmentacionExterna).toBeCloseTo(25);
  });

  it("con memoria llena la fragmentacion es 0% sin dividir por cero", () => {
    const m = calculadora.calcular({ ...base, memoriaOcupada: 1000, memoriaLibreTotal: 0, mayorBloqueLibre: 0 });

    expect(m.fragmentacionExterna).toBe(0);
    expect(m.ocupacionMemoria).toBe(100);
  });
});