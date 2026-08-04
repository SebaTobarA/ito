"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export interface PestanaProyecto {
  href: string;
  etiqueta: string;
  /** Contador opcional al costado, por ejemplo alertas o pendientes. */
  insignia?: string;
}

/**
 * Navegación entre las secciones de un proyecto.
 *
 * Las pestañas las decide el layout en el servidor, no este componente: a
 * partir de la Fase 3 dependen de los servicios contratados de cada proyecto, y
 * esa consulta no puede vivir en el navegador.
 */
export function PestanasProyecto({ pestanas }: { pestanas: PestanaProyecto[] }) {
  const ruta = usePathname();

  return (
    <nav
      className="-mx-4 mb-5 flex gap-1 overflow-x-auto border-b border-borde px-4 sm:mx-0 sm:px-0"
      aria-label="Secciones del proyecto"
    >
      {pestanas.map((pestana) => {
        const activa = ruta === pestana.href;
        return (
          <Link
            key={pestana.href}
            href={pestana.href}
            aria-current={activa ? "page" : undefined}
            className={cn(
              "-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors",
              activa
                ? "border-[var(--marca-primario)] font-medium text-[var(--marca-primario)]"
                : "border-transparent text-texto-suave hover:border-borde hover:text-texto",
            )}
          >
            {pestana.etiqueta}
            {pestana.insignia && (
              <span className="ml-1.5 rounded-full bg-fondo px-1.5 py-0.5 text-xs tabular-nums">
                {pestana.insignia}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
