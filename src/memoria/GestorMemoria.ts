import { BloqueMemoria } from "./BloqueMemoria.js";
import { VistaBloque } from "./IBloqueMemoria.js";
import { IGestorMemoria } from "./IGestorMemoria.js";
import { IPoliticaAsignacion } from "./IPoliticaAsignacion.js";

// Administra la memoria como una lista de bloques contiguos ordenados por direccion.
// Recibe la politica por constructor: depende de la interfaz, no de FirstFit/BestFit/WorstFit
// (inversion de dependencias). Por eso no hay ningun if que pregunte que politica es.
export class GestorMemoria implements IGestorMemoria {
  private readonly memoriaTotal: number;
  private readonly politica: IPoliticaAsignacion;
  private readonly bloques: BloqueMemoria[];

  // Arranca con un unico bloque libre que abarca toda la memoria (RF01)
  constructor(memoriaTotal: number, politica: IPoliticaAsignacion) {
    if (!Number.isInteger(memoriaTotal) || memoriaTotal <= 0) {
      throw new Error("Memoria total debe ser un entero positivo");
    }
    this.memoriaTotal = memoriaTotal;
    this.politica = politica;
    this.bloques = [new BloqueMemoria(0, memoriaTotal)];
  }

  // Asigna un bloque contiguo al proceso (RF04). Si sobra espacio, divide el bloque.
  // Si ningun hueco alcanza devuelve false y no toca nada, aunque la suma libre alcance.
  asignar(pid: number, tamano: number): boolean {
    if (!Number.isInteger(tamano) || tamano <= 0) throw new Error("Tamaño solicitado invalido");
    if (this.tieneMemoria(pid)) throw new Error("El proceso ya tiene memoria asignada");

    const elegido = this.politica.elegirBloque(this.bloques, tamano);
    if (elegido === null) return false;

    if (elegido.getTamano() > tamano) {
      const sobrante = elegido.dividir(tamano);
      this.bloques.splice(this.bloques.indexOf(elegido) + 1, 0, sobrante);
    }
    elegido.asignar(pid);
    return true;
  }

  // Libera el bloque del proceso y lo fusiona con sus vecinos libres (RF05)
  liberar(pid: number): void {
    const indice = this.bloques.findIndex((b) => b.getPid() === pid);
    if (indice === -1) throw new Error("El proceso no tiene memoria asignada");
    this.bloques[indice]!.liberar();
    this.fusionarVecinos(indice);
  }

  // Coalescencia: primero con el vecino derecho, despues con el izquierdo.
  // No mueve bloques ocupados, por eso no es compactacion.
  private fusionarVecinos(indice: number): void {
    const actual = this.bloques[indice]!;
    const derecho = this.bloques[indice + 1];
    if (derecho?.estaLibre()) {
      actual.absorber(derecho);
      this.bloques.splice(indice + 1, 1);
    }
    const izquierdo = this.bloques[indice - 1];
    if (izquierdo?.estaLibre()) {
      izquierdo.absorber(actual);
      this.bloques.splice(indice, 1);
    }
  }

  tieneMemoria(pid: number): boolean {
    return this.bloques.some((b) => b.getPid() === pid);
  }

  // Devuelve copias: modificar el resultado no altera la memoria real (RF10)
  getMapa(): VistaBloque[] {
    return this.bloques.map((b) => b.aVista());
  }

  getMemoriaTotal(): number { return this.memoriaTotal; }

  getMemoriaLibreTotal(): number {
    return this.bloques.filter((b) => b.estaLibre()).reduce((suma, b) => suma + b.getTamano(), 0);
  }

  getMemoriaOcupada(): number {
    return this.memoriaTotal - this.getMemoriaLibreTotal();
  }

  // Tamaño del hueco libre mas grande; 0 si la memoria esta llena (RF09)
  getMayorBloqueLibre(): number {
    return this.bloques.filter((b) => b.estaLibre()).reduce((max, b) => Math.max(max, b.getTamano()), 0);
  }
}