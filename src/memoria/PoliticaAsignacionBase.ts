import { BloqueMemoria } from "./BloqueMemoria.js";
import { IPoliticaAsignacion } from "./IPoliticaAsignacion.js";

// Clase abstracta: comparte el filtro de candidatos entre las politicas.
// Cada subclase solo define COMO elige entre esos candidatos.
export abstract class PoliticaAsignacionBase implements IPoliticaAsignacion {
  // Bloques libres con tamaño suficiente, en orden de direccion
  protected candidatos(bloques: readonly BloqueMemoria[], tamano: number): BloqueMemoria[] {
    return bloques.filter((b) => b.estaLibre() && b.getTamano() >= tamano);
  }

  abstract elegirBloque(bloques: readonly BloqueMemoria[], tamano: number): BloqueMemoria | null;
}