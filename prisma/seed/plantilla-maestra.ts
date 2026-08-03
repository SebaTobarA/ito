/**
 * Plantilla maestra del checklist de calidad — versión 1.
 *
 * Metodología propia: 20 categorías y 99 registros. Documentada en
 * docs/05-CHECKLIST-MAESTRO.md.
 *
 * Todo esto es editable después desde Administración → Plantillas; este archivo
 * solo define el punto de partida de una instalación nueva.
 */

import type { Frecuencia, Requisito, RolProyecto } from "@prisma/client";

// Abreviaturas para que las tablas se lean igual que en la documentación.
const INI: Frecuencia = "INICIO_PROYECTO";
const SEM: Frecuencia = "SEMANAL";
const MEN: Frecuencia = "MENSUAL";
const SR: Frecuencia = "SEGUN_REQUERIMIENTO";
const EVE: Frecuencia = "POR_EVENTO";
const PERM: Frecuencia = "PERMANENTE";
const FIN: Frecuencia = "FINAL_PROYECTO";

const ITO: RolProyecto = "ITO";
const JP: RolProyecto = "JEFE_PROYECTO";
const SUB: RolProyecto = "SUBGERENTE";

const R: Requisito = "REQUERIDO";
const O: Requisito = "OPCIONAL";
const NA: Requisito = "NO_APLICA";

export interface ItemSeed {
  codigo: string;
  descripcion: string;
  frecuencia: Frecuencia;
  responsableRol: RolProyecto;
  revisorRol: RolProyecto;
  requiereRespaldoDigital: Requisito;
  requiereRespaldoFisico: Requisito;
  subgrupo?: string;
  controlaVencimiento?: boolean;
  instrucciones?: string;
}

export interface CategoriaSeed {
  codigo: string;
  nombre: string;
  descripcion: string;
  items: ItemSeed[];
}

type Fila = [
  codigo: string,
  descripcion: string,
  frecuencia: Frecuencia,
  responsableRol: RolProyecto,
  revisorRol: RolProyecto,
  requiereRespaldoDigital: Requisito,
  requiereRespaldoFisico: Requisito,
  extra?: Partial<Pick<ItemSeed, "subgrupo" | "controlaVencimiento" | "instrucciones">>,
];

function items(filas: Fila[]): ItemSeed[] {
  return filas.map(([codigo, descripcion, frec, resp, rev, dig, fis, extra]) => ({
    codigo,
    descripcion,
    frecuencia: frec,
    responsableRol: resp,
    revisorRol: rev,
    requiereRespaldoDigital: dig,
    requiereRespaldoFisico: fis,
    ...extra,
  }));
}

// Subgrupos de la categoría 05 (Protocolos), para que sea operable en pantalla.
const MOV_TIERRAS = "Movimiento de tierras y fundaciones";
const OBRA_GRUESA = "Obra gruesa";
const TERMINACIONES = "Terminaciones";
const INSTALACIONES = "Instalaciones";
const TRANSVERSALES = "Transversales y cierre";

export const PLANTILLA_MAESTRA_V1: CategoriaSeed[] = [
  {
    codigo: "00",
    nombre: "Inicio de Obra",
    descripcion:
      "Verificaciones y registros que deben quedar cerrados antes de iniciar la inspección en terreno.",
    items: items([
      ["0.1", "Lista de chequeo de inicio de obra", INI, ITO, JP, R, R],
      ["0.2", "Verificación de antecedentes contractuales y legales del proyecto", INI, JP, SUB, R, O],
      ["0.3", "Constitución del equipo y matriz de responsabilidades", INI, JP, SUB, R, NA],
      ["0.4", "Apertura de carpeta digital del proyecto y estructura de archivos", INI, ITO, JP, R, NA],
    ]),
  },
  {
    codigo: "01",
    nombre: "Planificación",
    descripcion: "Definición del alcance del servicio y de cómo se va a controlar el proyecto.",
    items: items([
      ["1.1", "Guía de planificación del proyecto", INI, JP, SUB, R, R],
      [
        "1.2",
        "Plan de inspección y ensayos (alcance de la ITO)",
        INI,
        ITO,
        JP,
        R,
        O,
        {
          instrucciones:
            "Define desde el inicio qué partidas se controlan, con qué criterio de aceptación y con qué frecuencia. Es el documento que se le muestra al mandante para explicar el alcance del servicio.",
        },
      ],
      ["1.3", "Actualización de la planificación", MEN, JP, SUB, R, NA],
    ]),
  },
  {
    codigo: "02",
    nombre: "Correspondencia",
    descripcion: "Trazabilidad de todas las comunicaciones formales del proyecto.",
    items: items([
      ["2.1", "Libro de correspondencia enviada y recibida", PERM, ITO, JP, R, NA],
      ["2.2", "Cartas formales (emitidas y recibidas)", SR, ITO, JP, R, O],
      ["2.3", "Registro de correos electrónicos relevantes", PERM, ITO, JP, R, NA],
    ]),
  },
  {
    codigo: "03",
    nombre: "Actas",
    descripcion: "Actas formales del ciclo de vida del proyecto, todas con respaldo firmado.",
    items: items([
      ["3.1", "Acta de reunión de obra", SEM, ITO, JP, R, R],
      ["3.2", "Acta de entrega de terreno", EVE, JP, SUB, R, R],
      ["3.3", "Acta de ingreso de contratistas y subcontratos", EVE, ITO, JP, R, R],
      ["3.4", "Acta de recepción provisoria", EVE, JP, SUB, R, R],
      ["3.5", "Acta de recepción definitiva", EVE, JP, SUB, R, R],
      ["3.6", "Acta de término anticipado de contrato", SR, JP, SUB, R, R],
    ]),
  },
  {
    codigo: "04",
    nombre: "Planos y Especificaciones Técnicas",
    descripcion: "Control de versiones vigentes de la documentación técnica del proyecto.",
    items: items([
      [
        "4.1",
        "Listado maestro de planos y especificaciones (control de versiones)",
        PERM,
        ITO,
        JP,
        R,
        NA,
        {
          instrucciones:
            "Mantener actualizado cada vez que ingresa una revisión nueva. Es la defensa ante discrepancias entre lo ejecutado y lo proyectado.",
        },
      ],
      ["4.2", "Almacenamiento de planos por especialidad", PERM, ITO, JP, R, NA],
    ]),
  },
  {
    codigo: "05",
    nombre: "Protocolos de Control de Calidad Constructivo",
    descripcion:
      "Protocolos de aceptación por partida, ordenados según la secuencia constructiva de la obra.",
    items: items([
      // Movimiento de tierras y fundaciones
      ["5.1", "Topografía, trazado y niveles", EVE, ITO, JP, R, R, { subgrupo: MOV_TIERRAS }],
      ["5.2", "Excavaciones", EVE, ITO, JP, R, R, { subgrupo: MOV_TIERRAS }],
      ["5.3", "Demoliciones", EVE, ITO, JP, R, R, { subgrupo: MOV_TIERRAS }],
      ["5.4", "Relleno y compactación", EVE, ITO, JP, R, R, { subgrupo: MOV_TIERRAS }],
      ["5.5", "Pilas de socalzado", EVE, ITO, JP, R, R, { subgrupo: MOV_TIERRAS }],
      // Obra gruesa
      ["5.6", "Enfierradura", EVE, ITO, JP, R, R, { subgrupo: OBRA_GRUESA }],
      ["5.7", "Moldaje y descimbre", EVE, ITO, JP, R, R, { subgrupo: OBRA_GRUESA }],
      [
        "5.8",
        "Hormigones (colocación, muestreo y ensayos)",
        EVE,
        ITO,
        JP,
        R,
        R,
        {
          subgrupo: OBRA_GRUESA,
          instrucciones:
            "Adjuntar guía de despacho, registro de asentamiento de cono y certificado de ensayo a compresión a 7 y 28 días.",
        },
      ],
      ["5.9", "Albañilerías", EVE, ITO, JP, R, R, { subgrupo: OBRA_GRUESA }],
      ["5.10", "Estructuras metálicas", EVE, ITO, JP, R, R, { subgrupo: OBRA_GRUESA }],
      ["5.11", "Estructuras de madera", EVE, ITO, JP, R, R, { subgrupo: OBRA_GRUESA }],
      ["5.12", "Montaje de elementos prefabricados", EVE, ITO, JP, R, R, { subgrupo: OBRA_GRUESA }],
      ["5.13", "Sobrelosas", EVE, ITO, JP, R, R, { subgrupo: OBRA_GRUESA }],
      ["5.14", "Tabiquerías", EVE, ITO, JP, R, R, { subgrupo: OBRA_GRUESA }],
      ["5.15", "Cubiertas", EVE, ITO, JP, R, R, { subgrupo: OBRA_GRUESA }],
      ["5.16", "Impermeabilizaciones", EVE, ITO, JP, R, R, { subgrupo: OBRA_GRUESA }],
      ["5.17", "Aislaciones térmicas y acústicas", EVE, ITO, JP, R, R, { subgrupo: OBRA_GRUESA }],
      // Terminaciones
      ["5.18", "Estucos", EVE, ITO, JP, R, R, { subgrupo: TERMINACIONES }],
      ["5.19", "Enlucidos", EVE, ITO, JP, R, R, { subgrupo: TERMINACIONES }],
      ["5.20", "Revestimientos de piso y muro", EVE, ITO, JP, R, R, { subgrupo: TERMINACIONES }],
      ["5.21", "Pavimentos de hormigón", EVE, ITO, JP, R, R, { subgrupo: TERMINACIONES }],
      ["5.22", "Pavimentos asfálticos", EVE, ITO, JP, R, R, { subgrupo: TERMINACIONES }],
      ["5.23", "Pinturas", EVE, ITO, JP, R, R, { subgrupo: TERMINACIONES }],
      ["5.24", "Instalación de cielos", EVE, ITO, JP, R, R, { subgrupo: TERMINACIONES }],
      ["5.25", "Instalación de puertas y ventanas", EVE, ITO, JP, R, R, { subgrupo: TERMINACIONES }],
      ["5.26", "Instalación de muebles", EVE, ITO, JP, R, R, { subgrupo: TERMINACIONES }],
      ["5.27", "Griferías y artefactos sanitarios", EVE, ITO, JP, R, R, { subgrupo: TERMINACIONES }],
      // Instalaciones
      [
        "5.28",
        "Instalaciones eléctricas y corrientes débiles",
        EVE,
        ITO,
        JP,
        R,
        R,
        { subgrupo: INSTALACIONES },
      ],
      [
        "5.29",
        "Instalaciones sanitarias (agua potable y alcantarillado)",
        EVE,
        ITO,
        JP,
        R,
        R,
        { subgrupo: INSTALACIONES },
      ],
      ["5.30", "Instalaciones de gas", EVE, ITO, JP, R, R, { subgrupo: INSTALACIONES }],
      ["5.31", "Climatización", EVE, ITO, JP, R, R, { subgrupo: INSTALACIONES }],
      [
        "5.32",
        "Sistemas mecánicos (ascensores, bombas, extracción)",
        EVE,
        ITO,
        JP,
        R,
        R,
        { subgrupo: INSTALACIONES },
      ],
      [
        "5.33",
        "Seguridad contra incendios (red húmeda y seca, detección)",
        EVE,
        ITO,
        JP,
        R,
        R,
        { subgrupo: INSTALACIONES },
      ],
      // Transversales y cierre
      ["5.34", "Instalación de faenas", INI, ITO, JP, R, R, { subgrupo: TRANSVERSALES }],
      [
        "5.35",
        "Control presupuestario de partidas ejecutadas",
        MEN,
        ITO,
        JP,
        R,
        NA,
        { subgrupo: TRANSVERSALES },
      ],
      [
        "5.36",
        "Recepción de departamentos / unidades",
        EVE,
        ITO,
        JP,
        R,
        R,
        { subgrupo: TRANSVERSALES },
      ],
      ["5.37", "Aseo final y entrega", FIN, ITO, JP, R, R, { subgrupo: TRANSVERSALES }],
      [
        "5.38",
        "Listado de observaciones y su levantamiento (punch list)",
        SR,
        ITO,
        JP,
        R,
        R,
        {
          subgrupo: TRANSVERSALES,
          instrucciones:
            "Cada observación con responsable, plazo y estado. Es el instrumento central de la recepción y el que más se revisa en el cierre.",
        },
      ],
    ]),
  },
  {
    codigo: "06",
    nombre: "Informes",
    descripcion: "Informes periódicos y de hito que la ITO entrega al mandante.",
    items: items([
      ["6.1", "Informe semanal ejecutivo", SEM, ITO, JP, R, NA],
      ["6.2", "Informe mensual de avance", MEN, JP, SUB, R, O],
      ["6.3", "Informe de ingreso a obra", INI, ITO, JP, R, NA],
      ["6.4", "Informe semanal de seguridad", SEM, ITO, JP, R, NA],
      ["6.5", "Informe mensual de seguridad", MEN, ITO, JP, R, NA],
      ["6.6", "Reporte preliminar de accidentes", EVE, ITO, JP, R, R],
      ["6.7", "Informe final del proyecto", FIN, JP, SUB, R, R],
    ]),
  },
  {
    codigo: "07",
    nombre: "Estados de Pago",
    descripcion: "Revisión y visación de los estados de pago de la constructora.",
    items: items([
      ["7.1", "Carátula de estado de pago", MEN, ITO, JP, R, R],
      ["7.2", "Resumen y control acumulado de estados de pago", MEN, JP, SUB, R, NA],
    ]),
  },
  {
    codigo: "08",
    nombre: "Presupuestos y Notas de Cambio",
    descripcion: "Control de las variaciones de alcance y su impacto en costo.",
    items: items([
      ["8.1", "Nota de cambio", SR, ITO, JP, R, R],
      ["8.2", "Resumen y control de notas de cambio", MEN, JP, SUB, R, NA],
      ["8.3", "Valores proforma", SR, ITO, JP, R, NA],
      ["8.4", "Control de aportes del mandante", MEN, JP, SUB, R, NA],
    ]),
  },
  {
    codigo: "09",
    nombre: "Requerimientos de Información (RDI)",
    descripcion: "Gestión y trazabilidad de las consultas técnicas de la constructora.",
    items: items([
      ["9.1", "Requerimiento de información (RDI)", SR, ITO, JP, R, O],
      ["9.2", "Listado de RDI gestionadas y su estado", SEM, ITO, JP, R, NA],
    ]),
  },
  {
    codigo: "10",
    nombre: "Órdenes de Compra",
    descripcion: "Control de las adquisiciones asociadas al proyecto.",
    items: items([
      ["10.1", "Orden de compra", SR, JP, SUB, R, R],
      ["10.2", "Listado y control de órdenes de compra", MEN, ITO, JP, R, NA],
    ]),
  },
  {
    codigo: "11",
    nombre: "Programación y Avance",
    descripcion: "Control del plazo: programa vigente y avance físico real contra programado.",
    items: items([
      ["11.1", "Programa vigente de obra (carta Gantt)", MEN, JP, SUB, R, NA],
      [
        "11.2",
        "Revisión de curva S y avance físico real vs. programado",
        SEM,
        ITO,
        JP,
        R,
        NA,
        {
          instrucciones:
            "Registrar la desviación acumulada y su causa. Es el respaldo de cualquier reclamo posterior por atraso.",
        },
      ],
    ]),
  },
  {
    codigo: "12",
    nombre: "Registro Fotográfico",
    descripcion: "Evidencia visual del avance y de las observaciones detectadas.",
    items: items([
      ["12.1", "Registro fotográfico semanal de avance", SEM, ITO, JP, R, NA],
      ["12.2", "Registro fotográfico de hitos y de observaciones", EVE, ITO, JP, R, NA],
    ]),
  },
  {
    codigo: "13",
    nombre: "Contrato, Garantías y Permisos",
    descripcion:
      "Documentación contractual y todo lo que tiene fecha de vencimiento y debe renovarse a tiempo.",
    items: items([
      ["13.1", "Contrato con la empresa constructora y sus anexos", INI, JP, SUB, R, R],
      [
        "13.2",
        "Boletas de garantía (fiel cumplimiento, anticipo, correcta ejecución)",
        PERM,
        JP,
        SUB,
        R,
        R,
        {
          controlaVencimiento: true,
          instrucciones:
            "Registrar cada boleta por separado con número, banco emisor, monto y fecha de vencimiento. El sistema alerta automáticamente antes del vencimiento.",
        },
      ],
      [
        "13.3",
        "Seguros y pólizas (todo riesgo, responsabilidad civil)",
        PERM,
        JP,
        SUB,
        R,
        R,
        { controlaVencimiento: true },
      ],
      [
        "13.4",
        "Permisos y autorizaciones (edificación, rotura, faena, sectoriales)",
        PERM,
        JP,
        SUB,
        R,
        R,
        { controlaVencimiento: true },
      ],
    ]),
  },
  {
    codigo: "14",
    nombre: "Planos As Built",
    descripcion: "Documentación de lo efectivamente construido, para la entrega al mandante.",
    items: items([
      ["14.1", "Listado de planos as built por especialidad", FIN, ITO, JP, R, NA],
      ["14.2", "Almacenamiento de planos as built", FIN, ITO, JP, R, O],
    ]),
  },
  {
    codigo: "15",
    nombre: "Seguridad y Medio Ambiente",
    descripcion: "Verificación del sistema de gestión de seguridad y ambiente de la constructora.",
    items: items([
      ["15.1", "Matriz de identificación de peligros y evaluación de riesgos", INI, ITO, JP, R, R],
      ["15.2", "Matriz de aspectos e impactos ambientales", INI, ITO, JP, R, R],
      ["15.3", "Análisis de trabajo seguro (ATS)", SR, ITO, JP, R, R],
      ["15.4", "Verificación de condiciones de seguridad y ambiente en terreno", SEM, ITO, JP, R, R],
      ["15.5", "Informe de investigación de incidentes y accidentes", EVE, ITO, JP, R, R],
      ["15.6", "Informes de seguridad emitidos por la constructora", MEN, ITO, JP, R, NA],
      ["15.7", "Listado de teléfonos y plan de emergencia", INI, ITO, JP, R, O],
      ["15.8", "Autoevaluación y evaluación de contratistas", MEN, ITO, JP, R, NA],
    ]),
  },
  {
    codigo: "16",
    nombre: "Recepción Municipal",
    descripcion: "Seguimiento de los antecedentes exigidos para la recepción final de la obra.",
    items: items([
      ["16.1", "Seguimiento de certificados y documentos para recepción final", MEN, JP, SUB, R, NA],
      ["16.2", "Certificado de recepción municipal definitiva", FIN, JP, SUB, R, R],
    ]),
  },
  {
    codigo: "17",
    nombre: "Carpeta Entregable",
    descripcion: "Documentación consolidada que se entrega al mandante al cierre del proyecto.",
    items: items([
      ["17.1", "Índice de la carpeta entregable al mandante", FIN, JP, SUB, R, R],
      ["17.2", "Acta de entrega de documentación al mandante", FIN, JP, SUB, R, R],
    ]),
  },
  {
    codigo: "18",
    nombre: "Cierre de Proyecto",
    descripcion: "Verificaciones finales y aprendizaje para los proyectos siguientes.",
    items: items([
      ["18.1", "Lista de chequeo de cierre de proyecto", FIN, ITO, JP, R, R],
      [
        "18.2",
        "Evaluación de desempeño de la constructora y lecciones aprendidas",
        FIN,
        JP,
        SUB,
        R,
        O,
        {
          instrucciones:
            "Registro interno. Alimenta el conocimiento propio del mercado de constructoras entre un proyecto y el siguiente.",
        },
      ],
    ]),
  },
  {
    codigo: "19",
    nombre: "Otros / Administración Interna",
    descripcion: "Registros administrativos propios que no encajan en las categorías anteriores.",
    items: items([
      ["19.1", "Registros administrativos internos del proyecto", SR, ITO, JP, O, NA],
      ["19.2", "Documentos varios no clasificados", SR, ITO, JP, O, NA],
    ]),
  },
];

export const TOTAL_ITEMS_PLANTILLA_V1 = PLANTILLA_MAESTRA_V1.reduce(
  (total, categoria) => total + categoria.items.length,
  0,
);
