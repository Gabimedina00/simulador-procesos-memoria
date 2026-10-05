// Punto de entrada de la biblioteca: solo reexporta las clases publicas.
// No es un main ni ejecuta nada (la consigna pide biblioteca sin consola).
export { EstadoProceso } from "./procesos/EstadoProceso.js";
export { Proceso } from "./procesos/Proceso.js";
export type { IProceso, VistaProceso } from "./procesos/IProceso.js";
export { BloqueMemoria } from "./memoria/BloqueMemoria.js";
export type { IBloqueMemoria, VistaBloque } from "./memoria/IBloqueMemoria.js";
export { GestorMemoria } from "./memoria/GestorMemoria.js";
export type { IGestorMemoria } from "./memoria/IGestorMemoria.js";
export type { IPoliticaAsignacion } from "./memoria/IPoliticaAsignacion.js";
export { PoliticaAsignacionBase } from "./memoria/PoliticaAsignacionBase.js";
export { FirstFit } from "./memoria/FirstFit.js";
export { BestFit } from "./memoria/BestFit.js";
export { WorstFit } from "./memoria/WorstFit.js";
export { EventoCpu } from "./planificacion/IPlanificador.js";
export type { IPlanificador, ResultadoCpu } from "./planificacion/IPlanificador.js";
export { PlanificadorRoundRobin } from "./planificacion/PlanificadorRoundRobin.js";
export { CalculadoraMetricas } from "./simulador/CalculadoraMetricas.js";
export type { Metricas, DatosMetricas, ICalculadoraMetricas } from "./simulador/Metricas.js";
export type { ConfiguracionSimulacion } from "./simulador/ConfiguracionSimulacion.js";
export type { ISimulador, ResultadoTick } from "./simulador/ISimulador.js";
export { Simulador } from "./simulador/Simulador.js";