import { IProceso } from "../procesos/IProceso.js";

// Que paso con la CPU en un tick
export enum EventoCpu {
  Ociosa = "Ociosa",         // no habia nadie para ejecutar
  Continua = "Continua",     // ejecuto y sigue en CPU
  Expulsado = "Expulsado",   // agoto el quantum y habia otros Listos
  Bloqueado = "Bloqueado",   // se disparo su E/S
  Terminado = "Terminado",   // consumio toda su CPU
}

// Resultado de la fase de ejecucion de un tick
export interface ResultadoCpu {
  readonly proceso: IProceso | null;
  readonly evento: EventoCpu;
}

// Contrato del planificador de CPU (RF07)
export interface IPlanificador {
  encolar(proceso: IProceso): void;
  ejecutarTick(): ResultadoCpu;
  getEnCpu(): IProceso | null;
  getColaListos(): IProceso[];
  getCambiosContexto(): number;
}