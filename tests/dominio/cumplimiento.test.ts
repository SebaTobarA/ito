import { describe, expect, it } from "vitest";

import {
  calcularCumplimiento,
  consolidarCumplimiento,
  entraAlCalculo,
  formatearPorcentaje,
  nivelCumplimiento,
  type ItemCalculable,
} from "@/dominio/cumplimiento";

const item = (parcial: Partial<ItemCalculable> = {}): ItemCalculable => ({
  aplica: true,
  cumple: "SI",
  ...parcial,
});

describe("entraAlCalculo", () => {
  it("excluye los ítems que no aplican al proyecto", () => {
    expect(entraAlCalculo(item({ aplica: false, cumple: "SI" }))).toBe(false);
  });

  it("excluye los ítems marcados como N/A", () => {
    expect(entraAlCalculo(item({ cumple: "NA" }))).toBe(false);
  });

  it("incluye los pendientes: sin evaluar es incumplimiento", () => {
    expect(entraAlCalculo(item({ cumple: "PENDIENTE" }))).toBe(true);
  });
});

describe("calcularCumplimiento", () => {
  it("devuelve null cuando no hay ítems", () => {
    expect(calcularCumplimiento([])).toEqual({
      itemsAplicables: 0,
      itemsCumplen: 0,
      porcentaje: null,
    });
  });

  it("devuelve null cuando todos los ítems son N/A o no aplican", () => {
    const resultado = calcularCumplimiento([
      item({ cumple: "NA" }),
      item({ aplica: false }),
      item({ aplica: false, cumple: "NO" }),
    ]);
    expect(resultado.porcentaje).toBeNull();
    expect(resultado.itemsAplicables).toBe(0);
  });

  it("calcula el porcentaje sobre los ítems que entran al cálculo", () => {
    const resultado = calcularCumplimiento([
      item({ cumple: "SI" }),
      item({ cumple: "SI" }),
      item({ cumple: "NO" }),
      item({ cumple: "PENDIENTE" }),
    ]);
    expect(resultado.itemsAplicables).toBe(4);
    expect(resultado.itemsCumplen).toBe(2);
    expect(resultado.porcentaje).toBe(50);
  });

  it("los N/A no penalizan: 2 de 2 aplicables es 100% aunque haya N/A", () => {
    const resultado = calcularCumplimiento([
      item({ cumple: "SI" }),
      item({ cumple: "SI" }),
      item({ cumple: "NA" }),
      item({ cumple: "NA" }),
    ]);
    expect(resultado.porcentaje).toBe(100);
  });

  it("un ítem PENDIENTE cuenta como incumplimiento", () => {
    const resultado = calcularCumplimiento([item({ cumple: "SI" }), item({ cumple: "PENDIENTE" })]);
    expect(resultado.porcentaje).toBe(50);
  });

  it("redondea a dos decimales", () => {
    const resultado = calcularCumplimiento([
      item({ cumple: "SI" }),
      item({ cumple: "NO" }),
      item({ cumple: "NO" }),
    ]);
    expect(resultado.porcentaje).toBe(33.33);
  });

  it("respeta el peso de cada ítem", () => {
    const resultado = calcularCumplimiento([
      item({ cumple: "SI", peso: 3 }),
      item({ cumple: "NO", peso: 1 }),
    ]);
    expect(resultado.itemsAplicables).toBe(4);
    expect(resultado.itemsCumplen).toBe(3);
    expect(resultado.porcentaje).toBe(75);
  });
});

describe("consolidarCumplimiento", () => {
  it("suma numeradores y denominadores, no promedia porcentajes", () => {
    // Una categoría de 2 ítems al 100% y otra de 38 ítems al 0%:
    // el promedio de porcentajes daría 50%, el cálculo correcto da 5%.
    const resultado = consolidarCumplimiento([
      { itemsAplicables: 2, itemsCumplen: 2 },
      { itemsAplicables: 38, itemsCumplen: 0 },
    ]);
    expect(resultado.porcentaje).toBe(5);
  });

  it("devuelve null si ninguna categoría tiene ítems aplicables", () => {
    const resultado = consolidarCumplimiento([
      { itemsAplicables: 0, itemsCumplen: 0 },
      { itemsAplicables: 0, itemsCumplen: 0 },
    ]);
    expect(resultado.porcentaje).toBeNull();
  });
});

describe("nivelCumplimiento", () => {
  it("usa el umbral configurado por la empresa", () => {
    expect(nivelCumplimiento(null)).toBe("sin_datos");
    expect(nivelCumplimiento(20, 70)).toBe("critico");
    expect(nivelCumplimiento(60, 70)).toBe("bajo");
    expect(nivelCumplimiento(80, 70)).toBe("aceptable");
    expect(nivelCumplimiento(96, 70)).toBe("optimo");
  });

  it("un umbral más exigente reclasifica el mismo porcentaje", () => {
    expect(nivelCumplimiento(80, 70)).toBe("aceptable");
    expect(nivelCumplimiento(80, 90)).toBe("bajo");
  });
});

describe("formatearPorcentaje", () => {
  it("muestra un guion cuando no hay datos", () => {
    expect(formatearPorcentaje(null)).toBe("—");
  });

  it("omite los decimales cuando el valor es entero", () => {
    expect(formatearPorcentaje(100)).toBe("100%");
  });
});
