import { describe, expect, it } from "vitest";

import {
  formatearTamano,
  rutaDeRespaldo,
  TAMANO_MAXIMO_BYTES,
  tipoEsPermitido,
} from "@/dominio/archivos";

describe("tipoEsPermitido", () => {
  it("acepta los formatos con que se entrega un respaldo de obra", () => {
    expect(tipoEsPermitido("application/pdf")).toBe(true);
    expect(tipoEsPermitido("image/jpeg")).toBe(true);
    expect(tipoEsPermitido("image/heic")).toBe(true); // fotos de iPhone en terreno
  });

  it("rechaza ejecutables y tipos desconocidos", () => {
    expect(tipoEsPermitido("application/x-msdownload")).toBe(false);
    expect(tipoEsPermitido("")).toBe(false);
  });
});

describe("formatearTamano", () => {
  it("usa la unidad legible según la magnitud", () => {
    expect(formatearTamano(512)).toBe("512 B");
    expect(formatearTamano(2048)).toBe("2 KB");
    expect(formatearTamano(3 * 1024 * 1024)).toBe("3.0 MB");
  });

  it("describe el límite de subida en megabytes", () => {
    expect(formatearTamano(TAMANO_MAXIMO_BYTES)).toBe("10.0 MB");
  });
});

describe("rutaDeRespaldo", () => {
  const base = { proyectoId: "proy1", itemProyectoId: "item1", ahora: 1_700_000_000_000 };

  it("agrupa por proyecto y por ítem", () => {
    const ruta = rutaDeRespaldo({ ...base, nombreArchivo: "informe.pdf" });
    expect(ruta).toBe("proyectos/proy1/item1/1700000000000-informe.pdf");
  });

  it("usa una carpeta general cuando el respaldo no cuelga de un ítem", () => {
    const ruta = rutaDeRespaldo({ ...base, itemProyectoId: null, nombreArchivo: "plano.pdf" });
    expect(ruta).toBe("proyectos/proy1/general/1700000000000-plano.pdf");
  });

  it("quita tildes y eñes en vez de dejarlas viajar al almacenamiento", () => {
    const ruta = rutaDeRespaldo({ ...base, nombreArchivo: "Inspección año 1.pdf" });
    expect(ruta.endsWith("Inspeccion-ano-1.pdf")).toBe(true);
  });

  it("reemplaza espacios y caracteres conflictivos", () => {
    const ruta = rutaDeRespaldo({ ...base, nombreArchivo: "acta 03/2026 (final).pdf" });
    expect(ruta).toBe("proyectos/proy1/item1/1700000000000-acta-03-2026--final-.pdf");
  });

  it("no permite que un nombre manipulado escape del directorio", () => {
    const ruta = rutaDeRespaldo({ ...base, nombreArchivo: "../../secreto.pdf" });
    expect(ruta).not.toContain("../");
    expect(ruta.startsWith("proyectos/proy1/item1/")).toBe(true);
  });

  it("acota nombres desmedidos sin perder la extensión", () => {
    const nombre = `${"a".repeat(300)}.pdf`;
    const ruta = rutaDeRespaldo({ ...base, nombreArchivo: nombre });
    const archivo = ruta.split("/").pop()!;
    expect(archivo.endsWith(".pdf")).toBe(true);
    expect(archivo.length).toBeLessThanOrEqual(134);
  });
});
