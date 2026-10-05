import { FirstFit } from "../memoria/FirstFit.js";
import { GestorMemoria } from "../memoria/GestorMemoria.js";
import { VistaBloque } from "../memoria/IBloqueMemoria.js";
import { EventoCpu } from "../planificacion/IPlanificador.js";
import { PlanificadorRoundRobin } from "../planificacion/PlanificadorRoundRobin.js";
import { EstadoProceso } from "../procesos/EstadoProceso.js";
import { VistaProceso } from "../procesos/IProceso.js";
import { Proceso } from "../procesos/Proceso.js";
import { CalculadoraMetricas } from "./CalculadoraMetricas.js";
import { ConfiguracionSimulacion } from "./ConfiguracionSimulacion.js";
import { ISimulador, ResultadoTick } from "./ISimulador.js";
import { Metricas } from "./Metricas.js";

// Coordina las fases de cada tick. No asigna memoria ni planifica por si mismo:
// se lo delega a sus partes (composicion). Hacia afuera solo devuelve copias.
export class Simulador implements ISimulador {
  private readonly gestorMemoria: GestorMemoria;
  private readonly planificador: PlanificadorRoundRobin;
  private readonly calculadora = new CalculadoraMetricas();
  private readonly procesos = new Map<number, Proceso>();   // en orden de registro
  private readonly pendientes: Proceso[] = [];              // Nuevos y Esperando Memoria
  private readonly bloqueados: Proceso[] = [];
  private readonly terminados: Proceso[] = [];
  private tick = 0;
  private ticksCpuOcupada = 0;
  private metricas: Metricas;

  // RF01: valida todo antes de crear nada, asi no quedan estados parciales
  constructor(configuracion: ConfiguracionSimulacion) {
    Simulador.validarEnteroPositivo(configuracion.memoriaTotal, "Memoria total");
    Simulador.validarEnteroPositivo(configuracion.quantum, "Quantum");
    this.gestorMemoria = new GestorMemoria(configuracion.memoriaTotal, configuracion.politica ?? new FirstFit());
    this.planificador = new PlanificadorRoundRobin(configuracion.quantum);
    this.metricas = this.calcularMetricas();
  }

  private static validarEnteroPositivo(valor: number, nombre: string): void {
    if (!Number.isInteger(valor) || valor <= 0) {
      throw new Error(`${nombre} debe ser un entero positivo`);
    }
  }

  // RF02: PID unico y memoria que no supere el total. Queda Nuevo hasta el proximo tick.
  registrarProceso(pid: number, memoriaRequerida: number, cpuTotal: number): void {
    const proceso = new Proceso(pid, memoriaRequerida, cpuTotal);
    if (this.procesos.has(pid)) throw new Error("PID duplicado");
    if (memoriaRequerida > this.gestorMemoria.getMemoriaTotal()) {
      throw new Error("La memoria solicitada supera la memoria total");
    }
    this.procesos.set(pid, proceso);
    this.pendientes.push(proceso);
  }

  // RF08: el evento de E/S se define desde los tests y lo valida el propio Proceso
  programarES(pid: number, ticksDeCpu: number, duracion: number): void {
    this.buscar(pid).programarES(ticksDeCpu, duracion);
  }

  // RF06: avanza exactamente un tick, siempre en el mismo orden
  avanzarTick(): ResultadoTick {
    this.admitirPendientes();          // 1. admision e intento de asignacion
    this.actualizarBloqueados();       // 2. actualizacion de bloqueados
    const resultado = this.ejecutarCpu();  // 3. despacho y ejecucion Round Robin
    this.tick++;                       // 4. reloj y metricas
    this.metricas = this.calcularMetricas();
    return { tick: this.tick, ...resultado };
  }

  // Fase 1 (RF03): en orden de registro; si uno no entra, los siguientes igual se intentan
  private admitirPendientes(): void {
    for (const proceso of [...this.pendientes]) {
      if (this.gestorMemoria.asignar(proceso.getPid(), proceso.getMemoriaRequerida())) {
        proceso.admitir();
        this.planificador.encolar(proceso);
        this.pendientes.splice(this.pendientes.indexOf(proceso), 1);
      } else if (proceso.getEstado() === EstadoProceso.Nuevo) {
        proceso.esperarMemoria();
      }
    }
  }

  // Fase 2 (RF08): descuenta el bloqueo; al vencer vuelve al final de Listos
  private actualizarBloqueados(): void {
    for (const proceso of [...this.bloqueados]) {
      proceso.avanzarBloqueo();
      if (proceso.getTiempoBloqueoRestante() === 0) {
        proceso.desbloquear();
        this.planificador.encolar(proceso);
        this.bloqueados.splice(this.bloqueados.indexOf(proceso), 1);
      }
    }
  }

  // Fase 3 (RF07): un tick de CPU. Si termina, libera su memoria en este mismo tick;
  // esa memoria recien se ofrece a los que esperan en la admision del tick siguiente.
  private ejecutarCpu(): Omit<ResultadoTick, "tick"> {
    const { proceso, evento } = this.planificador.ejecutarTick();
    if (proceso === null) return { pidEjecutado: null, evento };

    this.ticksCpuOcupada++;
    const ejecutado = this.buscar(proceso.getPid());
    if (evento === EventoCpu.Terminado) {
      this.gestorMemoria.liberar(ejecutado.getPid());
      this.terminados.push(ejecutado);
    }
    if (evento === EventoCpu.Bloqueado) {
      this.bloqueados.push(ejecutado);   // conserva su memoria
    }
    return { pidEjecutado: ejecutado.getPid(), evento };
  }

  private calcularMetricas(): Metricas {
    return this.calculadora.calcular({
      memoriaTotal: this.gestorMemoria.getMemoriaTotal(),
      memoriaOcupada: this.gestorMemoria.getMemoriaOcupada(),
      memoriaLibreTotal: this.gestorMemoria.getMemoriaLibreTotal(),
      mayorBloqueLibre: this.gestorMemoria.getMayorBloqueLibre(),
      ticksCpuOcupada: this.ticksCpuOcupada,
      ticksTranscurridos: this.tick,
      cambiosContexto: this.planificador.getCambiosContexto(),
    });
  }

  private buscar(pid: number): Proceso {
    const proceso = this.procesos.get(pid);
    if (proceso === undefined) throw new Error("Proceso inexistente");
    return proceso;
  }

  // ---- Consultas (RF10): siempre copias o PIDs, nunca los objetos internos ----

  getTick(): number { return this.tick; }

  getProceso(pid: number): VistaProceso { return this.buscar(pid).aVista(); }

  getProcesos(): VistaProceso[] { return [...this.procesos.values()].map((p) => p.aVista()); }

  getProcesoEnCpu(): number | null { return this.planificador.getEnCpu()?.getPid() ?? null; }

  getColaListos(): number[] { return this.planificador.getColaListos().map((p) => p.getPid()); }

  getEsperandoMemoria(): number[] {
    return this.pendientes
      .filter((p) => p.getEstado() === EstadoProceso.EsperandoMemoria)
      .map((p) => p.getPid());
  }

  getBloqueados(): number[] { return this.bloqueados.map((p) => p.getPid()); }

  getTerminados(): number[] { return this.terminados.map((p) => p.getPid()); }

  getMapaMemoria(): VistaBloque[] { return this.gestorMemoria.getMapa(); }

  getMetricas(): Metricas { return { ...this.metricas }; }
}