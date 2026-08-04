import { describe, expect, it } from "vitest";

import { aObjeto } from "@/lib/validaciones";

/**
 * El caso que motiva estas pruebas: un checkbox desmarcado NO viaja en el
 * FormData. En los formularios que guardan campo a campo eso es
 * indistinguible de «este campo no venía», así que desmarcar una casilla no se
 * guardaba nunca. La convención del proyecto es acompañar cada checkbox de un
 * input oculto con el mismo nombre y valor `false`, declarado antes.
 */
function formulario(pares: [string, string][]): FormData {
  const datos = new FormData();
  for (const [clave, valor] of pares) datos.append(clave, valor);
  return datos;
}

describe("aObjeto", () => {
  it("lee los campos de texto tal cual", () => {
    const datos = formulario([["nombre", "Edificio Mirador"]]);
    expect(aObjeto(datos)).toEqual({ nombre: "Edificio Mirador" });
  });

  it("con el oculto y el checkbox marcado, gana el checkbox", () => {
    const datos = formulario([
      ["aplica", "false"],
      ["aplica", "on"],
    ]);
    expect(aObjeto(datos, ["aplica"]).aplica).toBe(true);
  });

  it("con el checkbox desmarcado llega solo el oculto y resulta false", () => {
    const datos = formulario([["aplica", "false"]]);
    expect(aObjeto(datos, ["aplica"]).aplica).toBe(false);
  });

  it("si el campo no viene del todo, queda ausente para no pisar el valor guardado", () => {
    const datos = formulario([["cumple", "SI"]]);
    const objeto = aObjeto(datos, ["aplica"]);
    expect("aplica" in objeto).toBe(false);
  });

  it("acepta el valor literal true de un input oculto", () => {
    expect(aObjeto(formulario([["activa", "true"]]), ["activa"]).activa).toBe(true);
  });

  it("ignora los archivos: se procesan aparte", () => {
    const datos = formulario([["descripcion", "acta"]]);
    datos.append("archivo", new File(["x"], "acta.pdf", { type: "application/pdf" }));
    expect(aObjeto(datos)).toEqual({ descripcion: "acta" });
  });
});
