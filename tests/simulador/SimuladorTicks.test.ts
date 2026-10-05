import { describe, expect, it } from "vitest";
import { Simulador } from "../../src/simulador/Simulador.js";
import { EventoCpu } from "../../src/planificacion/IPlanificador.js";
import { EstadoProceso } from "../../src/procesos/EstadoProceso.js";

// Avanza n ticks y devuelve que PID uso la CPU en cada uno (null = ociosa)
function avanzar(sim: Simulador, ticks: number): (number | null)[] {
  const traza: (number | null)[] = [];
  for (let i = 0; i < ticks; i++) traza.push(sim.avanzarTick().pidEjecutado);
  return traza;
}

// RF06 - Avanzar un tick de forma determinista
describe("Simulador - Orden de fases del tick (RF06)", () => {
  it("cada llamada avanza un tick y lo admitido en la fase 1 se ejecuta en la fase 3", () => {
    const sim = new Simulador({ memoriaTotal: 1024, quantum: 2 });
    sim.registrarProceso(1, 100, 3);

    const resultado = sim.avanzarTick();

    expect(resultado.tick).toBe(1);
    expect(resultado.pidEjecutado).toBe(1);
    expect(sim.getProceso(1).cpuRestante).toBe(2);
  });

  it("la memoria liberada al final de un tick recien se usa en la admision del siguiente", () => {
    const sim = new Simulador({ memoriaTotal: 1000, quantum: 2 });
    sim.registrarProceso(1, 1000, 1);
    sim.registrarProceso(2, 1000, 2);

    sim.avanzarTick(); // P1 termina y libera, pero P2 ya paso por la admision
    expect(sim.getProceso(2).estado).toBe(EstadoProceso.EsperandoMemoria);

    sim.avanzarTick();
    expect(sim.getProceso(2).cpuRestante).toBe(1);
  });

  it("sin procesos la CPU queda ociosa y la utilizacion cuenta ese tick", () => {
    const sim = new Simulador({ memoriaTotal: 1024, quantum: 2 });
    sim.registrarProceso(1, 100, 1);

    avanzar(sim, 1);
    expect(sim.avanzarTick()).toEqual({ tick: 2, pidEjecutado: null, evento: EventoCpu.Ociosa });
    expect(sim.getMetricas().utilizacionCpu).toBe(50);
  });
});

// RF08 - Entrada/Salida integrada en el simulador
describe("Simulador - Entrada/Salida (RF08)", () => {
  it("bloquea, conserva memoria, no consume CPU y vuelve a Listos al vencer", () => {
    const sim = new Simulador({ memoriaTotal: 1024, quantum: 2 });
    sim.registrarProceso(1, 200, 4);
    sim.programarES(1, 1, 2); // tras 1 tick de CPU, se bloquea 2 ticks

    expect(sim.avanzarTick().evento).toBe(EventoCpu.Bloqueado);
    expect(sim.getBloqueados()).toEqual([1]);
    expect(sim.getMapaMemoria()[0]).toEqual({ inicio: 0, tamano: 200, pid: 1 });

    expect(sim.avanzarTick().pidEjecutado).toBeNull();   // tick 2: sigue bloqueado
    expect(sim.getProceso(1).cpuRestante).toBe(3);

    expect(sim.avanzarTick().pidEjecutado).toBe(1);      // tick 3: vence y se despacha
    expect(sim.getBloqueados()).toEqual([]);
    expect(sim.getMetricas().cambiosContexto).toBe(1);
  });
});

// Escenario de referencia del main.py de Sistemas Operativos (RF04, RF05, RF07, RF09)
describe("Simulador - Escenario de referencia de la catedra", () => {
  it("reproduce la traza del main.py: ejecucion, cola de Listos, espera y fragmentacion", () => {
    const sim = new Simulador({ memoriaTotal: 1024, quantum: 2 });
    sim.registrarProceso(1, 200, 4);
    sim.registrarProceso(2, 350, 3);
    sim.registrarProceso(3, 150, 2);
    sim.registrarProceso(4, 400, 3);

    expect(avanzar(sim, 6)).toEqual([1, 1, 2, 2, 3, 3]);
    expect(sim.getEsperandoMemoria()).toEqual([4]); // no entra hasta que termine P3

    expect(avanzar(sim, 2)).toEqual([1, 1]);
    expect(sim.getColaListos()).toEqual([2, 4]);
    expect(sim.getMetricas().fragmentacionExterna).toBeCloseTo(27.01, 2); // tick 8: huecos de 200 y 74 KB

    expect(avanzar(sim, 4)).toEqual([2, 4, 4, 4]);
    expect(sim.getMetricas().cambiosContexto).toBe(2);
    expect(sim.getMapaMemoria()).toEqual([{ inicio: 0, tamano: 1024, pid: null }]);
  });
});