import { describe, expect, it } from "vitest";

import {
  correlativoDe,
  formatoEsValido,
  generarCodigoRegistro,
  siguienteCodigoItem,
  FORMATO_CODIGO_POR_DEFECTO,
} from "@/dominio/codificacion";

describe("generarCodigoRegistro", () => {
  const datos = { prefijo: "ITO", codigoCategoria: "05", codigoItem: "5.16" };

  it("usa el formato por defecto", () => {
    expect(generarCodigoRegistro(FORMATO_CODIGO_POR_DEFECTO, datos)).toBe("ITO-05-16");
  });

  it("rellena categoría y correlativo a dos dígitos", () => {
    expect(
      generarCodigoRegistro(FORMATO_CODIGO_POR_DEFECTO, {
        prefijo: "GPI",
        codigoCategoria: "0",
        codigoItem: "0.1",
      }),
    ).toBe("GPI-00-01");
  });

  it("admite formatos personalizados", () => {
    expect(generarCodigoRegistro("{prefijo}.{item}", datos)).toBe("ITO.5.16");
    expect(generarCodigoRegistro("{prefijo}-PROT-{correlativo}", datos)).toBe("ITO-PROT-16");
  });

  it("deja intactos los marcadores desconocidos, para que el error sea visible", () => {
    expect(generarCodigoRegistro("{prefijo}-{inexistente}", datos)).toBe("ITO-{inexistente}");
  });

  it("recorta espacios del prefijo", () => {
    expect(generarCodigoRegistro("{prefijo}-{correlativo}", { ...datos, prefijo: "  TE " })).toBe(
      "TE-16",
    );
  });
});

describe("correlativoDe", () => {
  it("toma el último segmento del código", () => {
    expect(correlativoDe("5.16")).toBe("16");
    expect(correlativoDe("12")).toBe("12");
  });
});

describe("siguienteCodigoItem", () => {
  it("continúa la numeración de la categoría", () => {
    expect(siguienteCodigoItem("05", ["5.1", "5.2", "5.10"])).toBe("5.11");
  });

  it("parte en 1 cuando la categoría está vacía", () => {
    expect(siguienteCodigoItem("19", [])).toBe("19.1");
  });

  it("normaliza el código de categoría con cero a la izquierda", () => {
    expect(siguienteCodigoItem("05", [])).toBe("5.1");
  });
});

describe("formatoEsValido", () => {
  it("exige al menos un marcador reconocido", () => {
    expect(formatoEsValido("{prefijo}-{categoria}")).toBe(true);
    expect(formatoEsValido("REG-001")).toBe(false);
  });
});
