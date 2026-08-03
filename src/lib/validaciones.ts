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
  frecuencia: z.enum([
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
  ]),
  responsableRol: z.enum(["ITO", "ITO_APOYO", "JEFE_PROYECTO", "SUBGERENTE"]),
  revisorRol: z.enum(["ITO", "ITO_APOYO", "JEFE_PROYECTO", "SUBGERENTE"]),
  requiereRespaldoDigital: z.enum(["REQUERIDO", "OPCIONAL", "NO_APLICA"]),
  requiereRespaldoFisico: z.enum(["REQUERIDO", "OPCIONAL", "NO_APLICA"]),
  controlaVencimiento: z.coerce.boolean().default(false),
  aplicaPorDefecto: z.coerce.boolean().default(true),
  visibleParaCliente: z.coerce.boolean().default(true),
  orden: z.coerce.number().int().min(0).default(0),
  activo: z.coerce.boolean().default(true),
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

/** Lee un FormData como objeto plano, tratando los checkbox no marcados como false. */
export function aObjeto(datos: FormData, camposBooleanos: string[] = []): Record<string, unknown> {
  const objeto: Record<string, unknown> = {};
  for (const [clave, valor] of datos.entries()) {
    if (valor instanceof File) continue;
    objeto[clave] = valor;
  }
  for (const campo of camposBooleanos) {
    objeto[campo] = datos.get(campo) === "on" || datos.get(campo) === "true";
  }
  return objeto;
}
