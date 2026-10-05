// Tramo contiguo de memoria: tiene un inicio, un tamaño y puede estar
// libre o asignado a un proceso (guardamos solo su PID para no acoplar
// la memoria a la clase Proceso).
export class BloqueMemoria {
  private readonly inicio: number;
  private tamano: number;
  private pid: number | null = null;

  constructor(inicio: number, tamano: number) {
    if (!Number.isInteger(inicio) || inicio < 0) throw new Error("Inicio invalido");
    if (!Number.isInteger(tamano) || tamano <= 0) throw new Error("Tamaño invalido");
    this.inicio = inicio;
    this.tamano = tamano;
  }

  getInicio(): number { return this.inicio; }
  getTamano(): number { return this.tamano; }
  getPid(): number | null { return this.pid; }
  estaLibre(): boolean { return this.pid === null; }

  // Marca el bloque como ocupado por un proceso
  asignar(pid: number): void {
    if (!this.estaLibre()) throw new Error("El bloque ya esta ocupado");
    this.pid = pid;
  }

  // Vuelve el bloque a libre (la fusion con vecinos la hace el gestor, RF05)
  liberar(): void {
    this.pid = null;
  }

  // Se queda con 'tamanoPedido' y devuelve el resto como un bloque libre
  // que empieza justo donde termina este. Nunca genera bloques de tamaño 0.
  dividir(tamanoPedido: number): BloqueMemoria {
    if (!Number.isInteger(tamanoPedido) || tamanoPedido <= 0 || tamanoPedido >= this.tamano) {
      throw new Error("Division invalida");
    }
    const sobrante = new BloqueMemoria(this.inicio + tamanoPedido, this.tamano - tamanoPedido);
    this.tamano = tamanoPedido;
    return sobrante;
  }
}