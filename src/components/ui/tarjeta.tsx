import * as React from "react";
import { cn } from "@/lib/utils";

export function Tarjeta({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-xl border border-borde bg-superficie shadow-sm", className)}
      {...props}
    />
  );
}

export function CabeceraTarjeta({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("border-b border-borde px-5 py-4", className)} {...props} />;
}

export function TituloTarjeta({ className, ...props }: React.ComponentProps<"h2">) {
  return <h2 className={cn("text-base font-semibold text-texto", className)} {...props} />;
}

export function DescripcionTarjeta({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("mt-0.5 text-sm text-texto-suave", className)} {...props} />;
}

export function CuerpoTarjeta({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-5 py-4", className)} {...props} />;
}

export function PieTarjeta({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex items-center gap-2 border-t border-borde px-5 py-3", className)}
      {...props}
    />
  );
}

export function Insignia({
  className,
  tono = "neutro",
  ...props
}: React.ComponentProps<"span"> & {
  tono?: "neutro" | "marca" | "exito" | "aviso" | "peligro";
}) {
  const tonos = {
    neutro: "bg-gray-100 text-gray-700",
    marca: "bg-[var(--marca-secundario)]/10 text-[var(--marca-primario)]",
    exito: "bg-green-100 text-green-800",
    aviso: "bg-amber-100 text-amber-800",
    peligro: "bg-red-100 text-red-700",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        tonos[tono],
        className,
      )}
      {...props}
    />
  );
}

/** Mensaje para listas vacías. */
export function EstadoVacio({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <p className="text-sm font-medium text-texto">{titulo}</p>
      {descripcion && <p className="max-w-md text-sm text-texto-suave">{descripcion}</p>}
      {children}
    </div>
  );
}
