import { formatearPorcentaje, nivelCumplimiento } from "@/dominio/cumplimiento";
import { cn } from "@/lib/utils";

/** Barra de cumplimiento con semáforo según el umbral configurado por la empresa. */
export function BarraCumplimiento({
  porcentaje,
  umbralBajo = 70,
  className,
  mostrarEtiqueta = true,
}: {
  porcentaje: number | null;
  umbralBajo?: number;
  className?: string;
  mostrarEtiqueta?: boolean;
}) {
  const nivel = nivelCumplimiento(porcentaje, umbralBajo);
  const colores: Record<string, string> = {
    optimo: "bg-green-600",
    aceptable: "bg-amber-500",
    bajo: "bg-orange-500",
    critico: "bg-red-600",
    sin_datos: "bg-gray-300",
  };

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
        <div
          className={cn("h-full rounded-full transition-all", colores[nivel])}
          style={{ width: `${porcentaje ?? 0}%` }}
        />
      </div>
      {mostrarEtiqueta && (
        <span className="w-14 shrink-0 text-right text-sm font-semibold tabular-nums">
          {formatearPorcentaje(porcentaje)}
        </span>
      )}
    </div>
  );
}

/** Píldora compacta con el porcentaje y el color del semáforo. */
export function PildoraCumplimiento({
  porcentaje,
  umbralBajo = 70,
  className,
}: {
  porcentaje: number | null;
  umbralBajo?: number;
  className?: string;
}) {
  const nivel = nivelCumplimiento(porcentaje, umbralBajo);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-sm font-semibold tabular-nums",
        `nivel-${nivel}`,
        className,
      )}
    >
      {formatearPorcentaje(porcentaje)}
    </span>
  );
}
