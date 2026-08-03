import { cn } from "@/lib/utils";

interface EmpresaLogo {
  nombreEmpresa: string;
  nombreCorto: string;
  logoUrl: string | null;
}

/**
 * Logo de la empresa. Si todavía no se ha cargado una imagen en
 * Administración → Empresa, se muestra un monograma con el nombre corto y el
 * color primario configurado.
 */
export function Logo({
  empresa,
  tamano = "md",
  soloMonograma = false,
  className,
}: {
  empresa: EmpresaLogo;
  tamano?: "sm" | "md" | "lg";
  soloMonograma?: boolean;
  className?: string;
}) {
  const medidas = {
    sm: { caja: "h-7 w-7 text-[10px]", texto: "text-sm", imagen: "h-7" },
    md: { caja: "h-9 w-9 text-xs", texto: "text-base", imagen: "h-9" },
    lg: { caja: "h-14 w-14 text-base", texto: "text-xl", imagen: "h-14" },
  }[tamano];

  if (empresa.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={empresa.logoUrl}
        alt={empresa.nombreEmpresa}
        className={cn("w-auto object-contain", medidas.imagen, className)}
      />
    );
  }

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg font-bold tracking-tight text-white",
          medidas.caja,
        )}
        style={{ backgroundColor: "var(--marca-primario)" }}
      >
        {monograma(empresa.nombreCorto || empresa.nombreEmpresa)}
      </div>
      {!soloMonograma && (
        <span className={cn("font-semibold tracking-tight text-texto", medidas.texto)}>
          {empresa.nombreEmpresa}
        </span>
      )}
    </div>
  );
}

/** "[TE]" → "TE"; "Constructora Andes" → "CA" */
function monograma(nombre: string): string {
  const limpio = nombre.replace(/[[\]]/g, "").trim();
  const palabras = limpio.split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return "??";
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
  return (palabras[0][0] + palabras[1][0]).toUpperCase();
}
