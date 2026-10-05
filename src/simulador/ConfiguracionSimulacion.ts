import { IPoliticaAsignacion } from "../memoria/IPoliticaAsignacion.js";

// Parametros con los que se crea la simulacion (RF01).
// La politica es opcional: si no se indica, se usa First-Fit.
export interface ConfiguracionSimulacion {
  readonly memoriaTotal: number;
  readonly quantum: number;
  readonly politica?: IPoliticaAsignacion;
}