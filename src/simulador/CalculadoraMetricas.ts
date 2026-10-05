import { DatosMetricas, ICalculadoraMetricas, Metricas } from "./Metricas.js";

// Aplica las formulas de la consigna (RF09). Separada del Simulador
// para que cada clase tenga una sola responsabilidad.
export class CalculadoraMetricas implements ICalculadoraMetricas {
  calcular(datos: DatosMetricas): Metricas {
    return {
      ocupacionMemoria: (100 * datos.memoriaOcupada) / datos.memoriaTotal,
      utilizacionCpu: this.utilizacionCpu(datos),
      cambiosContexto: datos.cambiosContexto,
      memoriaLibreTotal: datos.memoriaLibreTotal,
      mayorBloqueLibre: datos.mayorBloqueLibre,
      fragmentacionExterna: this.fragmentacionExterna(datos),
    };
  }

  // 100 x ticks con CPU ocupada / ticks transcurridos. En el tick 0 es 0%.
  private utilizacionCpu(datos: DatosMetricas): number {
    if (datos.ticksTranscurridos === 0) return 0;
    return (100 * datos.ticksCpuOcupada) / datos.ticksTranscurridos;
  }

  // 100 x (1 - mayor bloque libre / memoria libre total). Sin memoria libre es 0%.
  private fragmentacionExterna(datos: DatosMetricas): number {
    if (datos.memoriaLibreTotal === 0) return 0;
    return 100 * (1 - datos.mayorBloqueLibre / datos.memoriaLibreTotal);
  }
}