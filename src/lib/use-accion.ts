"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { ResultadoAccion } from "@/server/acciones/resultado";

const ESTADO_INICIAL = {} as ResultadoAccion;

/**
 * Envuelve `useActionState` con el comportamiento que repiten todos los
 * formularios: avisos con toast, y navegación opcional al terminar bien.
 *
 * El prefijo `use` es una exigencia de React (y de la regla `rules-of-hooks`),
 * por eso este es el único nombre del proyecto que no está en español.
 */
export function useAccion<T extends ResultadoAccion>(
  accion: (estadoPrevio: T, datos: FormData) => Promise<T>,
  opciones: { alTerminar?: (estado: T) => void; redirigirA?: (estado: T) => string | null } = {},
) {
  const [estado, ejecutar, pendiente] = useActionState<T, FormData>(
    accion as unknown as (estadoPrevio: Awaited<T>, datos: FormData) => Promise<T>,
    ESTADO_INICIAL as Awaited<T>,
  );
  const router = useRouter();
  const ultimoEstado = useRef<T | null>(null);

  useEffect(() => {
    if (estado === ultimoEstado.current) return;
    ultimoEstado.current = estado;

    if (estado.error) toast.error(estado.error);
    if (estado.ok) {
      if (estado.mensaje) toast.success(estado.mensaje);
      opciones.alTerminar?.(estado);
      const destino = opciones.redirigirA?.(estado);
      if (destino) router.push(destino);
    }
    // Las opciones se recrean en cada render; solo debe reaccionar al estado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  return { estado, ejecutar, pendiente, errores: estado.errores ?? {} };
}
