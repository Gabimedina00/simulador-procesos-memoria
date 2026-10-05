import { BloqueMemoria } from "./BloqueMemoria.js";
import { PoliticaAsignacionBase } from "./PoliticaAsignacionBase.js";

// Elige el hueco suficiente mas grande. Con '>' estricto, ante empate
// se queda con el de menor direccion.
export class WorstFit extends PoliticaAsignacionBase {
  elegirBloque(bloques: readonly BloqueMemoria[], tamano: number): BloqueMemoria | null {
    return this.candidatos(bloques, tamano).reduce<BloqueMemoria | null>(
      (peor, b) => (peor === null || b.getTamano() > peor.getTamano() ? b : peor),
      null,
    );
  }

  toString(): string { return "WorstFit"; }
}