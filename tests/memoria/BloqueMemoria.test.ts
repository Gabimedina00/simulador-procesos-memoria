import { describe, expect, it } from "vitest";
import { BloqueMemoria } from "../../src/memoria/BloqueMemoria.js";

// RF04 - Representar bloques con inicio, tamaño y proceso asignado o libre
describe("BloqueMemoria (RF04)", () => {
  it("se crea libre con su inicio y tamaño", () => {
    const bloque = new BloqueMemoria(0, 1024);

    expect(bloque.getInicio()).toBe(0);
    expect(bloque.getTamano()).toBe(1024);
    expect(bloque.estaLibre()).toBe(true);
    expect(bloque.getPid()).toBeNull();
  });

  it("rechaza inicio negativo o tamaño no positivo", () => {
    expect(() => new BloqueMemoria(-1, 100)).toThrow("Inicio invalido");
    expect(() => new BloqueMemoria(0, 0)).toThrow("Tamaño invalido");
  });

  it("al asignarse queda ocupado por el proceso", () => {
    const bloque = new BloqueMemoria(0, 1024);

    bloque.asignar(1);

    expect(bloque.estaLibre()).toBe(false);
    expect(bloque.getPid()).toBe(1);
  });

  it("no se puede asignar un bloque ya ocupado", () => {
    const bloque = new BloqueMemoria(0, 1024);
    bloque.asignar(1);

    expect(() => bloque.asignar(2)).toThrow("El bloque ya esta ocupado");
  });

  it("al liberarse vuelve a estar libre", () => {
    const bloque = new BloqueMemoria(0, 1024);
    bloque.asignar(1);

    bloque.liberar();

    expect(bloque.estaLibre()).toBe(true);
    expect(bloque.getPid()).toBeNull();
  });

  it("al dividirse se achica y devuelve el sobrante como bloque libre contiguo", () => {
    const bloque = new BloqueMemoria(0, 1024);

    const sobrante = bloque.dividir(300);

    expect(bloque.getTamano()).toBe(300);
    expect(sobrante.getInicio()).toBe(300);
    expect(sobrante.getTamano()).toBe(724);
    expect(sobrante.estaLibre()).toBe(true);
  });

  it("no permite divisiones que generen bloques de tamaño cero", () => {
    const bloque = new BloqueMemoria(0, 1024);

    expect(() => bloque.dividir(1024)).toThrow("Division invalida");
    expect(() => bloque.dividir(0)).toThrow("Division invalida");
  });
});
// RF05 - Coalescencia a nivel de bloque
describe("BloqueMemoria - Fusion (RF05)", () => {
  it("absorbe a su vecino libre contiguo sumando su tamaño", () => {
    const izquierdo = new BloqueMemoria(0, 100);
    const derecho = new BloqueMemoria(100, 300);

    izquierdo.absorber(derecho);

    expect(izquierdo.getInicio()).toBe(0);
    expect(izquierdo.getTamano()).toBe(400);
  });

  it("no fusiona si alguno esta ocupado", () => {
    const izquierdo = new BloqueMemoria(0, 100);
    const derecho = new BloqueMemoria(100, 300);
    derecho.asignar(1);

    expect(() => izquierdo.absorber(derecho)).toThrow("Solo se fusionan bloques libres");
  });

  it("no fusiona bloques que no son contiguos", () => {
    const izquierdo = new BloqueMemoria(0, 100);
    const lejano = new BloqueMemoria(500, 100);

    expect(() => izquierdo.absorber(lejano)).toThrow("Los bloques no son contiguos");
  });

  it("devuelve una vista que no permite modificar el bloque", () => {
    const bloque = new BloqueMemoria(0, 1024);
    const vista = bloque.aVista() as { tamano: number };

    vista.tamano = 1;

    expect(bloque.getTamano()).toBe(1024);
  });
});