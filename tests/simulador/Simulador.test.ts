import { describe, expect, it } from "vitest";
import { Simulador } from "../../src/simulador/Simulador.js";
import { WorstFit } from "../../src/memoria/WorstFit.js";
import { EstadoProceso } from "../../src/procesos/EstadoProceso.js";

// RF01 - Configurar e iniciar la simulacion
describe("Simulador - Configuracion e inicio (RF01)", () => {
  it("arranca en el tick 0 con un unico bloque libre, colas vacias y metricas en cero", () => {
    const sim = new Simulador({ memoriaTotal: 1024, quantum: 2 });

    expect(sim.getTick()).toBe(0);
    expect(sim.getMapaMemoria()).toEqual([{ inicio: 0, tamano: 1024, pid: null }]);
    expect(sim.getProcesoEnCpu()).toBeNull();
    expect(sim.getColaListos()).toEqual([]);
    expect(sim.getEsperandoMemoria()).toEqual([]);
    expect(sim.getBloqueados()).toEqual([]);
    expect(sim.getTerminados()).toEqual([]);
    expect(sim.getMetricas().utilizacionCpu).toBe(0);
    expect(sim.getMetricas().cambiosContexto).toBe(0);
  });

  it("rechaza memoria o quantum invalidos", () => {
    expect(() => new Simulador({ memoriaTotal: 0, quantum: 2 })).toThrow("Memoria total debe ser un entero positivo");
    expect(() => new Simulador({ memoriaTotal: 1024, quantum: 0 })).toThrow("Quantum debe ser un entero positivo");
  });

  it("usa la politica que se le pasa al configurar", () => {
    const sim = new Simulador({ memoriaTotal: 1000, quantum: 2, politica: new WorstFit() });
    sim.registrarProceso(1, 300, 1);
    sim.registrarProceso(2, 100, 10);
    sim.registrarProceso(3, 200, 10);
    sim.avanzarTick(); // P1 termina: quedan huecos de 300 KB (en 0) y 400 KB (en 600)

    sim.registrarProceso(4, 250, 5);
    sim.avanzarTick();

    expect(sim.getMapaMemoria().find((b) => b.pid === 4)?.inicio).toBe(600); // el mas grande
  });
});

// RF02 - Registrar y consultar procesos
describe("Simulador - Registro de procesos (RF02)", () => {
  it("registra un proceso en estado Nuevo", () => {
    const sim = new Simulador({ memoriaTotal: 1024, quantum: 2 });

    sim.registrarProceso(1, 200, 5);

    expect(sim.getProceso(1).estado).toBe(EstadoProceso.Nuevo);
  });

    it("rechaza PID duplicado y memoria mayor a la total", () => {
    const sim = new Simulador({ memoriaTotal: 1024, quantum: 2 });
    sim.registrarProceso(1, 200, 5);

    expect(() => sim.registrarProceso(1, 100, 3)).toThrow("PID duplicado");
    expect(() => sim.registrarProceso(2, 1025, 5)).toThrow("La memoria solicitada supera la memoria total");
  });
});

// RF03 - Gestionar estados y admision
describe("Simulador - Estados y admision (RF03)", () => {
  it("si no hay hueco queda Esperando Memoria sin frenar a los que si caben", () => {
    const sim = new Simulador({ memoriaTotal: 1000, quantum: 2 });
    sim.registrarProceso(1, 800, 5);
    sim.registrarProceso(2, 400, 5);
    sim.registrarProceso(3, 100, 5);

    sim.avanzarTick();

    expect(sim.getEsperandoMemoria()).toEqual([2]);
    expect(sim.getProceso(3).estado).toBe(EstadoProceso.Listo);
  });

  it("un proceso Terminado no vuelve a ninguna cola", () => {
    const sim = new Simulador({ memoriaTotal: 1024, quantum: 2 });
    sim.registrarProceso(1, 100, 1);

    sim.avanzarTick();
    sim.avanzarTick();

    expect(sim.getTerminados()).toEqual([1]);
    expect(sim.getColaListos()).toEqual([]);
    expect(sim.getProcesoEnCpu()).toBeNull();
  });
});

// RF10 - Consultar el estado del sistema
describe("Simulador - Consultas (RF10)", () => {
  it("devuelve copias: modificarlas no cambia el estado interno", () => {
    const sim = new Simulador({ memoriaTotal: 1024, quantum: 2 });
    sim.registrarProceso(1, 100, 5);
    sim.registrarProceso(2, 100, 5);
    sim.avanzarTick();

    sim.getColaListos().push(99);
    (sim.getMapaMemoria() as { pid: number | null }[])[0]!.pid = 99;
    (sim.getMetricas() as { cambiosContexto: number }).cambiosContexto = 50;

    expect(sim.getProcesoEnCpu()).toBe(1);
    expect(sim.getColaListos()).toEqual([2]);
    expect(sim.getMapaMemoria()[0]!.pid).toBe(1);
    expect(sim.getMetricas().cambiosContexto).toBe(0);
  });
});