import { describe, expect, it } from "vitest";

import {
  documentosVisibles,
  sucesorAlEliminar,
  versionParaNuevoDocumento,
  type DocumentoVersionable,
} from "@/dominio/documentos";

const doc = (parcial: Partial<DocumentoVersionable> & { id: string }): DocumentoVersionable => ({
  version: 1,
  esVersionActual: false,
  reemplazaAId: null,
  eliminadoAt: null,
  ...parcial,
});

/** Cadena v1 → v2 → v3, con la v3 vigente. */
const cadena = [
  doc({ id: "v1", version: 1 }),
  doc({ id: "v2", version: 2, reemplazaAId: "v1" }),
  doc({ id: "v3", version: 3, reemplazaAId: "v2", esVersionActual: true }),
];

describe("versionParaNuevoDocumento", () => {
  it("un respaldo nuevo empieza en la versión 1", () => {
    expect(versionParaNuevoDocumento(null)).toBe(1);
  });

  it("reemplazar continúa la numeración de la cadena", () => {
    expect(versionParaNuevoDocumento({ version: 3 })).toBe(4);
  });
});

describe("sucesorAlEliminar", () => {
  it("sin versión anterior no queda sucesor", () => {
    expect(sucesorAlEliminar("v1", [doc({ id: "v1", esVersionActual: true })])).toBeNull();
  });

  it("al eliminar la vigente vuelve a serlo la inmediatamente anterior", () => {
    expect(sucesorAlEliminar("v3", cadena)).toBe("v2");
  });

  it("salta las versiones ya eliminadas y recupera la última viva", () => {
    const conV2Eliminada = cadena.map((d) =>
      d.id === "v2" ? { ...d, eliminadoAt: new Date("2026-08-01") } : d,
    );
    // Sin recorrer la cadena, el ítem quedaría sin respaldo vigente teniendo
    // la v1 perfectamente válida.
    expect(sucesorAlEliminar("v3", conV2Eliminada)).toBe("v1");
  });

  it("no queda sucesor si toda la cadena anterior está eliminada", () => {
    const todasEliminadas = cadena.map((d) =>
      d.id === "v3" ? d : { ...d, eliminadoAt: new Date("2026-08-01") },
    );
    expect(sucesorAlEliminar("v3", todasEliminadas)).toBeNull();
  });

  it("tolera que falte un eslabón de la cadena", () => {
    const sinV2 = cadena.filter((d) => d.id !== "v2");
    expect(sucesorAlEliminar("v3", sinV2)).toBeNull();
  });

  it("con una cadena circular sana devuelve el anterior sin recorrerla entera", () => {
    const circular = [
      doc({ id: "a", reemplazaAId: "b" }),
      doc({ id: "b", reemplazaAId: "a" }),
    ];
    expect(sucesorAlEliminar("a", circular)).toBe("b");
  });

  it("no se cuelga cuando el ciclo obliga a recorrer eliminados", () => {
    // Aquí sí hay que caminar: `b` está eliminado, así que sigue hacia `a`, que
    // es el punto de partida. Sin control de visitados, esto gira para siempre.
    const circular = [
      doc({ id: "a", reemplazaAId: "b" }),
      doc({ id: "b", reemplazaAId: "a", eliminadoAt: new Date("2026-08-01") }),
    ];
    expect(sucesorAlEliminar("a", circular)).toBeNull();
  });
});

describe("documentosVisibles", () => {
  it("oculta los eliminados sin borrarlos del historial", () => {
    const conEliminada = cadena.map((d) =>
      d.id === "v2" ? { ...d, eliminadoAt: new Date("2026-08-01") } : d,
    );
    expect(documentosVisibles(conEliminada).map((d) => d.id)).toEqual(["v3", "v1"]);
  });

  it("pone la versión vigente primero y el resto de la más nueva a la más antigua", () => {
    expect(documentosVisibles(cadena).map((d) => d.id)).toEqual(["v3", "v2", "v1"]);
  });

  it("devuelve vacío cuando el ítem no tiene respaldos vivos", () => {
    const todas = cadena.map((d) => ({ ...d, eliminadoAt: new Date("2026-08-01") }));
    expect(documentosVisibles(todas)).toEqual([]);
  });
});
