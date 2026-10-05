import { describe, expect, it } from "vitest";
import { GestorMemoria } from "../../src/memoria/GestorMemoria.js";
import { FirstFit } from "../../src/memoria/FirstFit.js";
import { BestFit } from "../../src/memoria/BestFit.js";
import { WorstFit } from "../../src/memoria/WorstFit.js";
import { VistaBloque } from "../../src/memoria/IBloqueMemoria.js";

// Verifica las invariantes del mapa: empieza en 0, sin huecos ni solapamientos,
// y la suma de tamaños es la memoria total
function verificarInvariantes(mapa: VistaBloque[], total: number): void {
  let esperado = 0;
  for (const bloque of mapa) {
    expect(bloque.inicio).toBe(esperado);
    expect(bloque.tamano).toBeGreaterThan(0);
    esperado += bloque.tamano;
  }
  expect(esperado).toBe(total);
}

// Arma huecos 200@0, 500@300 y 100@900 (ocupados 2@200 y 4@800) en 1000 KB
function gestorConHuecos(gestor: GestorMemoria): GestorMemoria {
  gestor.asignar(1, 200);
  gestor.asignar(2, 100);
  gestor.asignar(3, 500);
  gestor.asignar(4, 100);
  gestor.asignar(5, 100);
  gestor.liberar(1);
  gestor.liberar(3);
  gestor.liberar(5);
  return gestor;
}

// RF01 - Estado inicial de la memoria
describe("GestorMemoria - Inicio (RF01)", () => {
  it("arranca con un unico bloque libre del tamaño total", () => {
    const gestor = new GestorMemoria(1024, new FirstFit());

    expect(gestor.getMapa()).toEqual([{ inicio: 0, tamano: 1024, pid: null }]);
    expect(gestor.getMemoriaLibreTotal()).toBe(1024);
    expect(gestor.getMemoriaOcupada()).toBe(0);
  });

  it("rechaza una memoria total invalida", () => {
    expect(() => new GestorMemoria(0, new FirstFit())).toThrow("Memoria total debe ser un entero positivo");
  });
});

// RF04 - Asignar memoria contigua
describe("GestorMemoria - Asignacion (RF04)", () => {
  it("divide el bloque cuando sobra espacio", () => {
    const gestor = new GestorMemoria(1000, new FirstFit());

    expect(gestor.asignar(1, 300)).toBe(true);

    expect(gestor.getMapa()).toEqual([
      { inicio: 0, tamano: 300, pid: 1 },
      { inicio: 300, tamano: 700, pid: null },
    ]);
  });

  it("una asignacion exacta no genera bloques de tamaño cero", () => {
    const gestor = new GestorMemoria(1000, new FirstFit());

    gestor.asignar(1, 1000);

    expect(gestor.getMapa()).toEqual([{ inicio: 0, tamano: 1000, pid: 1 }]);
  });

  it.each([
    [new FirstFit(), 0],
    [new BestFit(), 900],
    [new WorstFit(), 300],
  ])("con %s el proceso queda en la direccion %i", (politica, direccion) => {
    const gestor = gestorConHuecos(new GestorMemoria(1000, politica));

    gestor.asignar(9, 100);

    expect(gestor.getMapa().find((b) => b.pid === 9)?.inicio).toBe(direccion);
  });

  it("si ningun hueco alcanza falla sin alterar los bloques, aunque la suma libre alcance", () => {
    const gestor = gestorConHuecos(new GestorMemoria(1000, new FirstFit()));
    const antes = gestor.getMapa();

    expect(gestor.getMemoriaLibreTotal()).toBe(800);
    expect(gestor.asignar(9, 600)).toBe(false);
    expect(gestor.getMapa()).toEqual(antes);
  });

  it("rechaza tamaños invalidos y procesos que ya tienen memoria", () => {
    const gestor = new GestorMemoria(1000, new FirstFit());
    gestor.asignar(1, 100);

    expect(() => gestor.asignar(2, 0)).toThrow("Tamaño solicitado invalido");
    expect(() => gestor.asignar(1, 100)).toThrow("El proceso ya tiene memoria asignada");
  });

  it("el mapa devuelto es una copia", () => {
    const gestor = new GestorMemoria(1000, new FirstFit());
    const mapa = gestor.getMapa() as { tamano: number }[];

    mapa[0]!.tamano = 1;
    mapa.pop();

    expect(gestor.getMapa()).toEqual([{ inicio: 0, tamano: 1000, pid: null }]);
  });
});

// RF05 - Liberar memoria y realizar coalescencia 
// (proceso físico mediante estructuras en contacto se unen para formar un único cuerpo o entidad mayor)
describe("GestorMemoria - Liberacion y coalescencia (RF05)", () => {
  // Tres procesos que ocupan toda la memoria: 1@0, 2@100, 3@200
  function gestorLleno(): GestorMemoria {
    const gestor = new GestorMemoria(300, new FirstFit());
    gestor.asignar(1, 100);
    gestor.asignar(2, 100);
    gestor.asignar(3, 100);
    return gestor;
  }

  it("liberar sin vecinos libres deja el hueco aislado", () => {
    const gestor = gestorLleno();

    gestor.liberar(2);

    expect(gestor.getMapa()).toEqual([
      { inicio: 0, tamano: 100, pid: 1 },
      { inicio: 100, tamano: 100, pid: null },
      { inicio: 200, tamano: 100, pid: 3 },
    ]);
  });

  it("fusiona con el vecino izquierdo", () => {
    const gestor = gestorLleno();
    gestor.liberar(1);

    gestor.liberar(2);

    expect(gestor.getMapa()).toEqual([
      { inicio: 0, tamano: 200, pid: null },
      { inicio: 200, tamano: 100, pid: 3 },
    ]);
  });

  it("fusiona con el vecino derecho", () => {
    const gestor = gestorLleno();
    gestor.liberar(3);

    gestor.liberar(2);

    expect(gestor.getMapa()).toEqual([
      { inicio: 0, tamano: 100, pid: 1 },
      { inicio: 100, tamano: 200, pid: null },
    ]);
  });

  it("fusiona con ambos vecinos a la vez", () => {
    const gestor = gestorLleno();
    gestor.liberar(1);
    gestor.liberar(3);

    gestor.liberar(2);

    expect(gestor.getMapa()).toEqual([{ inicio: 0, tamano: 300, pid: null }]);
  });

  it("al liberar todos queda un unico bloque libre del tamaño total", () => {
    const gestor = gestorConHuecos(new GestorMemoria(1000, new FirstFit()));

    gestor.liberar(2);
    gestor.liberar(4);

    expect(gestor.getMapa()).toEqual([{ inicio: 0, tamano: 1000, pid: null }]);
  });

  it("conserva tamaño total, orden y continuidad sin mover bloques ocupados", () => {
    const gestor = gestorConHuecos(new GestorMemoria(1000, new FirstFit()));

    verificarInvariantes(gestor.getMapa(), 1000);
    expect(gestor.getMapa().find((b) => b.pid === 2)?.inicio).toBe(200);
    expect(gestor.getMapa().find((b) => b.pid === 4)?.inicio).toBe(800);
  });

  it("rechaza liberar un proceso sin memoria", () => {
    const gestor = new GestorMemoria(1000, new FirstFit());

    expect(() => gestor.liberar(7)).toThrow("El proceso no tiene memoria asignada");
  });
});

// RF09 - Datos de memoria que usan las metricas
describe("GestorMemoria - Datos para metricas (RF09)", () => {
  it("con huecos de 100 y 300 KB: libre 400 y mayor hueco 300", () => {
    const gestor = new GestorMemoria(800, new FirstFit());
    gestor.asignar(1, 100);
    gestor.asignar(2, 200);
    gestor.asignar(3, 300);
    gestor.asignar(4, 200);
    gestor.liberar(1);
    gestor.liberar(3);

    expect(gestor.getMemoriaLibreTotal()).toBe(400);
    expect(gestor.getMayorBloqueLibre()).toBe(300);
    expect(gestor.getMemoriaOcupada()).toBe(400);
  });

  it("con memoria llena el mayor bloque libre es 0", () => {
    const gestor = new GestorMemoria(500, new FirstFit());
    gestor.asignar(1, 500);

    expect(gestor.getMayorBloqueLibre()).toBe(0);
    expect(gestor.getMemoriaLibreTotal()).toBe(0);
  });
});