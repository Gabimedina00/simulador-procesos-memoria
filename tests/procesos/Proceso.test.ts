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

// RF07 - Ejecucion con Round Robin (lo que le corresponde al Proceso)
describe("Proceso - Ejecucion y quantum (RF07)", () => {
  // Helper: crea un proceso ya admitido y despachado, listo para ejecutar
  function procesoEnCpu(cpu: number): Proceso {
    const proceso = new Proceso(1, 200, cpu);
    proceso.admitir();
    proceso.despachar();
    return proceso;
  }

  it("al despacharse pasa a Ejecutando con el quantum en cero", () => {
    const proceso = procesoEnCpu(3);

    expect(proceso.getEstado()).toBe(EstadoProceso.Ejecutando);
    expect(proceso.getQuantumConsumido()).toBe(0);
  });

  it("cada tick ejecutado baja la CPU restante y sube el quantum", () => {
    const proceso = procesoEnCpu(3);

    proceso.ejecutarTick();

    expect(proceso.getCpuRestante()).toBe(2);
    expect(proceso.getQuantumConsumido()).toBe(1);
  });

  it("termina cuando la CPU restante llega a cero", () => {
    const proceso = procesoEnCpu(2);

    proceso.ejecutarTick();
    expect(proceso.haTerminado()).toBe(false);
    proceso.ejecutarTick();
    expect(proceso.haTerminado()).toBe(true);

    proceso.terminar();
    expect(proceso.getEstado()).toBe(EstadoProceso.Terminado);
  });

  it("al ser expulsado vuelve a Listo y al redespacharse reinicia el quantum", () => {
    const proceso = procesoEnCpu(5);
    proceso.ejecutarTick();
    proceso.ejecutarTick();

    proceso.expulsar();
    expect(proceso.getEstado()).toBe(EstadoProceso.Listo);

    proceso.despachar();
    expect(proceso.getQuantumConsumido()).toBe(0);
    expect(proceso.getCpuRestante()).toBe(3); // la CPU consumida no se pierde
  });

  it("no permite transiciones invalidas", () => {
    const proceso = new Proceso(1, 200, 3);

    expect(() => proceso.ejecutarTick()).toThrow("Transicion invalida");  // no esta en CPU
    expect(() => proceso.despachar()).toThrow("Transicion invalida");     // todavia no fue admitido
  });
});