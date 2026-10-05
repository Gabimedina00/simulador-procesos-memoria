// Foto de solo lectura de un bloque, para exponer el mapa de memoria (RF10)
export interface VistaBloque {
  readonly inicio: number;
  readonly tamano: number;
  readonly pid: number | null;
}

// Contrato de un tramo contiguo de memoria
export interface IBloqueMemoria {
  getInicio(): number;
  getTamano(): number;
  getPid(): number | null;
  estaLibre(): boolean;
  asignar(pid: number): void;
  liberar(): void;
  aVista(): VistaBloque;
}