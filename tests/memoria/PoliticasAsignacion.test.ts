import { describe, expect, it } from "vitest";
import { BloqueMemoria } from "../../src/memoria/BloqueMemoria.js";
import { FirstFit } from "../../src/memoria/FirstFit.js";
import { BestFit } from "../../src/memoria/BestFit.js";
import { WorstFit } from "../../src/memoria/WorstFit.js";

// Mapa de prueba (1000 KB): libre 200@0, ocupado 100@200, libre 500@300,
// ocupado 100@800, libre 100@900
function mapaConHuecos(): BloqueMemoria[] {
  const bloques = [
    new BloqueMemoria(0, 200),
    new BloqueMemoria(200, 100),
    new BloqueMemoria(300, 500),
    new BloqueMemoria(800, 100),
    new BloqueMemoria(900, 100),
  ];
  bloques[1]!.asignar(1);
  bloques[3]!.asignar(2);
  return bloques;
}

// RF04 - Cada politica elige un hueco distinto ante el mismo pedido
describe("Politicas de asignacion (RF04)", () => {
  it("FirstFit elige el primer hueco suficiente por direccion", () => {
    expect(new FirstFit().elegirBloque(mapaConHuecos(), 100)?.getInicio()).toBe(0);
  });

  it("BestFit elige el hueco suficiente mas chico", () => {
    expect(new BestFit().elegirBloque(mapaConHuecos(), 100)?.getInicio()).toBe(900);
    expect(new BestFit().elegirBloque(mapaConHuecos(), 150)?.getInicio()).toBe(0);
  });

  it("WorstFit elige el hueco suficiente mas grande", () => {
    expect(new WorstFit().elegirBloque(mapaConHuecos(), 100)?.getInicio()).toBe(300);
  });

  it("ante empate de tamaño eligen la menor direccion", () => {
    const empate = [new BloqueMemoria(0, 100), new BloqueMemoria(100, 100)];
    empate[0]!.asignar(9);
    empate[0]!.liberar(); // dos huecos libres de 100

    expect(new BestFit().elegirBloque(empate, 100)?.getInicio()).toBe(0);
    expect(new WorstFit().elegirBloque(empate, 100)?.getInicio()).toBe(0);
  });

  // Polimorfismo: las tres cumplen el mismo contrato, el test no sabe cual es
  it.each([new FirstFit(), new BestFit(), new WorstFit()])(
    "%s devuelve null si ningun hueco alcanza",
    (politica) => {
      expect(politica.elegirBloque(mapaConHuecos(), 600)).toBeNull();
    },
  );
});