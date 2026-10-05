import { BloqueMemoria } from "./BloqueMemoria.js";

// Contrato comun de las politicas de asignacion contigua (RF04)
export interface IPoliticaAsignacion {
  elegirBloque(bloques: readonly BloqueMemoria[], tamano: number): BloqueMemoria | null;
}