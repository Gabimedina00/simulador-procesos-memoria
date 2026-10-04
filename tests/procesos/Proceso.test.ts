import { describe, expect, it } from "vitest";
import { Proceso } from "../../src/procesos/Proceso.js";
import { EstadoProceso } from "../../src/procesos/EstadoProceso.js";

// RF02 - Registrar y consultar procesos
describe("Proceso - Registro y validacion (RF02)", () => {
  it("se crea en estado Nuevo con sus contadores en cero", () => {
    const proceso = new Proceso(1, 200, 5);

    expect(proceso.getPid()).toBe(1);
    expect(proceso.getMemoriaRequerida()).toBe(200);
    expect(proceso.getCpuRestante()).toBe(5);
    expect(proceso.getEstado()).toBe(EstadoProceso.Nuevo);
    expect(proceso.getQuantumConsumido()).toBe(0);
  });

  it("rechaza datos no positivos o decimales al construirse", () => {
    expect(() => new Proceso(0, 200, 5)).toThrow("PID debe ser un entero positivo");
    expect(() => new Proceso(1.5, 200, 5)).toThrow("PID debe ser un entero positivo");
    expect(() => new Proceso(1, 0, 5)).toThrow("Memoria requerida debe ser un entero positivo");
    expect(() => new Proceso(1, 200, 0)).toThrow("CPU total debe ser un entero positivo");
  });
});
