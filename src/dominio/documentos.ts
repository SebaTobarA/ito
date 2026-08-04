/**
 * Reglas de versionado de los respaldos documentales.
 *
 * Un respaldo nunca se reemplaza en su lugar: subir una corrección crea una
 * versión nueva encadenada a la anterior por `reemplazaAId`, y la anterior deja
 * de ser vigente pero sigue existiendo. Es lo que permite demostrar, meses
 * después, qué documento se tuvo a la vista en cada momento.
 *
 * Lógica pura: no importa Prisma, React ni Next.
 */

export interface DocumentoVersionable {
  id: string;
  version: number;
  esVersionActual: boolean;
  /** Documento al que este reemplaza. `null` en la primera versión. */
  reemplazaAId: string | null;
  eliminadoAt: Date | null;
}

/**
 * Versión que le corresponde a un archivo que entra.
 * Sin documento previo es la primera; si reemplaza a otro, continúa su cadena.
 */
export function versionParaNuevoDocumento(anterior: { version: number } | null): number {
  return anterior ? anterior.version + 1 : 1;
}

/**
 * Documento que pasa a ser vigente cuando se elimina `eliminadoId`.
 *
 * Recorre la cadena hacia atrás hasta encontrar una versión que siga viva: si se
 * eliminaron la v3 y antes la v2, la vigente debe volver a ser la v1, no quedar
 * el ítem sin respaldo actual teniendo uno válido.
 *
 * Devuelve `null` si no queda ninguna versión anterior utilizable.
 */
export function sucesorAlEliminar(
  eliminadoId: string,
  documentos: DocumentoVersionable[],
): string | null {
  const porId = new Map(documentos.map((documento) => [documento.id, documento]));

  let actual = porId.get(eliminadoId);
  const visitados = new Set<string>([eliminadoId]);

  while (actual?.reemplazaAId) {
    // Una cadena corrupta (un ciclo) no debe colgar el servidor.
    if (visitados.has(actual.reemplazaAId)) return null;
    visitados.add(actual.reemplazaAId);

    const anterior = porId.get(actual.reemplazaAId);
    if (!anterior) return null;
    if (!anterior.eliminadoAt) return anterior.id;

    actual = anterior;
  }

  return null;
}

/** Respaldos que se le muestran al usuario: vivos, del más nuevo al más antiguo. */
export function documentosVisibles(
  documentos: DocumentoVersionable[],
): DocumentoVersionable[] {
  return documentos
    .filter((documento) => documento.eliminadoAt === null)
    .sort((a, b) => {
      if (a.esVersionActual !== b.esVersionActual) return a.esVersionActual ? -1 : 1;
      return b.version - a.version;
    });
}
