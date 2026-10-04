import { EstadoProceso } from "./EstadoProceso.js";

// Representa un proceso del sistema. Protege sus datos (private) y
// solo permite leerlos mediante getters.
export class Proceso {
  private readonly pid: number;
  private readonly memoriaRequerida: number;
  private readonly cpuTotal: number;
  private cpuRestante: number;
  private estado: EstadoProceso;
  private quantumConsumido: number;

  // Valida los datos al crear: un proceso nunca nace en estado invalido (RF02)
  constructor(pid: number, memoriaRequerida: number, cpuTotal: number) {
    Proceso.validarEnteroPositivo(pid, "PID");
    Proceso.validarEnteroPositivo(memoriaRequerida, "Memoria requerida");
    Proceso.validarEnteroPositivo(cpuTotal, "CPU total");
    this.pid = pid;
    this.memoriaRequerida = memoriaRequerida;
    this.cpuTotal = cpuTotal;
    this.cpuRestante = cpuTotal;
    this.estado = EstadoProceso.Nuevo;
    this.quantumConsumido = 0;
  }

  // Lanza error si el valor no es un entero mayor a cero
  private static validarEnteroPositivo(valor: number, nombre: string): void {
    if (!Number.isInteger(valor) || valor <= 0) {
      throw new Error(`${nombre} debe ser un entero positivo`);
    }
  }

  // Getters: exponen el estado en solo lectura
  getPid(): number { return this.pid; }
  getMemoriaRequerida(): number { return this.memoriaRequerida; }
  getCpuTotal(): number { return this.cpuTotal; }
  getCpuRestante(): number { return this.cpuRestante; }
  getEstado(): EstadoProceso { return this.estado; }
  getQuantumConsumido(): number { return this.quantumConsumido; }
}
