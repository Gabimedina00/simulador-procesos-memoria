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
  private ticksParaES: number | null = null;   // tras cuantos ticks de CPU se dispara la E/S
  private duracionES = 0;                      // cuantos ticks dura el bloqueo
  private tiempoBloqueoRestante = 0;           // temporizador mientras esta bloqueado
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

  // Verifica que el proceso este en el estado esperado antes de cambiarlo.
  // Asi nadie puede saltarse las reglas del ciclo de vida.
  private exigirEstado(esperado: EstadoProceso): void {
    if (this.estado !== esperado) {
      throw new Error(`Transicion invalida: esta en ${this.estado}, se esperaba ${esperado}`);
    }
  }

  // Nuevo -> Listo: se le asigno memoria y entra a la cola de listos (RF03)
  admitir(): void {
    this.exigirEstado(EstadoProceso.Nuevo);
    this.estado = EstadoProceso.Listo;
  }

  // Listo -> Ejecutando: el planificador le da la CPU y reinicia su quantum (RF07)
  despachar(): void {
    this.exigirEstado(EstadoProceso.Listo);
    this.estado = EstadoProceso.Ejecutando;
    this.quantumConsumido = 0;
  }

  // Consume una unidad de CPU: un tick de ejecucion (RF07)
  ejecutarTick(): void {
    this.exigirEstado(EstadoProceso.Ejecutando);
    this.cpuRestante--;
    this.quantumConsumido++;
  }

  // Ejecutando -> Listo: se le agoto el quantum y hay otros esperando (RF07)
  expulsar(): void {
    this.exigirEstado(EstadoProceso.Ejecutando);
    this.estado = EstadoProceso.Listo;
  }

  // Ejecutando -> Terminado: ya no necesita mas CPU (RF07)
  terminar(): void {
    this.exigirEstado(EstadoProceso.Ejecutando);
    this.estado = EstadoProceso.Terminado;
  }

  // Indica si consumio toda su CPU
  terminado(): boolean {
    return this.cpuRestante === 0;
  }

  getTiempoBloqueoRestante(): number { return this.tiempoBloqueoRestante; }

  // Programa un evento de E/S determinado desde los tests (RF08).
  // ticksDeCpu debe ser menor que la CPU total: si no, el proceso terminaria antes.
  programarES(ticksDeCpu: number, duracion: number): void {
    Proceso.validarEnteroPositivo(ticksDeCpu, "Ticks de E/S");
    Proceso.validarEnteroPositivo(duracion, "Duracion de E/S");
    if (ticksDeCpu >= this.cpuTotal) {
      throw new Error("Ticks de E/S debe ser menor que la CPU total");
    }
    this.ticksParaES = ticksDeCpu;
    this.duracionES = duracion;
  }

  // True si ya consumio los ticks que disparan la E/S
  debeBloquearse(): boolean {
    const cpuConsumida = this.cpuTotal - this.cpuRestante;
    return this.ticksParaES === cpuConsumida;
  }

  // Ejecutando -> Bloqueado: libera la CPU y arranca el temporizador (RF08)
  bloquear(): void {
    this.exigirEstado(EstadoProceso.Ejecutando);
    this.estado = EstadoProceso.Bloqueado;
    this.tiempoBloqueoRestante = this.duracionES;
    this.ticksParaES = null;   // el evento ya se consumio
  }

  // Descuenta un tick del bloqueo
  avanzarBloqueo(): void {
    this.exigirEstado(EstadoProceso.Bloqueado);
    this.tiempoBloqueoRestante--;
  }

  // Bloqueado -> Listo: solo cuando el temporizador llego a cero (RF08)
  desbloquear(): void {
    this.exigirEstado(EstadoProceso.Bloqueado);
    if (this.tiempoBloqueoRestante > 0) {
      throw new Error("El bloqueo todavia no vencio");
    }
    this.estado = EstadoProceso.Listo;
  }
}

