"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  Building2,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Logo } from "@/components/marca/logo";
import { cerrarSesion } from "@/server/acciones/sesion";

export interface EntradaMenu {
  href: string;
  etiqueta: string;
  icono: keyof typeof ICONOS;
}

const ICONOS = {
  panel: LayoutDashboard,
  clientes: Building2,
  proyectos: ClipboardList,
  alertas: Bell,
  usuarios: Users,
  plantillas: ListChecks,
  empresa: Settings,
} as const;

export function Navegacion({
  empresa,
  entradas,
  entradasAdmin,
  usuario,
}: {
  empresa: { nombreEmpresa: string; nombreCorto: string; logoUrl: string | null };
  entradas: EntradaMenu[];
  entradasAdmin: EntradaMenu[];
  usuario: { nombreCompleto: string; rol: string };
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      {/* Barra superior — solo móvil */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-borde bg-superficie px-4 lg:hidden">
        <Logo empresa={empresa} tamano="sm" />
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="rounded-lg p-2 text-texto-suave hover:bg-fondo"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Fondo oscuro del menú móvil */}
      {abierto && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setAbierto(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-borde bg-superficie transition-transform lg:translate-x-0",
          abierto ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-borde px-4">
          <Logo empresa={empresa} tamano="sm" />
          <button
            type="button"
            onClick={() => setAbierto(false)}
            className="rounded-lg p-2 text-texto-suave hover:bg-fondo lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ListaEnlaces entradas={entradas} alNavegar={() => setAbierto(false)} />

          {entradasAdmin.length > 0 && (
            <>
              <p className="mt-6 mb-2 px-3 text-xs font-semibold tracking-wide text-texto-suave uppercase">
                Administración
              </p>
              <ListaEnlaces entradas={entradasAdmin} alNavegar={() => setAbierto(false)} />
            </>
          )}
        </nav>

        <div className="shrink-0 border-t border-borde p-3">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium text-texto">{usuario.nombreCompleto}</p>
            <p className="truncate text-xs text-texto-suave">{usuario.rol}</p>
          </div>
          <form action={cerrarSesion}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-texto-suave transition-colors hover:bg-fondo hover:text-texto"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

function ListaEnlaces({
  entradas,
  alNavegar,
}: {
  entradas: EntradaMenu[];
  alNavegar: () => void;
}) {
  const ruta = usePathname();

  return (
    <ul className="space-y-0.5">
      {entradas.map((entrada) => {
        const Icono = ICONOS[entrada.icono];
        const activo = ruta === entrada.href || ruta.startsWith(`${entrada.href}/`);

        return (
          <li key={entrada.href}>
            <Link
              href={entrada.href}
              onClick={alNavegar}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                activo
                  ? "bg-[var(--marca-primario)] font-medium text-white"
                  : "text-texto-suave hover:bg-fondo hover:text-texto",
              )}
            >
              <Icono className="h-4 w-4 shrink-0" />
              {entrada.etiqueta}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
