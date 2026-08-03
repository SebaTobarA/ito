import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function EncabezadoPagina({
  titulo,
  descripcion,
  migas,
  acciones,
}: {
  titulo: string;
  descripcion?: string;
  migas?: { etiqueta: string; href?: string }[];
  acciones?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      {migas && migas.length > 0 && (
        <nav className="mb-2 flex flex-wrap items-center gap-1 text-xs text-texto-suave">
          {migas.map((miga, indice) => (
            <span key={`${miga.etiqueta}-${indice}`} className="flex items-center gap-1">
              {indice > 0 && <ChevronRight className="h-3 w-3" />}
              {miga.href ? (
                <Link href={miga.href} className="hover:text-texto hover:underline">
                  {miga.etiqueta}
                </Link>
              ) : (
                <span>{miga.etiqueta}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-texto sm:text-2xl">{titulo}</h1>
          {descripcion && <p className="mt-1 text-sm text-texto-suave">{descripcion}</p>}
        </div>
        {acciones && <div className="flex shrink-0 flex-wrap gap-2">{acciones}</div>}
      </div>
    </div>
  );
}
