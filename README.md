# simulador-procesos-memoria
 Se utilizará el escenario Simulador de procesos y memoria con POO. Se diseñará e implementará individualmente una biblioteca de clases, documentará sus decisiones y verificará su funcionamiento mediante pruebas automatizadas. 

# Simulador de procesos y memoria con POO

Biblioteca de clases en TypeScript que simula cómo varios procesos comparten una memoria limitada y una única CPU. Actividad de Evaluación 2 de Paradigmas y Lenguajes de Programación II, intercátedra con Sistemas Operativos (UCP, cohorte 2026).

**Autor:** Gabriel Medina · Ingeniería en Sistemas de Información

No tiene interfaz gráfica, menú de consola ni `main`: el funcionamiento se demuestra únicamente con pruebas automatizadas.

## Requisitos

- Node.js 20 o superior
- npm

## Instalación y uso

```bash
git clone https://github.com/Gabimedina00/simulador-procesos-memoria.git
cd simulador-procesos-memoria
npm ci
```

| Comando | Qué hace |
|---|---|
| `npm test` | Corre todos los tests con Vitest |
| `npm run coverage` | Corre los tests y genera el reporte de cobertura en `coverage/` |
| `npm run typecheck` | Verifica los tipos de TypeScript |

La cobertura se mide sobre todos los archivos de `src/` con un umbral mínimo de 90.01% de líneas, porque la consigna exige estrictamente más de 90%. GitHub Actions ejecuta `typecheck` y `coverage` en cada push a `main`.

## Estructura

```
src/
  procesos/       EstadoProceso, IProceso, Proceso
  memoria/        BloqueMemoria, PoliticaAsignacionBase, FirstFit, BestFit, WorstFit, GestorMemoria
  planificacion/  IPlanificador, PlanificadorRoundRobin
  simulador/      Metricas, CalculadoraMetricas, ConfiguracionSimulacion, ISimulador, Simulador
  index.ts        reexporta la API pública (no ejecuta nada)
tests/            misma estructura que src/
docs/
  uml/            diagrama de clases y de estados
  secuencia/      tres diagramas de secuencia
  matriz-rf.md    RF -> clase/método -> tests
  evidencias/     capturas de tests, cobertura y CI
```

## Ejemplo de uso (desde un test)

```ts
const sim = new Simulador({ memoriaTotal: 1024, quantum: 2, politica: new BestFit() });
sim.registrarProceso(1, 200, 3);
sim.registrarProceso(2, 300, 2);
sim.programarES(1, 1, 2);   // P1 se bloquea 2 ticks después de 1 tick de CPU

sim.avanzarTick();          // { tick: 1, pidEjecutado: 1, evento: "Bloqueado" }
sim.getColaListos();        // [2]
sim.getMetricas();          // ocupación, utilización de CPU, fragmentación, etc.
```

## Diseño

- **Composición:** `Simulador` tiene un `GestorMemoria`, un `PlanificadorRoundRobin` y una `CalculadoraMetricas`, y coordina las cuatro fases de cada tick.
- **Polimorfismo:** `FirstFit`, `BestFit` y `WorstFit` cumplen `IPoliticaAsignacion`; el gestor recibe la política por constructor y no pregunta de qué tipo es.
- **Herencia justificada:** las tres políticas heredan de `PoliticaAsignacionBase` (clase abstracta), que comparte el filtro de bloques libres y suficientes.
- **Doble encapsulamiento:** atributos privados, transiciones de estado validadas y consultas que devuelven copias.
- **Orden de cada tick (RF06):** 1) admisión, 2) bloqueados, 3) CPU con Round Robin, 4) reloj y métricas.

El comportamiento se validó contra el `main.py` de la cátedra de Sistemas Operativos: el test "Escenario de referencia de la cátedra" reproduce su traza.

## Diagramas

- [Diagrama de clases](docs/uml/clases.md)
- [Diagrama de estados](docs/uml/estados.md)
- [Secuencia 1: admisión y asignación de memoria (RF03, RF04)](docs/secuencia/01-admision-asignacion.md)
- [Secuencia 2: tick de Round Robin con finalización y coalescencia (RF07, RF05)](docs/secuencia/02-tick-round-robin.md)
- [Secuencia 3: bloqueo por E/S y retorno (RF08)](docs/secuencia/03-bloqueo-es.md)

Están en Mermaid: GitHub los muestra dibujados y se editan como texto.