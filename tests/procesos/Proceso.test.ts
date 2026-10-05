import { describe, expect, it } from "vitest";
import { Proceso } from "../../src/procesos/Proceso.js";
import { EstadoProceso } from "../../src/procesos/EstadoProceso.js";

// Helper: crea un proceso ya admitido y despachado, listo para ejecutar
function procesoEnCpu(cpu: number): Proceso {
  const proceso = new Proceso(1, 200, cpu);
  proceso.admitir();
  proceso.despachar();
  return proceso;
}

// RF02 - Registrar y consultar procesos
describe("Proceso - Registro y validacion (RF02)", () => {
  it("se crea en estado Nuevo con sus contadores en cero", () => {
    const proceso = new Proceso(1, 200, 5);

    expect(proceso.getPid()).toBe(1);
    expect(proceso.getMemoriaRequerida()).toBe(200);
    expect(proceso.getCpuTotal()).toBe(5);
    expect(proceso.getCpuRestante()).toBe(5);
    expect(proceso.getEstado()).toBe(EstadoProceso.Nuevo);
    expect(proceso.getQuantumConsumido()).toBe(0);
    expect(proceso.getTiempoBloqueoRestante()).toBe(0);
  });

  it("rechaza datos no positivos o decimales al construirse", () => {
    expect(() => new Proceso(0, 200, 5)).toThrow("PID debe ser un entero positivo");
    expect(() => new Proceso(1.5, 200, 5)).toThrow("PID debe ser un entero positivo");
    expect(() => new Proceso(1, 0, 5)).toThrow("Memoria requerida debe ser un entero positivo");
    expect(() => new Proceso(1, 200, 0)).toThrow("CPU total debe ser un entero positivo");
  });

  it("devuelve una vista que no permite modificar el proceso", () => {
    const proceso = new Proceso(1, 200, 5);
    const vista = proceso.aVista() as { cpuRestante: number };

    vista.cpuRestante = 0;

    expect(proceso.getCpuRestante()).toBe(5);
  });
});

// RF03 - Estados y admision
describe("Proceso - Estados y admision (RF03)", () => {
  it("si no hay memoria pasa de Nuevo a Esperando Memoria", () => {
    const proceso = new Proceso(1, 200, 5);

    proceso.esperarMemoria();

    expect(proceso.getEstado()).toBe(EstadoProceso.EsperandoMemoria);
  });

  it("se admite desde Nuevo o desde Esperando Memoria", () => {
    const nuevo = new Proceso(1, 200, 5);
    const enEspera = new Proceso(2, 200, 5);
    enEspera.esperarMemoria();

    nuevo.admitir();
    enEspera.admitir();

    expect(nuevo.getEstado()).toBe(EstadoProceso.Listo);
    expect(enEspera.getEstado()).toBe(EstadoProceso.Listo);
  });

  it("un proceso Listo no puede volver a esperar memoria", () => {
    const proceso = new Proceso(1, 200, 5);
    proceso.admitir();

    expect(() => proceso.esperarMemoria()).toThrow("Transicion invalida");
  });
});

// RF07 - Ejecucion con Round Robin (lo que le corresponde al Proceso)
describe("Proceso - Ejecucion y quantum (RF07)", () => {
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
    expect(proceso.terminado()).toBe(false);
    proceso.ejecutarTick();
    expect(proceso.terminado()).toBe(true);

    proceso.terminar();
    expect(proceso.getEstado()).toBe(EstadoProceso.Terminado);
  });

  it("no se puede terminar si todavia le queda CPU", () => {
    const proceso = procesoEnCpu(2);

    expect(() => proceso.terminar()).toThrow("El proceso todavia tiene CPU restante");
  });

  it("renovar el quantum lo deja en cero sin sacarlo de la CPU", () => {
    const proceso = procesoEnCpu(5);
    proceso.ejecutarTick();
    proceso.ejecutarTick();

    proceso.renovarQuantum();

    expect(proceso.getQuantumConsumido()).toBe(0);
    expect(proceso.getEstado()).toBe(EstadoProceso.Ejecutando);
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

// RF08 - Simular Entrada y Salida
describe("Proceso - Entrada/Salida (RF08)", () => {
  it("rechaza eventos de E/S invalidos", () => {
    const proceso = new Proceso(1, 200, 5);

    expect(() => proceso.programarES(0, 2)).toThrow("Ticks de E/S debe ser un entero positivo");
    expect(() => proceso.programarES(5, 2)).toThrow("Ticks de E/S debe ser menor que la CPU total");
    expect(() => proceso.programarES(2, 0)).toThrow("Duracion de E/S debe ser un entero positivo");
  });

  it("rechaza un evento que ya no puede dispararse", () => {
    const proceso = procesoEnCpu(5);
    proceso.ejecutarTick();
    proceso.ejecutarTick();

    expect(() => proceso.programarES(2, 3)).toThrow("El evento de E/S ya no puede dispararse");
  });

  it("no se bloquea antes de consumir los ticks del evento", () => {
    const proceso = procesoEnCpu(5);
    proceso.programarES(2, 3);

    proceso.ejecutarTick();

    expect(proceso.debeBloquearse()).toBe(false);
  });

  it("se bloquea al consumir los ticks del evento y conserva su CPU restante", () => {
    const proceso = procesoEnCpu(5);
    proceso.programarES(1, 2);

    proceso.ejecutarTick();
    expect(proceso.debeBloquearse()).toBe(true);

    proceso.bloquear();
    expect(proceso.getEstado()).toBe(EstadoProceso.Bloqueado);
    expect(proceso.getCpuRestante()).toBe(4);
    expect(proceso.getTiempoBloqueoRestante()).toBe(2);
  });

  it("no consume CPU mientras esta bloqueado", () => {
    const proceso = procesoEnCpu(5);
    proceso.programarES(1, 2);
    proceso.ejecutarTick();
    proceso.bloquear();

    expect(() => proceso.ejecutarTick()).toThrow("Transicion invalida");
    expect(proceso.getCpuRestante()).toBe(4);
  });

  it("vuelve a Listo cuando vence el tiempo de bloqueo", () => {
    const proceso = procesoEnCpu(5);
    proceso.programarES(1, 2);
    proceso.ejecutarTick();
    proceso.bloquear();

    proceso.avanzarBloqueo();
    expect(() => proceso.desbloquear()).toThrow("El bloqueo todavia no vencio");

    proceso.avanzarBloqueo();
    proceso.desbloquear();
    expect(proceso.getEstado()).toBe(EstadoProceso.Listo);
  });
});