import type { Prisma, PrismaClient, TipoCatalogo } from "@prisma/client";

/**
 * Catálogos y matriz de responsabilidades por defecto.
 *
 * Son un punto de partida editable, no una definición fija: todo esto se
 * administra después desde el panel. Igual que la plantilla del checklist, lo
 * usan tanto `npm run db:seed` como la configuración inicial desde el navegador.
 *
 * Es idempotente: se puede ejecutar varias veces sin duplicar nada.
 */

type ClientePrisma = PrismaClient | Prisma.TransactionClient;

/** Especialidades técnicas con su sigla. Las referencian RDI y protocolos. */
const ESPECIALIDADES = [
  { codigo: "TOP", nombre: "Topografía" },
  { codigo: "MOV", nombre: "Movimiento de tierras" },
  { codigo: "INF", nombre: "Instalación de faenas" },
  { codigo: "OBC", nombre: "Obras civiles" },
  { codigo: "EST", nombre: "Estructuras" },
  { codigo: "TER", nombre: "Terminaciones" },
  { codigo: "IST", nombre: "Instalaciones" },
  { codigo: "OBP", nombre: "Pavimentación y urbanización" },
  { codigo: "PAI", nombre: "Paisajismo" },
  { codigo: "SEG", nombre: "Seguridad y medio ambiente" },
  { codigo: "ARQ", nombre: "Arquitectura" },
  { codigo: "OTR", nombre: "Otras especialidades" },
];

/**
 * Servicios contratables. Los códigos marcados los lee
 * `dominio/planificacion.ts` para decidir qué módulos se activan.
 */
const OPCIONES: { tipo: TipoCatalogo; codigo: string; etiqueta: string }[] = [
  { tipo: "TIPO_SERVICIO", codigo: "GERENCIAMIENTO", etiqueta: "Gerenciamiento total del proyecto" },
  { tipo: "TIPO_SERVICIO", codigo: "ITO_TECNICA", etiqueta: "Inspección técnica de obras" },
  { tipo: "TIPO_SERVICIO", codigo: "ITO_ADMINISTRATIVA", etiqueta: "Inspección técnica y administrativa" },
  { tipo: "TIPO_SERVICIO", codigo: "COORDINACION_INICIAL", etiqueta: "Coordinación inicial del proyecto" },
  { tipo: "TIPO_SERVICIO", codigo: "LICITACION", etiqueta: "Licitación del proyecto" },
  { tipo: "TIPO_SERVICIO", codigo: "ASESORIA_TECNICA", etiqueta: "Asesoría técnica puntual" },
  { tipo: "TIPO_SERVICIO", codigo: "OTRO", etiqueta: "Otro servicio" },

  { tipo: "TIPO_PROYECTO", codigo: "EDIF_ALTURA", etiqueta: "Edificación en altura" },
  { tipo: "TIPO_PROYECTO", codigo: "EDIF_EXTENSION", etiqueta: "Edificación en extensión" },
  { tipo: "TIPO_PROYECTO", codigo: "URBANIZACION", etiqueta: "Urbanización y loteo" },
  { tipo: "TIPO_PROYECTO", codigo: "INDUSTRIAL", etiqueta: "Industrial o bodegaje" },
  { tipo: "TIPO_PROYECTO", codigo: "COMERCIAL", etiqueta: "Comercial u oficinas" },
  { tipo: "TIPO_PROYECTO", codigo: "OBRA_PUBLICA", etiqueta: "Obra pública" },
  { tipo: "TIPO_PROYECTO", codigo: "REMODELACION", etiqueta: "Remodelación o habilitación" },

  { tipo: "ESTADO_DOCUMENTO", codigo: "EN_TRAMITE", etiqueta: "En trámite" },
  { tipo: "ESTADO_DOCUMENTO", codigo: "ENTREGADO", etiqueta: "Entregado" },
  { tipo: "ESTADO_DOCUMENTO", codigo: "PENDIENTE", etiqueta: "Pendiente" },
  { tipo: "ESTADO_DOCUMENTO", codigo: "RESUELTO", etiqueta: "Resuelto" },
  { tipo: "ESTADO_DOCUMENTO", codigo: "NO_APLICA", etiqueta: "No aplica" },

  { tipo: "CAUSA_NO_CUMPLIMIENTO", codigo: "CLIMA", etiqueta: "Condiciones climáticas" },
  { tipo: "CAUSA_NO_CUMPLIMIENTO", codigo: "DOTACION", etiqueta: "Falta de dotación" },
  { tipo: "CAUSA_NO_CUMPLIMIENTO", codigo: "MATERIALES", etiqueta: "Falta o atraso de materiales" },
  { tipo: "CAUSA_NO_CUMPLIMIENTO", codigo: "PROYECTO", etiqueta: "Información de proyecto incompleta" },
  { tipo: "CAUSA_NO_CUMPLIMIENTO", codigo: "RDI_PENDIENTE", etiqueta: "RDI sin respuesta" },
  { tipo: "CAUSA_NO_CUMPLIMIENTO", codigo: "PERMISOS", etiqueta: "Permisos o autorizaciones" },
  { tipo: "CAUSA_NO_CUMPLIMIENTO", codigo: "SUBCONTRATO", etiqueta: "Desempeño de subcontrato" },
  { tipo: "CAUSA_NO_CUMPLIMIENTO", codigo: "CALIDAD", etiqueta: "Rechazo por calidad y rehacer" },
  { tipo: "CAUSA_NO_CUMPLIMIENTO", codigo: "MANDANTE", etiqueta: "Decisión pendiente del mandante" },
  { tipo: "CAUSA_NO_CUMPLIMIENTO", codigo: "OTRA", etiqueta: "Otra causa" },

  { tipo: "CARGO_EQUIPO", codigo: "GERENTE_PROYECTO", etiqueta: "Gerente de Proyecto" },
  { tipo: "CARGO_EQUIPO", codigo: "JEFE_PROYECTO", etiqueta: "Jefe de Proyecto" },
  { tipo: "CARGO_EQUIPO", codigo: "ITO_RESIDENTE", etiqueta: "ITO Residente" },
  { tipo: "CARGO_EQUIPO", codigo: "ITO_ESPECIALIDAD", etiqueta: "ITO de Especialidad" },
  { tipo: "CARGO_EQUIPO", codigo: "ADMINISTRATIVO", etiqueta: "Apoyo administrativo" },

  { tipo: "RECURSO_TERRENO", codigo: "COMPUTADOR", etiqueta: "Computador" },
  { tipo: "RECURSO_TERRENO", codigo: "IMPRESORA", etiqueta: "Impresora" },
  { tipo: "RECURSO_TERRENO", codigo: "CAMARA", etiqueta: "Cámara digital" },
  { tipo: "RECURSO_TERRENO", codigo: "LETRERO", etiqueta: "Letrero de obra" },
  { tipo: "RECURSO_TERRENO", codigo: "EPP", etiqueta: "Elementos de protección personal" },
  { tipo: "RECURSO_TERRENO", codigo: "INSTRUMENTOS", etiqueta: "Instrumentos de medición" },
  { tipo: "RECURSO_TERRENO", codigo: "OFICINA", etiqueta: "Oficina en terreno" },
];

/**
 * Matriz de responsabilidades por defecto, ordenada por el ciclo de vida del
 * proyecto: inicio, ejecución, control técnico, control administrativo,
 * reportería y cierre.
 */
const RESPONSABILIDADES = [
  // Inicio
  "Aplicar la lista de chequeo de inicio de obra",
  "Revisar los antecedentes contractuales y legales del proyecto",
  "Constituir el equipo y publicar la matriz de responsabilidades",
  "Participar en la entrega de terreno a la constructora",
  "Verificar la instalación de faenas y los servicios provisorios",
  "Abrir la carpeta digital del proyecto y su estructura de archivos",
  "Definir el plan de inspección y ensayos del proyecto",

  // Coordinación y comunicaciones
  "Liderar las reuniones de obra",
  "Redactar y distribuir las actas de reunión",
  "Mantener el libro de correspondencia enviada y recibida",
  "Emitir cartas formales al contratista y al mandante",
  "Coordinar y hacer seguimiento de las RDI",
  "Mantener el registro del libro de obra",

  // Control técnico
  "Aplicar los protocolos de control de calidad constructivo",
  "Verificar el trazado, los niveles y la topografía",
  "Controlar los ensayos de laboratorio y sus certificados",
  "Revisar la recepción de materiales y sus certificaciones",
  "Verificar el cumplimiento de las especificaciones técnicas",
  "Mantener el listado maestro de planos y sus versiones",
  "Levantar y hacer seguimiento del listado de observaciones",
  "Controlar el avance físico de la obra en terreno",
  "Revisar la curva S y el avance real contra el programado",
  "Mantener el registro fotográfico del avance",

  // Control administrativo y financiero
  "Revisar los estados de pago presentados por el contratista",
  "Validar las notas de cambio y las obras extraordinarias",
  "Elaborar el resumen de modificaciones de obra",
  "Controlar los aportes y suministros del mandante",
  "Revisar las órdenes de compra y su respaldo",
  "Controlar las boletas de garantía y su vigencia",
  "Controlar las pólizas de seguro y su vigencia",
  "Hacer seguimiento de los permisos y autorizaciones",
  "Controlar los aumentos de plazo y su justificación",
  "Verificar la aplicación de multas cuando corresponda",

  // Seguridad y medio ambiente
  "Verificar las condiciones de seguridad en terreno",
  "Revisar los informes de seguridad de la constructora",
  "Registrar y hacer seguimiento de incidentes y accidentes",
  "Verificar el manejo ambiental y de residuos de la obra",

  // Reportería
  "Emitir el informe ejecutivo semanal",
  "Emitir el informe mensual de avance",
  "Emitir el informe de ingreso a obra",
  "Preparar los reportes solicitados por el mandante",

  // Cierre
  "Hacer seguimiento de los certificados para la recepción municipal",
  "Participar en la recepción provisoria de la obra",
  "Verificar el levantamiento de observaciones de recepción",
  "Recibir y revisar los planos as built",
  "Armar la carpeta entregable al mandante",
  "Realizar el cierre administrativo del contrato",
  "Emitir el informe final del proyecto",
  "Evaluar el desempeño de la constructora y registrar lecciones aprendidas",
];

export const TOTAL_ESPECIALIDADES = ESPECIALIDADES.length;
export const TOTAL_OPCIONES_CATALOGO = OPCIONES.length;
export const TOTAL_RESPONSABILIDADES = RESPONSABILIDADES.length;

/** Crea los catálogos por defecto si no existen. Seguro de repetir. */
export async function crearCatalogosIniciales(db: ClientePrisma) {
  for (const [indice, especialidad] of ESPECIALIDADES.entries()) {
    await db.especialidad.upsert({
      where: { codigo: especialidad.codigo },
      update: {},
      create: { ...especialidad, orden: indice },
    });
  }

  for (const [indice, opcion] of OPCIONES.entries()) {
    await db.opcionCatalogo.upsert({
      where: { tipo_codigo: { tipo: opcion.tipo, codigo: opcion.codigo } },
      update: {},
      create: { ...opcion, orden: indice },
    });
  }
}

/**
 * Carga la matriz de responsabilidades en una plantilla del checklist.
 *
 * Comparte la versión con el checklist a propósito: una versión de la
 * metodología es una sola cosa, y así no pueden quedar desincronizadas.
 */
export async function crearResponsabilidadesIniciales(db: ClientePrisma, plantillaId: string) {
  const existentes = await db.responsabilidadPlantilla.count({ where: { plantillaId } });
  if (existentes > 0) return { creadas: false };

  await db.responsabilidadPlantilla.createMany({
    data: RESPONSABILIDADES.map((descripcion, indice) => ({
      plantillaId,
      codigo: `R${String(indice + 1).padStart(2, "0")}`,
      descripcion,
      orden: indice,
    })),
  });

  return { creadas: true };
}
