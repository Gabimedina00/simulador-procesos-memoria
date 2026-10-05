import { VistaBloque } from "./IBloqueMemoria.js";

// Contrato del administrador de memoria contigua (RF04, RF05)
export interface IGestorMemoria {
  asignar(pid: number, tamano: number): boolean;
  liberar(pid: number): void;
  tieneMemoria(pid: number): boolean;
  getMapa(): VistaBloque[];
  getMemoriaTotal(): number;
  getMemoriaOcupada(): number;
  getMemoriaLibreTotal(): number;
  getMayorBloqueLibre(): number;
}