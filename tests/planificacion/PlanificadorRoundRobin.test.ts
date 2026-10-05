import { describe, expect, it } from "vitest";
import { PlanificadorRoundRobin } from "../../src/planificacion/PlanificadorRoundRobin.js";
import { EventoCpu } from "../../src/planificacion/IPlanificador.js";
import { Proceso } from "../../src/procesos/Proceso.js";
import { EstadoProceso } from "../../src/procesos/EstadoProceso.js";

// Proceso ya admitido (Listo), como lo deja el gestor de memoria
function listo(pid: number, cpu: number): Proceso {
  const proceso = new Proceso(pid, 100, cpu);
  proceso.admitir();
  return proceso;
}

// Ejecuta n ticks y devuelve que PID uso la CPU en cada uno
function ejecutar(rr: PlanificadorRoundRobin, ticks: number): (number | null)[] {
  const traza: (number | null)[] = [];
  for (let i = 0; i < ticks; i++) traza.push(rr.ejecutarTick().proceso?.getPid() ?? null);
  return traza;
}

// RF07 - Planificar la CPU con Round Robin
describe("PlanificadorRoundRobin (RF07)", () => {
  it("con Q=2, P1 con CPU 3 y P2 con CPU 2 ejecuta P1, P1, P2, P2, P1 con un cambio de contexto", () => {
    const rr = new PlanificadorRoundRobin(2);
    rr.encolar(listo(1, 3));
    rr.encolar(listo(2, 2));

    expect(ejecutar(rr, 5)).toEqual([1, 1, 2, 2, 1]);
    expect(rr.getCambiosContexto()).toBe(1);
  });

  it("un unico proceso renueva su quantum sin cambio de contexto", () => {
    const rr = new PlanificadorRoundRobin(2);
    rr.encolar(listo(1, 5));

    expect(ejecutar(rr, 5)).toEqual([1, 1, 1, 1, 1]);
    expect(rr.getCambiosContexto()).toBe(0);
  });

  it("si termina justo al agotar el quantum no se reencola y libera la CPU", () => {
    const rr = new PlanificadorRoundRobin(2);
    const p1 = listo(1, 2);
    rr.encolar(p1);
    rr.encolar(listo(2, 3));

    ejecutar(rr, 1);
    expect(rr.ejecutarTick().evento).toBe(EventoCpu.Terminado);

    expect(p1.getEstado()).toBe(EstadoProceso.Terminado);
    expect(rr.getEnCpu()).toBeNull();
    expect(rr.getColaListos().map((p) => p.getPid())).toEqual([2]);
  });

  it("el bloqueo por E/S tiene prioridad sobre el quantum y cuenta un cambio de contexto", () => {
    const rr = new PlanificadorRoundRobin(2);
    const p1 = listo(1, 5);
    p1.programarES(2, 3);
    rr.encolar(p1);
    rr.encolar(listo(2, 5));

    ejecutar(rr, 1);
    expect(rr.ejecutarTick().evento).toBe(EventoCpu.Bloqueado);
    expect(rr.getColaListos().map((p) => p.getPid())).toEqual([2]);
    expect(rr.getCambiosContexto()).toBe(1);
  });

  it("sin procesos la CPU queda ociosa", () => {
    expect(new PlanificadorRoundRobin(2).ejecutarTick()).toEqual({ proceso: null, evento: EventoCpu.Ociosa });
  });

  it("rechaza quantum invalido, procesos no Listos y duplicados", () => {
    const rr = new PlanificadorRoundRobin(2);
    const p1 = listo(1, 3);
    rr.encolar(p1);

    expect(() => new PlanificadorRoundRobin(0)).toThrow("Quantum debe ser un entero positivo");
    expect(() => rr.encolar(new Proceso(2, 100, 3))).toThrow("Solo se encolan procesos Listos");
    expect(() => rr.encolar(p1)).toThrow("Proceso duplicado");
  });
});