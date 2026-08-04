import { z } from "zod";

/**
 * Esquemas de validación compartidos entre formularios y Server Actions.
 * La validación del servidor es la única que manda; la del cliente es comodidad.
 */

const textoOpcional = z
  .string()
  .trim()
  .optional()
  .transform((valor) => (valor === "" ? undefined : valor));

const emailOpcional = z
  .string()
  .trim()
  .optional()
  .transform((valor) => (valor === "" ? undefined : valor))
  .refine((valor) => valor === undefined || z.string().email().safeParse(valor).success, {
    message: "Correo electrónico inválido",
  });

const fechaOpcional = z
  .string()
  .optional()
  .transform((valor) => (valor ? new Date(valor) : undefined))
  .refine((valor) => valor === undefined || !Number.isNaN(valor.getTime()), {
    message: "Fecha inválida",
  });

const numeroOpcional = z
  .string()
  .optional()
  .transform((valor) => (valor === undefined || valor === "" ? undefined : Number(valor)))
  .refine((valor) => valor === undefined || Number.isFinite(valor), {
    message: "Debe ser un número",
  });

/**
 * Campo que se puede vaciar.
 *
 * Distinto de `textoOpcional`: aquel devuelve `undefined`, que en Prisma significa
 * «no cambiar». Estos campos sí deben poder borrarse, así que un valor vacío tiene
 * que llegar como `null` para que la actualización lo limpie de verdad.
 */
const textoNullable = z
  .string()
  .trim()
  .optional()
  .transform((valor) => (valor === undefined || valor === "" ? null : valor));

const fechaNullable = z
  .string()
  .optional()
  .transform((valor) => (valor === undefined || valor === "" ? null : new Date(valor)))
  .refine((valor) => valor === null || !Number.isNaN(valor.getTime()), {
    message: "Fecha inválida",
  });

const FRECUENCIAS = [
  "INICIO_PROYECTO",
  "DIARIA",
  "SEMANAL",
  "QUINCENAL",
  "MENSUAL",
  "TRIMESTRAL",
  "SEGUN_REQUERIMIENTO",
  "POR_EVENTO",
  "PERMANENTE",
  "FINAL_PROYECTO",
] as const;

const ROLES_OPERATIVOS = ["ITO", "ITO_APOYO", "JEFE_PROYECTO", "SUBGERENTE"] as const;

// ---------------------------------------------------------------- Cliente

export const esquemaCliente = z.object({
  nombre: z.string().trim().min(2, "El nombre o razón social es obligatorio"),
  nombreFantasia: textoOpcional,
  rut: textoOpcional,
  tipo: z.enum([
    "INMOBILIARIA",
    "CONSTRUCTORA",
    "MANDANTE_PRIVADO",
    "ORGANISMO_PUBLICO",
    "OTRO",
  ]),
  contactoNombre: textoOpcional,
  contactoCargo: textoOpcional,
  contactoEmail: emailOpcional,
  contactoTelefono: textoOpcional,
  direccion: textoOpcional,
  comuna: textoOpcional,
  region: textoOpcional,
  notas: textoOpcional,
  activo: z.coerce.boolean().default(true),
});

export type DatosCliente = z.infer<typeof esquemaCliente>;

// --------------------------------------------------------------- Proyecto

export const esquemaProyecto = z.object({
  codigo: z
    .string()
    .trim()
    .min(2, "El código del proyecto es obligatorio")
    .max(30, "Máximo 30 caracteres"),
  nombre: z.string().trim().min(3, "El nombre del proyecto es obligatorio"),
  clienteId: z.string().min(1, "Selecciona el cliente mandante"),
  constructoraNombre: textoOpcional,
  constructoraRut: textoOpcional,
  centroCosto: textoOpcional,
  direccion: textoOpcional,
  comuna: textoOpcional,
  region: textoOpcional,
  tipoObra: textoOpcional,
  superficieM2: numeroOpcional,
  numeroUnidades: numeroOpcional,
  montoContrato: numeroOpcional,
  moneda: z.enum(["CLP", "UF", "USD"]).default("CLP"),
  fechaInicio: fechaOpcional,
  fechaTerminoEstimada: fechaOpcional,
  estado: z
    .enum(["PLANIFICACION", "ACTIVO", "SUSPENDIDO", "EN_CIERRE", "CERRADO"])
    .default("PLANIFICACION"),
  notas: textoOpcional,
  // Equipo asignado — se traducen a filas de AsignacionProyecto
  itoId: textoOpcional,
  jefeProyectoId: textoOpcional,
  subgerenteId: textoOpcional,
});

export type DatosProyecto = z.infer<typeof esquemaProyecto>;

// ---------------------------------------------------------------- Empresa

const colorHex = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "Debe ser un color en formato #RRGGBB");

export const esquemaEmpresa = z.object({
  nombreEmpresa: z.string().trim().min(2, "El nombre de la empresa es obligatorio"),
  nombreCorto: z.string().trim().min(1, "La sigla es obligatoria").max(8, "Máximo 8 caracteres"),
  razonSocial: textoOpcional,
  rut: textoOpcional,
  giro: textoOpcional,
  direccion: textoOpcional,
  comuna: textoOpcional,
  telefono: textoOpcional,
  email: emailOpcional,
  sitioWeb: textoOpcional,
  logoUrl: textoOpcional,
  colorPrimario: colorHex,
  colorSecundario: colorHex,
  colorAcento: colorHex,
  prefijoDocumentos: z
    .string()
    .trim()
    .min(1, "El prefijo es obligatorio")
    .max(8, "Máximo 8 caracteres"),
  formatoCodigoRegistro: z
    .string()
    .trim()
    .min(1)
    .refine((valor) => /\{(prefijo|categoria|correlativo|item)\}/.test(valor), {
      message: "Debe incluir al menos un marcador: {prefijo}, {categoria}, {correlativo} o {item}",
    }),
  piePaginaReportes: textoOpcional,
  diasAlertaVencimientoDefecto: z.coerce.number().int().min(1).max(365),
  umbralCumplimientoBajo: z.coerce.number().int().min(1).max(100),
});

export type DatosEmpresa = z.infer<typeof esquemaEmpresa>;

// ---------------------------------------------------------------- Usuario

export const esquemaUsuario = z.object({
  email: z.string().trim().toLowerCase().email("Correo electrónico inválido"),
  nombre: z.string().trim().min(2, "El nombre es obligatorio"),
  apellido: z.string().trim().min(2, "El apellido es obligatorio"),
  cargo: textoOpcional,
  telefono: textoOpcional,
  rolGlobal: z.enum(["ADMIN", "SUBGERENTE", "JEFE_PROYECTO", "ITO"]),
  activo: z.coerce.boolean().default(true),
  password: z
    .string()
    .optional()
    .transform((valor) => (valor === "" ? undefined : valor))
    .refine((valor) => valor === undefined || valor.length >= 8, {
      message: "La contraseña debe tener al menos 8 caracteres",
    }),
});

export type DatosUsuario = z.infer<typeof esquemaUsuario>;

// --------------------------------------------------------------- Plantilla

export const esquemaCategoriaPlantilla = z.object({
  plantillaId: z.string().min(1),
  codigo: z.string().trim().min(1, "El código es obligatorio").max(6),
  nombre: z.string().trim().min(2, "El nombre es obligatorio"),
  descripcion: textoOpcional,
  orden: z.coerce.number().int().min(0).default(0),
  activa: z.coerce.boolean().default(true),
});

export const esquemaItemPlantilla = z.object({
  categoriaId: z.string().min(1),
  codigo: z.string().trim().min(1, "El código es obligatorio").max(12),
  descripcion: z.string().trim().min(3, "La descripción es obligatoria"),
  codigoRegistro: textoOpcional,
  subgrupo: textoOpcional,
  instrucciones: textoOpcional,
  frecuencia: z.enum(FRECUENCIAS),
  responsableRol: z.enum(ROLES_OPERATIVOS),
  revisorRol: z.enum(ROLES_OPERATIVOS),
  requiereRespaldoDigital: z.enum(["REQUERIDO", "OPCIONAL", "NO_APLICA"]),
  requiereRespaldoFisico: z.enum(["REQUERIDO", "OPCIONAL", "NO_APLICA"]),
  controlaVencimiento: z.coerce.boolean().default(false),
  aplicaPorDefecto: z.coerce.boolean().default(true),
  visibleParaCliente: z.coerce.boolean().default(true),
  orden: z.coerce.number().int().min(0).default(0),
  activo: z.coerce.boolean().default(true),
});

// ------------------------------------------------- Checklist del proyecto

/**
 * Edición de un ítem del checklist de un proyecto.
 *
 * Es la copia viva, no la plantilla: aquí se registra lo que ocurre en obra.
 * Todos los campos son opcionales porque la vista guarda campo a campo — quien
 * cambia solo el estado de cumplimiento no debe reenviar el resto del ítem.
 */
export const esquemaEdicionItem = z.object({
  aplica: z.coerce.boolean().optional(),
  cumple: z.enum(["SI", "NO", "NA", "PENDIENTE"]).optional(),
  respaldoDigital: z.enum(["SI", "NO", "NA"]).optional(),
  respaldoFisico: z.enum(["SI", "NO", "NA"]).optional(),
  observaciones: textoNullable.optional(),
  responsableUsuarioId: textoNullable.optional(),
  frecuencia: z.enum(FRECUENCIAS).optional(),
  responsableRol: z.enum(ROLES_OPERATIVOS).optional(),
  revisorRol: z.enum(ROLES_OPERATIVOS).optional(),
  fechaUltimoControl: fechaNullable.optional(),
});

export type DatosEdicionItem = z.infer<typeof esquemaEdicionItem>;

/** Ítem creado a medida para un proyecto puntual, fuera de la plantilla maestra. */
export const esquemaItemAdHoc = z.object({
  categoriaProyectoId: z.string().min(1, "Selecciona la categoría"),
  descripcion: z.string().trim().min(3, "La descripción es obligatoria"),
  codigoRegistro: textoNullable,
  subgrupo: textoNullable,
  instrucciones: textoNullable,
  frecuencia: z.enum(FRECUENCIAS).default("SEGUN_REQUERIMIENTO"),
  responsableRol: z.enum(ROLES_OPERATIVOS).default("ITO"),
  revisorRol: z.enum(ROLES_OPERATIVOS).default("JEFE_PROYECTO"),
  requiereRespaldoDigital: z.enum(["REQUERIDO", "OPCIONAL", "NO_APLICA"]).default("REQUERIDO"),
  requiereRespaldoFisico: z.enum(["REQUERIDO", "OPCIONAL", "NO_APLICA"]).default("NO_APLICA"),
  visibleParaCliente: z.coerce.boolean().default(true),
});

/** Acción aplicada a todos los ítems de una categoría a la vez. */
export const esquemaAccionMasiva = z.object({
  categoriaProyectoId: z.string().min(1),
  operacion: z.enum(["marcarNoAplica", "marcarAplica", "asignarResponsable"]),
  responsableUsuarioId: textoNullable.optional(),
});

// ------------------------------------------------- Catálogos configurables

const TIPOS_CATALOGO = [
  "TIPO_PROYECTO",
  "ESTADO_DOCUMENTO",
  "CAUSA_NO_CUMPLIMIENTO",
  "TIPO_SERVICIO",
  "CARGO_EQUIPO",
  "RECURSO_TERRENO",
] as const;

/**
 * El código identifica la opción en el código de la aplicación (por ejemplo,
 * `dominio/planificacion.ts` decide por él qué módulos se activan), así que se
 * restringe a mayúsculas, dígitos y guion bajo.
 */
const codigoCatalogo = z
  .string()
  .trim()
  .toUpperCase()
  .min(2, "El código es obligatorio")
  .max(30, "Máximo 30 caracteres")
  .regex(/^[A-Z0-9_]+$/, "Solo mayúsculas, números y guion bajo");

export const esquemaOpcionCatalogo = z.object({
  tipo: z.enum(TIPOS_CATALOGO),
  codigo: codigoCatalogo,
  etiqueta: z.string().trim().min(2, "El nombre visible es obligatorio").max(80),
  orden: z.coerce.number().int().min(0).default(0),
  activa: z.coerce.boolean().default(true),
});

export const esquemaEspecialidad = z.object({
  codigo: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, "La sigla es obligatoria")
    .max(6, "Máximo 6 caracteres")
    .regex(/^[A-Z0-9]+$/, "Solo mayúsculas y números"),
  nombre: z.string().trim().min(2, "El nombre es obligatorio").max(60),
  orden: z.coerce.number().int().min(0).default(0),
  activa: z.coerce.boolean().default(true),
});

// ------------------------------------------------- Guía de planificación

export const esquemaServicioContratado = z.object({
  aplica: z.coerce.boolean().optional(),
  fechaInicio: fechaNullable.optional(),
  fechaTermino: fechaNullable.optional(),
  comentario: textoNullable.optional(),
});

export const esquemaResponsabilidadProyecto = z.object({
  aplica: z.coerce.boolean().optional(),
  responsableUsuarioId: textoNullable.optional(),
  itemProyectoId: textoNullable.optional(),
  requerimientoCliente: textoNullable.optional(),
  observaciones: textoNullable.optional(),
});

export const esquemaEnfoqueServicio = z.object({
  enfoqueServicio: textoNullable,
});

export const esquemaDedicacionEquipo = z.object({
  asignacionId: z.string().min(1),
  dedicacion: z
    .enum(["TOTAL", "PARCIAL", "VISITAS", ""])
    .transform((valor) => (valor === "" ? null : valor)),
});

/** Convierte los errores de Zod al formato { campo: mensaje } que usan los formularios. */
export function erroresDeCampo(error: z.ZodError): Record<string, string> {
  const errores: Record<string, string> = {};
  for (const problema of error.issues) {
    const campo = problema.path.join(".");
    if (campo && !errores[campo]) errores[campo] = problema.message;
  }
  return errores;
}

/**
 * Lee un FormData como objeto plano.
 *
 * Los campos booleanos necesitan cuidado especial: **un checkbox desmarcado no
 * se envía**. En un formulario que guarda campo a campo eso es indistinguible
 * de «este campo no venía», y desmarcar una casilla nunca se guardaría.
 *
 * La convención del proyecto es acompañar cada checkbox de un input oculto con
 * el mismo nombre y valor `false`, declarado ANTES. Así el campo siempre viaja:
 * desmarcado llega solo el `false`, y marcado llegan ambos. Por eso aquí se
 * toma el **último** valor, que es el del checkbox.
 *
 * Si el campo no viene del todo, se deja ausente para que Prisma no lo toque.
 */
export function aObjeto(datos: FormData, camposBooleanos: string[] = []): Record<string, unknown> {
  const objeto: Record<string, unknown> = {};
  for (const [clave, valor] of datos.entries()) {
    if (valor instanceof File) continue;
    objeto[clave] = valor;
  }
  for (const campo of camposBooleanos) {
    if (!datos.has(campo)) {
      delete objeto[campo];
      continue;
    }
    const valores = datos.getAll(campo);
    const ultimo = valores[valores.length - 1];
    objeto[campo] = ultimo === "on" || ultimo === "true";
  }
  return objeto;
}
