import * as React from "react";
import { cn } from "@/lib/utils";

const clasesCampo =
  "w-full rounded-lg border border-borde bg-white px-3 py-2 text-sm text-texto shadow-sm transition-colors placeholder:text-texto-suave focus:border-[var(--marca-secundario)] focus:outline-none focus:ring-2 focus:ring-[var(--marca-secundario)]/20 disabled:cursor-not-allowed disabled:bg-fondo";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(clasesCampo, "h-10", className)} {...props} />;
  },
);

export const AreaTexto = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  function AreaTexto({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn(clasesCampo, "min-h-20", className)} {...props} />;
  },
);

export const Selector = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(
  function Selector({ className, ...props }, ref) {
    return <select ref={ref} className={cn(clasesCampo, "h-10 pr-8", className)} {...props} />;
  },
);

export function Etiqueta({ className, ...props }: React.ComponentProps<"label">) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-texto", className)} {...props} />;
}

/** Campo de formulario con etiqueta, ayuda y mensaje de error. */
export function Campo({
  etiqueta,
  ayuda,
  error,
  requerido,
  htmlFor,
  className,
  children,
}: {
  etiqueta: string;
  ayuda?: string;
  error?: string;
  requerido?: boolean;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <Etiqueta htmlFor={htmlFor}>
        {etiqueta}
        {requerido && <span className="ml-0.5 text-red-600">*</span>}
      </Etiqueta>
      {children}
      {ayuda && !error && <p className="mt-1 text-xs text-texto-suave">{ayuda}</p>}
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
