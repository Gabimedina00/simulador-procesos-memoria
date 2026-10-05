import { EstadoProceso } from "./EstadoProceso.js";

// Foto de solo lectura de un proceso. Es lo que el Simulador devuelve
// hacia afuera, asi nadie puede llamar a los metodos que cambian su estado (RF02, RF10).
export interface VistaProceso {
  readonly pid: number;
  readonly memoriaRequerida: number;
  readonly cpuTotal: number;
  readonly cpuRestante: number;
  readonly estado: EstadoProceso;
  readonly quantumConsumido: number;
  readonly tiempoBloqueoRestante: number;
}

// Contrato del proceso: que puede hacer, sin decir como.
// El planificador depende de esta interfaz y no de la clase concreta.
export interface IProceso {
  getPid(): number;
  getMemoriaRequerida(): number;
  getCpuTotal(): number;
  getCpuRestante(): number;
  getEstado(): EstadoProceso;
  getQuantumConsumido(): number;
  getTiempoBloqueoRestante(): number;

  esperarMemoria(): void;
  admitir(): void;
  despachar(): void;
  ejecutarTick(): void;
  renovarQuantum(): void;
  expulsar(): void;
  terminar(): void;
  terminado(): boolean;

  programarES(ticksDeCpu: number, duracion: number): void;
  debeBloquearse(): boolean;
  bloquear(): void;
  avanzarBloqueo(): void;
  desbloquear(): void;

  aVista(): VistaProceso;
}