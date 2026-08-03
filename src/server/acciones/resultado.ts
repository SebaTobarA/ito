import { ErrorDePermiso } from "@/lib/permisos";
import { z } from "zod";
import { erroresDeCampo } from "@/lib/validaciones";

/** Resultado estándar de una Server Action, consumido con `useActionState`. */
export interface ResultadoAccion {
  ok?: boolean;
  mensaje?: string;
  error?: string;
  errores?: Record<string, string>;
}

export const ESTADO_INICIAL: ResultadoAccion = {};

/**
 * Traduce cualquier excepción a un `ResultadoAccion` con un mensaje legible en
 * español, sin filtrar detalles internos al usuario.
 */
export function aResultadoDeError(error: unknown): ResultadoAccion {
  if (error instanceof z.ZodError) {
    return { error: "Revisa los datos ingresados.", errores: erroresDeCampo(error) };
  }
  if (error instanceof ErrorDePermiso) {
    return { error: error.message };
  }
  if (esErrorDePrisma(error, "P2002")) {
    return { error: "Ya existe un registro con ese código o correo electrónico." };
  }
  if (esErrorDePrisma(error, "P2003")) {
    return { error: "No se puede completar: el registro está referenciado por otros datos." };
  }
  if (error instanceof Error) {
    console.error("[accion]", error);
    return { error: error.message };
  }
  console.error("[accion] error desconocido", error);
  return { error: "Ocurrió un error inesperado. Vuelve a intentarlo." };
}

function esErrorDePrisma(error: unknown, codigo: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === codigo
  );
}
