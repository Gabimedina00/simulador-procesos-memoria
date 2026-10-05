import { describe, expect, it } from "vitest";
import { GestorMemoria } from "../../src/memoria/GestorMemoria.js";
import { FirstFit } from "../../src/memoria/FirstFit.js";
import { BestFit } from "../../src/memoria/BestFit.js";
import { WorstFit } from "../../src/memoria/WorstFit.js";
import { IPoliticaAsignacion } from "../../src/memoria/IPoliticaAsignacion.js";

// Ejercicio clasico (Silberschatz): huecos de 100, 500, 200, 300 y 600 KB,
// separados por bloques ocupados de 10 KB, y pedidos de 212, 417, 112 y 426 KB en ese orden
function memoriaConHuecos(politica: IPoliticaAsignacion): GestorMemoria {
  const gestor = new GestorMemoria(1740, politica);
  const tramos = [[1, 100], [91, 10], [2, 500], [92, 10], [3, 200], [93, 10], [4, 300], [94, 10], [5, 600]];
  for (const [pid, tamano] of tramos) gestor.asignar(pid!, tamano!);
  for (const pid of [1, 2, 3, 4, 5]) gestor.liberar(pid);
  return gestor;
}

function asignarPedidos(gestor: GestorMemoria): boolean[] {
  return [[11, 212], [12, 417], [13, 112], [14, 426]].map(([pid, tamano]) => gestor.asignar(pid!, tamano!));
}

// RF04 - Las politicas se comparan con la misma carga de trabajo
describe("Comparacion de politicas con la misma carga (RF04)", () => {
  it("First-Fit no logra ubicar el pedido de 426 KB", () => {
    const gestor = memoriaConHuecos(new FirstFit());

    expect(asignarPedidos(gestor)).toEqual([true, true, true, false]);
    expect(gestor.getMemoriaLibreTotal()).toBe(959);
    expect(gestor.getMayorBloqueLibre()).toBe(300);
  });

  it("Best-Fit ubica los cuatro pedidos pero deja huecos chicos", () => {
    const gestor = memoriaConHuecos(new BestFit());

    expect(asignarPedidos(gestor)).toEqual([true, true, true, true]);
    const huecos = gestor.getMapa().filter((b) => b.pid === null).map((b) => b.tamano);
    expect(huecos).toEqual([100, 83, 88, 88, 174]);
  });

  it("Worst-Fit tampoco ubica el de 426 KB porque gasta primero el hueco mas grande", () => {
    const gestor = memoriaConHuecos(new WorstFit());

    expect(asignarPedidos(gestor)).toEqual([true, true, true, false]);
    expect(gestor.getMapa().find((b) => b.pid === 11)?.inicio).toBe(1140); // 212 KB en el hueco de 600
  });
});