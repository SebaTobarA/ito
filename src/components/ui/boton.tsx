import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const variantesBoton = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--marca-secundario)]",
  {
    variants: {
      variante: {
        primario: "bg-[var(--marca-primario)] text-white hover:opacity-90",
        secundario: "bg-white text-texto border border-borde hover:bg-fondo",
        acento: "bg-[var(--marca-acento)] text-white hover:opacity-90",
        peligro: "bg-red-600 text-white hover:bg-red-700",
        fantasma: "text-texto hover:bg-fondo",
        enlace: "text-[var(--marca-secundario)] underline-offset-4 hover:underline",
      },
      tamano: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-11 px-6",
        icono: "h-9 w-9",
      },
    },
    defaultVariants: { variante: "primario", tamano: "md" },
  },
);

export interface PropsBoton
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof variantesBoton> {
  asChild?: boolean;
}

export const Boton = React.forwardRef<HTMLButtonElement, PropsBoton>(function Boton(
  { className, variante, tamano, asChild = false, ...props },
  ref,
) {
  const Componente = asChild ? Slot : "button";
  return (
    <Componente
      ref={ref}
      className={cn(variantesBoton({ variante, tamano }), className)}
      {...props}
    />
  );
});

export { variantesBoton };
