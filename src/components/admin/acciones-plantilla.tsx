"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";

import { activarPlantilla, crearVersionPlantilla } from "@/server/acciones/plantillas";
import { Boton } from "@/components/ui/boton";

export function AccionesPlantilla({
  plantillaId,
  esActiva,
}: {
  plantillaId: string;
  esActiva: boolean;
}) {
  const [pendiente, iniciarTransicion] = useTransition();

  const ejecutar = (accion: () => Promise<{ error?: string; mensaje?: string }>) =>
    iniciarTransicion(async () => {
      const resultado = await accion();
      if (resultado.error) toast.error(resultado.error);
      else if (resultado.mensaje) toast.success(resultado.mensaje);
    });

  return (
    <div className="flex flex-wrap gap-2">
      <Boton
        variante="secundario"
        disabled={pendiente}
        onClick={() => ejecutar(() => crearVersionPlantilla(plantillaId))}
      >
        <Copy className="h-4 w-4" />
        Crear versión nueva
      </Boton>

      {!esActiva && (
        <Boton disabled={pendiente} onClick={() => ejecutar(() => activarPlantilla(plantillaId))}>
          <Check className="h-4 w-4" />
          Publicar esta versión
        </Boton>
      )}
    </div>
  );
}
