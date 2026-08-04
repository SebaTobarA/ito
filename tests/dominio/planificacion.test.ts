import { describe, expect, it } from "vitest";

import {
  inicialesDe,
  modulosActivos,
  moduloEstaActivo,
  planificacionCompleta,
} from "@/dominio/planificacion";

const servicio = (codigo: string, aplica = true) => ({ codigo, aplica });

describe("modulosActivos", () => {
  it("un proyecto sin servicios definidos conserva los módulos base", () => {
    // Recién creado, antes de llenar la guía, el equipo igual tiene que poder
    // trabajar el checklist.
    expect(modulosActivos([])).toEqual(["checklist", "planificacion", "rdi", "protocolos"]);
  });

  it("solo inspección técnica no habilita estados de pago ni notas de cambio", () => {
    const activos = modulosActivos([servicio("ITO_TECNICA")]);
    expect(activos).toContain("curva");
    expect(activos).toContain("informeSemanal");
    expect(activos).not.toContain("estadosPago");
    expect(activos).not.toContain("notasCambio");
  });

  it("gerenciamiento habilita todo el módulo financiero", () => {
    const activos = modulosActivos([servicio("GERENCIAMIENTO")]);
    expect(activos).toContain("estadosPago");
    expect(activos).toContain("notasCambio");
  });

  it("un servicio marcado como no contratado no habilita nada", () => {
    expect(modulosActivos([servicio("GERENCIAMIENTO", false)])).not.toContain("estadosPago");
  });

  it("no duplica un módulo habilitado por dos servicios a la vez", () => {
    const activos = modulosActivos([servicio("GERENCIAMIENTO"), servicio("ITO_ADMINISTRATIVA")]);
    expect(activos.filter((m) => m === "estadosPago")).toHaveLength(1);
  });

  it("ignora servicios desconocidos sin romperse", () => {
    expect(() => modulosActivos([servicio("SERVICIO_INVENTADO")])).not.toThrow();
    expect(modulosActivos([servicio("SERVICIO_INVENTADO")])).toContain("checklist");
  });
});

describe("moduloEstaActivo", () => {
  it("responde por módulo puntual", () => {
    expect(moduloEstaActivo("estadosPago", [servicio("ITO_TECNICA")])).toBe(false);
    expect(moduloEstaActivo("checklist", [])).toBe(true);
  });
});

describe("inicialesDe", () => {
  it("toma la inicial del nombre y del apellido", () => {
    expect(inicialesDe("Jaime", "Rojas")).toBe("JR");
  });

  it("con nombre compuesto usa las dos primeras palabras", () => {
    expect(inicialesDe("Juan Pablo Silva")).toBe("JP");
  });

  it("respeta las mayúsculas del español", () => {
    expect(inicialesDe("ángela", "ñuñez")).toBe("ÁÑ");
  });

  it("tolera espacios de más y campos vacíos", () => {
    expect(inicialesDe("  Ana  ", "  ")).toBe("A");
    expect(inicialesDe("")).toBe("");
  });
});

describe("planificacionCompleta", () => {
  const base = {
    servicios: [servicio("ITO_TECNICA")],
    tieneEquipo: true,
    tieneEnfoque: true,
    responsabilidadesSinAsignar: 0,
  };

  it("está completa cuando no falta nada", () => {
    expect(planificacionCompleta(base)).toBe(true);
  });

  it("no está completa sin ningún servicio contratado", () => {
    expect(planificacionCompleta({ ...base, servicios: [] })).toBe(false);
  });

  it("no está completa con responsabilidades sin responsable", () => {
    expect(planificacionCompleta({ ...base, responsabilidadesSinAsignar: 3 })).toBe(false);
  });

  it("no está completa sin equipo ni enfoque", () => {
    expect(planificacionCompleta({ ...base, tieneEquipo: false })).toBe(false);
    expect(planificacionCompleta({ ...base, tieneEnfoque: false })).toBe(false);
  });
});
