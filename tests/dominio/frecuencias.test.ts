import { describe, expect, it } from "vitest";

import {
  calcularProximoControl,
  diasEntre,
  esPeriodica,
  estadoControl,
  hoyEnChile,
  sumarDias,
} from "@/dominio/frecuencias";

const HOY = new Date("2026-08-03"); // fecha de calendario: medianoche UTC, igual que lo que guarda Prisma

describe("esPeriodica", () => {
  it("distingue las frecuencias con periodicidad automática", () => {
    expect(esPeriodica("SEMANAL")).toBe(true);
    expect(esPeriodica("MENSUAL")).toBe(true);
    expect(esPeriodica("SEGUN_REQUERIMIENTO")).toBe(false);
    expect(esPeriodica("POR_EVENTO")).toBe(false);
    expect(esPeriodica("PERMANENTE")).toBe(false);
  });
});

describe("calcularProximoControl", () => {
  it("suma la periodicidad al último control", () => {
    const proximo = calcularProximoControl({
      frecuencia: "SEMANAL",
      fechaUltimoControl: new Date("2026-08-01"),
      hoy: HOY,
    });
    expect(proximo?.toISOString().slice(0, 10)).toBe("2026-08-08");
  });

  it("si nunca se ha controlado, cuenta desde el inicio del proyecto", () => {
    const proximo = calcularProximoControl({
      frecuencia: "MENSUAL",
      fechaInicioProyecto: new Date("2026-07-01"),
      hoy: HOY,
    });
    expect(proximo?.toISOString().slice(0, 10)).toBe("2026-07-31");
  });

  it("INICIO_PROYECTO vence en la fecha de inicio", () => {
    const proximo = calcularProximoControl({
      frecuencia: "INICIO_PROYECTO",
      fechaInicioProyecto: new Date("2026-07-01"),
      hoy: HOY,
    });
    expect(proximo?.toISOString().slice(0, 10)).toBe("2026-07-01");
  });

  it("FINAL_PROYECTO vence en la fecha de término estimada", () => {
    const proximo = calcularProximoControl({
      frecuencia: "FINAL_PROYECTO",
      fechaTerminoProyecto: new Date("2027-03-15"),
      hoy: HOY,
    });
    expect(proximo?.toISOString().slice(0, 10)).toBe("2027-03-15");
  });

  it("las frecuencias sin periodicidad no generan vencimiento", () => {
    expect(
      calcularProximoControl({ frecuencia: "SEGUN_REQUERIMIENTO", hoy: HOY }),
    ).toBeNull();
    expect(calcularProximoControl({ frecuencia: "POR_EVENTO", hoy: HOY })).toBeNull();
  });

  it("INICIO_PROYECTO sin fecha de inicio no genera vencimiento", () => {
    expect(calcularProximoControl({ frecuencia: "INICIO_PROYECTO", hoy: HOY })).toBeNull();
  });
});

describe("estadoControl", () => {
  it("marca como atrasado lo que ya venció", () => {
    expect(estadoControl(new Date("2026-08-01"), HOY)).toBe("atrasado");
  });

  it("marca como próximo lo que vence dentro de la ventana de aviso", () => {
    expect(estadoControl(new Date("2026-08-08"), HOY, 7)).toBe("proximo");
  });

  it("marca al día lo que vence más allá de la ventana", () => {
    expect(estadoControl(new Date("2026-09-01"), HOY, 7)).toBe("al_dia");
  });

  it("sin fecha no hay plazo que controlar", () => {
    expect(estadoControl(null, HOY)).toBe("sin_plazo");
  });
});

describe("diasEntre", () => {
  it("ignora la hora del día", () => {
    expect(diasEntre(new Date("2026-08-03T23:00:00Z"), new Date("2026-08-04T01:00:00Z"))).toBe(1);
    expect(diasEntre(new Date("2026-08-03T01:00:00Z"), new Date("2026-08-03T23:00:00Z"))).toBe(0);
  });

  it("es negativo cuando la fecha objetivo ya pasó", () => {
    expect(diasEntre(HOY, new Date("2026-08-01"))).toBe(-2);
  });
});

describe("hoyEnChile", () => {
  it("usa el día del calendario chileno, no el UTC", () => {
    // 2026-08-04 01:00 UTC son todavía las 21:00 del 3 de agosto en Chile.
    expect(hoyEnChile(new Date("2026-08-04T01:00:00Z")).toISOString().slice(0, 10)).toBe(
      "2026-08-03",
    );
  });

  it("devuelve la fecha como medianoche UTC, comparable con lo guardado en la base", () => {
    expect(hoyEnChile(new Date("2026-08-03T15:00:00Z")).toISOString()).toBe(
      "2026-08-03T00:00:00.000Z",
    );
  });
});

describe("sumarDias", () => {
  it("no muta la fecha original", () => {
    const original = new Date("2026-08-03");
    const resultado = sumarDias(original, 5);
    expect(original.toISOString().slice(0, 10)).toBe("2026-08-03");
    expect(resultado.toISOString().slice(0, 10)).toBe("2026-08-08");
  });
});
