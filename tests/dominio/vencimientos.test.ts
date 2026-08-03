import { describe, expect, it } from "vitest";

import {
  calcularEstadoVencimiento,
  describeVencimiento,
  diasParaVencer,
  severidadPorVencimiento,
} from "@/dominio/vencimientos";

const HOY = new Date("2026-08-03");

describe("calcularEstadoVencimiento", () => {
  it("marca vencido lo que ya pasó", () => {
    expect(
      calcularEstadoVencimiento({ fechaVencimiento: new Date("2026-08-01"), hoy: HOY }),
    ).toBe("VENCIDO");
  });

  it("marca por vencer dentro de la ventana de aviso", () => {
    expect(
      calcularEstadoVencimiento({
        fechaVencimiento: new Date("2026-08-20"),
        diasAlertaPrevia: 30,
        hoy: HOY,
      }),
    ).toBe("POR_VENCER");
  });

  it("marca vigente lo que está más allá de la ventana", () => {
    expect(
      calcularEstadoVencimiento({
        fechaVencimiento: new Date("2026-12-01"),
        diasAlertaPrevia: 30,
        hoy: HOY,
      }),
    ).toBe("VIGENTE");
  });

  it("respeta la ventana de aviso configurada por vencimiento", () => {
    const fecha = new Date("2026-09-15");
    expect(calcularEstadoVencimiento({ fechaVencimiento: fecha, diasAlertaPrevia: 30, hoy: HOY })).toBe(
      "VIGENTE",
    );
    expect(calcularEstadoVencimiento({ fechaVencimiento: fecha, diasAlertaPrevia: 60, hoy: HOY })).toBe(
      "POR_VENCER",
    );
  });

  it("no recalcula los estados que son decisión manual del equipo", () => {
    for (const estado of ["RENOVADO", "LIBERADO"] as const) {
      expect(
        calcularEstadoVencimiento({
          fechaVencimiento: new Date("2026-01-01"),
          estadoActual: estado,
          hoy: HOY,
        }),
      ).toBe(estado);
    }
  });
});

describe("severidadPorVencimiento", () => {
  it("escala según qué tan cerca está la fecha", () => {
    expect(severidadPorVencimiento(new Date("2026-07-30"), 30, HOY)).toBe("CRITICA");
    expect(severidadPorVencimiento(new Date("2026-08-06"), 30, HOY)).toBe("CRITICA");
    expect(severidadPorVencimiento(new Date("2026-08-15"), 30, HOY)).toBe("ALTA");
    expect(severidadPorVencimiento(new Date("2026-08-30"), 30, HOY)).toBe("MEDIA");
    expect(severidadPorVencimiento(new Date("2026-12-01"), 30, HOY)).toBe("INFO");
  });
});

describe("diasParaVencer y describeVencimiento", () => {
  it("describe el plazo en español", () => {
    expect(diasParaVencer(new Date("2026-08-13"), HOY)).toBe(10);
    expect(describeVencimiento(new Date("2026-08-03"), HOY)).toBe("Vence hoy");
    expect(describeVencimiento(new Date("2026-08-04"), HOY)).toBe("Vence mañana");
    expect(describeVencimiento(new Date("2026-08-13"), HOY)).toBe("Vence en 10 días");
    expect(describeVencimiento(new Date("2026-08-02"), HOY)).toBe("Vencido hace 1 día");
  });
});
