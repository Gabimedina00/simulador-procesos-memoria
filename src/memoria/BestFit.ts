import { BloqueMemoria } from "./BloqueMemoria.js";
import { PoliticaAsignacionBase } from "./PoliticaAsignacionBase.js";

// Elige el hueco suficiente mas chico. Con '<' estricto, ante empate
// se queda con el primero, que es el de menor direccion.
export class BestFit extends PoliticaAsignacionBase {
  elegirBloque(bloques: readonly BloqueMemoria[], tamano: number): BloqueMemoria | null {
    return this.candidatos(bloques, tamano).reduce<BloqueMemoria | null>(
      (mejor, b) => (mejor === null || b.getTamano() < mejor.getTamano() ? b : mejor),
      null,
    );
  }

  toString(): string { return "BestFit"; }
}