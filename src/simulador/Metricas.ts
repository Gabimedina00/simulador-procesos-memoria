// Metricas del sistema al final de un tick (RF09). Porcentajes de 0 a 100.
export interface Metricas {
  readonly ocupacionMemoria: number;
  readonly utilizacionCpu: number;
  readonly cambiosContexto: number;
  readonly memoriaLibreTotal: number;
  readonly mayorBloqueLibre: number;
  readonly fragmentacionExterna: number;
}

// Datos crudos que necesita la calculadora
export interface DatosMetricas {
  readonly memoriaTotal: number;
  readonly memoriaOcupada: number;
  readonly memoriaLibreTotal: number;
  readonly mayorBloqueLibre: number;
  readonly ticksCpuOcupada: number;
  readonly ticksTranscurridos: number;
  readonly cambiosContexto: number;
}

// Contrato de quien calcula las metricas
export interface ICalculadoraMetricas {
  calcular(datos: DatosMetricas): Metricas;
}