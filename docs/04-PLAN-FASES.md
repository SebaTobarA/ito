# 04 — Plan de Implementación por Fases

Cada fase termina con: la aplicación **compilando y ejecutándose**, pruebas en verde, un
resumen de lo implementado y las instrucciones concretas para que lo pruebes tú mismo. No se
avanza a la fase siguiente sin tu visto bueno.

Las entidades y los cálculos de las fases 3 a 6 están detallados en
[07-PLANIFICACION-E-INFORME-EJECUTIVO](07-PLANIFICACION-E-INFORME-EJECUTIVO.md).

---

## Fase 0 — Preparación del entorno *(previa, técnica)*

Este Mac no tiene Node.js, npm, `gh` ni Docker instalados. Antes de la Fase 1 hay que resolver:

- Instalar Node.js 20+ (tarball portable oficial, sin necesidad de Homebrew).
- Crear la base de datos en Neon y obtener el `DATABASE_URL`.
- Crear el repositorio vacío `ITO` en GitHub (requiere tu cuenta — un paso manual de 20 s).

**Entregable**: `npm run dev` levanta y `npx prisma migrate dev` conecta.

---

## Fase 1 — Fundacional

**Objetivo**: que exista la aplicación, con usuarios, clientes, proyectos y la plantilla
maestra cargada, y que crear un proyecto genere su checklist completo.

- Proyecto Next.js 15 + TypeScript + Tailwind + shadcn/ui, configuración de calidad
  (ESLint, Prettier, Vitest).
- Esquema Prisma completo (todas las entidades de [02-MODELO-DATOS](02-MODELO-DATOS.md)) y
  primera migración.
- Autenticación con Auth.js: login, cierre de sesión, protección de rutas, sesión con rol.
- Seed: usuario administrador, configuración de empresa por defecto y **plantilla maestra v1
  completa** (20 categorías, ~95 ítems de [05-CHECKLIST-MAESTRO](05-CHECKLIST-MAESTRO.md)).
- Panel de **configuración de empresa**: nombre, logo, colores, prefijo de codificación →
  aplicados en vivo a toda la interfaz.
- CRUD de **clientes**.
- CRUD de **proyectos** con ficha completa y asignación de ITO / Jefe de Proyecto / Subgerente.
- CRUD de la **plantilla maestra** (categorías e ítems) con versionado.
- **Clonado automático** de la plantilla activa al crear un proyecto.
- Gestión de usuarios y roles (solo Administrador).
- Layout responsive con navegación de escritorio y móvil.
- Tests: clonado de plantilla, módulo de permisos.

**Criterio de aceptación**: puedes entrar, cambiar el nombre y los colores de tu empresa, crear
un cliente, crear un proyecto y ver su checklist con las 20 categorías y todos los ítems ya
generados.

---

## Fase 2 — Checklist operativo

**Objetivo**: reemplazar efectivamente la planilla Excel.

- Vista de checklist por proyecto: acordeón de categorías (tarjetas apiladas en móvil, tabla en
  escritorio), buscador y filtros (por categoría, estado de cumplimiento, responsable,
  "solo pendientes").
- Edición de cada ítem: aplica, frecuencia, responsable, revisor, respaldo digital, respaldo
  físico, observaciones, cumple. Guardado optimista, sin recargar la página.
- **Carga de respaldos**: arrastrar y soltar, cámara en móvil, versionado, historial de
  versiones por ítem, descarga mediante URL firmada.
- **Cálculo de cumplimiento** por categoría y por proyecto, recalculado automáticamente en cada
  cambio, con indicadores visuales.
- Acciones masivas: marcar categoría completa como "no aplica", asignar responsable a varios
  ítems.
- Ítems ad-hoc: agregar un ítem propio a un proyecto puntual.
- PWA instalable.
- Tests: cálculo de cumplimiento (casos borde: todo NA, sin ítems, mezcla), versionado de
  documentos.

**Criterio de aceptación**: puedes operar un proyecto completo desde el celular en terreno,
subir una foto como respaldo y ver el porcentaje actualizarse al instante.

---

## Fase 3 — Catálogos y wizard de planificación

**Objetivo**: que cada proyecto declare qué se contrató y quién responde por qué, porque eso
determina qué módulos se activan en las fases siguientes.

- **Catálogos editables** desde administración: especialidades con su código, tipos de proyecto,
  estados de documento, causas de no cumplimiento, tipos de servicio, cargos y dedicación.
  Nada de esto queda fijo en el código.
- **Wizard de creación de proyecto** basado en la guía de planificación: servicios contratados
  (con fechas y comentario), equipo asignado con dedicación, enfoque del servicio.
- **Matriz de responsabilidades** tipo RACI: plantilla maestra versionada + copia independiente
  por proyecto, con responsable, registro asociado del checklist y requerimientos del cliente.
- Activación de módulos por proyecto según los servicios contratados.
- Tests: clonado de la matriz, resolución de módulos activos.

**Criterio de aceptación**: creas un proyecto de solo inspección técnica y la navegación no
muestra los módulos que ese contrato no incluye.

---

## Fase 4 — Registros operativos y UF

**Objetivo**: cargar los datos fuente que después alimentan el informe, sin cálculos todavía.

- **Notas de cambio** con los tres bloques de monto (solicitado / validado / aprobado).
- **RDI** con estado y días de respuesta derivados.
- **Estados de pago**, **procedimientos**, **correspondencia**, **libro de obra** y
  **registro de seguridad**.
- **Protocolos**: catálogo por partida, matriz protocolo × período y estado agregado por
  especialidad.
- **`PeriodoControl`**: la entidad que unifica columna de matriz, punto de curva e informe.
- **Tabla `ValorUf` y su job diario**. Va aquí y no en la fase financiera porque los estados de
  pago ya manejan dinero: sin conversión no se pueden mostrar.
- Tests: derivación de estados, conversión UF con valor faltante.

**Criterio de aceptación**: registras una RDI sin respuesta y aparece como pendiente con sus
días corriendo solos; un monto en UF se muestra en pesos con el valor del día correcto.

---

## Fase 5 — Curva de avance y control de plazo

**Objetivo**: el módulo de mayor densidad de dominio puro y el más vendible.

- **Partidas** con incidencia y fechas programadas; avance real por partida y por período.
- **Curva de avance**: programado, real, acumulados, atraso, velocidad relativa requerida y
  promedio, avance esperado recursivo y fecha de término proyectada.
- **Hitos** con fecha programada y real, variación de fin y cálculo de multa contra tope.
- **Aumentos de plazo** y **no cumplimientos** con causa y prioridad.
- Gráfico de curva S con las series programada, real y esperada.
- Tests: `curva.ts` y `plazo.ts` completos, incluidos períodos de duración irregular.

**Criterio de aceptación**: cargas el avance de las partidas de la semana y el sistema proyecta
solo la fecha de término, sin que nadie escriba el avance global.

---

## Fase 6 — Consolidado semanal y resumen ejecutivo

**Objetivo**: reemplazar el archivo de informe ejecutivo completo.

- **Formulario de consolidado** por proyecto y período: trae y calcula todo lo derivable y pide
  solo lo que requiere criterio humano (observaciones diarias, dotación, capacitaciones, hitos,
  no cumplimientos).
- **Modelo financiero**: costo directo, proforma, gastos generales, utilidades, modificaciones,
  IVA según régimen, anticipo, retenciones y líquido a pagar.
- **Resumen ejecutivo** de solo lectura, con snapshot congelado al emitir y versionado.
- Tests: `financiero.ts`, ventana de agregación período a período, inmutabilidad del snapshot.

**Criterio de aceptación**: emites el informe de la semana escribiendo unas doce cifras, y el
resumen ejecutivo queda listo para enviar.

---

## Fase 7 — Exportación, dashboard y alertas

- **PDF y Excel** del resumen ejecutivo y del estado de proyecto, con tu marca.
- **Panel general** con todos los proyectos, semáforo por umbral y consolidado por cliente.
- **Módulo de vencimientos**: boletas de garantía, pólizas y permisos con monto, entidad y
  documento adjunto.
- **Motor de alertas** (job diario vía Vercel Cron): vencimientos próximos y cumplidos, ítems
  atrasados por frecuencia, proyectos bajo umbral, **RDI sin respuesta, protocolos abiertos e
  hitos atrasados**.
- Centro de alertas con estados e insignia en la navegación; correo opcional con Resend.
- Tests: generación de alertas, cifras del reporte iguales a las de la aplicación.

**Criterio de aceptación**: una boleta que vence en 25 días y una RDI de 15 días sin respuesta
aparecen solas como alertas activas.

---

## Fase 8 — Ciclos de revisión y auditoría

Se posterga respecto del plan original: es control interno de calidad, no entregable al cliente,
y el motor de reporting genera ingresos antes.

- Ciclo de revisión que congela un snapshot de todos los ítems del proyecto.
- Aprobación en dos niveles: Jefe de Proyecto → Subgerente, con resultado y comentario.
- Historial, comparación entre ciclos y gráfico de evolución del cumplimiento.
- Vista de auditoría por proyecto y por ítem: quién cambió qué, cuándo, valor anterior y nuevo.
- Tests: apertura y cierre de ciclos, inmutabilidad de snapshots, reglas de aprobación.

**Criterio de aceptación**: cierras un ciclo, lo aprueba el JP y luego el Subgerente, y el
histórico anterior queda intacto.

---

## Fase futura — Portal de cliente *(diseñada, no implementada)*

Ya contemplada en el modelo de datos (ver
[02-MODELO-DATOS](02-MODELO-DATOS.md#cómo-queda-preparado-el-portal-de-cliente)). Cuando llegue
el momento requiere solamente:

1. Habilitar el rol `CLIENTE` en el login y crear usuarios con `clienteId`.
2. Asignaciones con rol `CLIENTE_LECTOR` en los proyectos que correspondan.
3. Un layout reducido de solo lectura: cumplimiento, documentos visibles, vencimientos, reportes.
4. Flujo de invitación por correo.

**Cero cambios al esquema de base de datos.**

## Otras extensiones evaluadas para después del MVP

- Firma digital de actas y protocolos.
- Registro fotográfico geolocalizado con línea de tiempo.
- Modo offline con cola de sincronización para terreno sin señal.
- Integración de estados de pago con curva S / avance físico.
- Aplicación móvil nativa (solo si la PWA queda corta).
