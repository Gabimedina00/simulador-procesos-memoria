import { EstadoProceso } from "../procesos/EstadoProceso.js";
import { IProceso } from "../procesos/IProceso.js";
import { EventoCpu, IPlanificador, ResultadoCpu } from "./IPlanificador.js";

// Round Robin: cola FIFO de Listos y una unica CPU (RF07).
// Prioridad dentro de un tick: finalizacion > bloqueo por E/S > fin de quantum.
export class PlanificadorRoundRobin implements IPlanificador {
  private readonly quantum: number;
  private readonly colaListos: IProceso[] = [];
  private enCpu: IProceso | null = null;
  private cambiosContexto = 0;

  constructor(quantum: number) {
    if (!Number.isInteger(quantum) || quantum <= 0) {
      throw new Error("Quantum debe ser un entero positivo");
    }
    this.quantum = quantum;
  }

  // Agrega un proceso Listo al final de la cola, sin duplicados
  encolar(proceso: IProceso): void {
    if (proceso.getEstado() !== EstadoProceso.Listo) throw new Error("Solo se encolan procesos Listos");
    if (this.colaListos.includes(proceso) || this.enCpu === proceso) throw new Error("Proceso duplicado");
    this.colaListos.push(proceso);
  }

  // Despacha si la CPU esta libre y ejecuta una unidad de CPU
  ejecutarTick(): ResultadoCpu {
    this.despacharSiEstaLibre();
    const proceso = this.enCpu;
    if (proceso === null) return { proceso: null, evento: EventoCpu.Ociosa };

    proceso.ejecutarTick();

    if (proceso.terminado()) {
      proceso.terminar();
      this.enCpu = null;
      return { proceso, evento: EventoCpu.Terminado };
    }
    if (proceso.debeBloquearse()) {
      proceso.bloquear();
      this.enCpu = null;
      this.cambiosContexto++;
      return { proceso, evento: EventoCpu.Bloqueado };
    }
    if (proceso.getQuantumConsumido() >= this.quantum) {
      return this.resolverFinDeQuantum(proceso);
    }
    return { proceso, evento: EventoCpu.Continua };
  }

  // Toma el primero de la cola (FIFO). Despachar reinicia su quantum.
  private despacharSiEstaLibre(): void {
    if (this.enCpu !== null) return;
    const siguiente = this.colaListos.shift();
    if (siguiente === undefined) return;
    siguiente.despachar();
    this.enCpu = siguiente;
  }

  // Con otros Listos: vuelve al final y hay cambio de contexto.
  // Sin otros Listos: renueva el quantum y sigue, sin cambio de contexto.
  private resolverFinDeQuantum(proceso: IProceso): ResultadoCpu {
    if (this.colaListos.length === 0) {
      proceso.renovarQuantum();
      return { proceso, evento: EventoCpu.Continua };
    }
    proceso.expulsar();
    this.colaListos.push(proceso);
    this.enCpu = null;
    this.cambiosContexto++;
    return { proceso, evento: EventoCpu.Expulsado };
  }

  getEnCpu(): IProceso | null { return this.enCpu; }

  // Copia de la cola: modificarla no altera el orden real
  getColaListos(): IProceso[] { return [...this.colaListos]; }

  getCambiosContexto(): number { return this.cambiosContexto; }
}