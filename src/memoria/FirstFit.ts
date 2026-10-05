import { BloqueMemoria } from "./BloqueMemoria.js";
import { PoliticaAsignacionBase } from "./PoliticaAsignacionBase.js";

// Elige el primer hueco suficiente por direccion
export class FirstFit extends PoliticaAsignacionBase {
  elegirBloque(bloques: readonly BloqueMemoria[], tamano: number): BloqueMemoria | null {
    return this.candidatos(bloques, tamano)[0] ?? null;
  }

  toString(): string { return "FirstFit"; }
}