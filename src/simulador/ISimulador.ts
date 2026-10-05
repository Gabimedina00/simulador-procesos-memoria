import { VistaBloque } from "../memoria/IBloqueMemoria.js";
import { EventoCpu } from "../planificacion/IPlanificador.js";
import { VistaProceso } from "../procesos/IProceso.js";
import { Metricas } from "./Metricas.js";

// Lo que paso en un tick, para verificarlo desde los tests (RF06)
export interface ResultadoTick {
  readonly tick: number;
  readonly pidEjecutado: number | null;
  readonly evento: EventoCpu;
}

// Contrato del simulador: configurar, registrar, avanzar y consultar
export interface ISimulador {
  registrarProceso(pid: number, memoriaRequerida: number, cpuTotal: number): void;
  programarES(pid: number, ticksDeCpu: number, duracion: number): void;
  avanzarTick(): ResultadoTick;

  getTick(): number;
  getProceso(pid: number): VistaProceso;
  getProcesos(): VistaProceso[];
  getProcesoEnCpu(): number | null;
  getColaListos(): number[];
  getEsperandoMemoria(): number[];
  getBloqueados(): number[];
  getTerminados(): number[];
  getMapaMemoria(): VistaBloque[];
  getMetricas(): Metricas;
}