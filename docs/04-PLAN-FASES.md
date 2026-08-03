# 04 — Plan de Implementación por Fases

Cada fase termina con: la aplicación **compilando y ejecutándose**, pruebas en verde, un
resumen de lo implementado y las instrucciones concretas para que lo pruebes tú mismo. No se
avanza a la fase siguiente sin tu visto bueno.

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

## Fase 3 — Ciclos de revisión y auditoría

- Crear ciclo de revisión: congela un snapshot de todos los ítems del proyecto.
- Flujo de aprobación en dos niveles: Jefe de Proyecto → Subgerente, con fecha, resultado
  (aprobado / con observaciones / rechazado) y comentario.
- Historial completo de ciclos, comparación entre ciclos y **gráfico de evolución del
  cumplimiento**.
- Vista de auditoría por proyecto y por ítem: quién cambió qué, cuándo, valor anterior y nuevo.
- Registro automático de auditoría vía middleware de Prisma en todas las mutaciones.
- Tests: apertura y cierre de ciclos, inmutabilidad de los snapshots, reglas de aprobación.

**Criterio de aceptación**: cierras un ciclo, lo aprueba el JP y luego el Subgerente, y el
histórico anterior queda intacto y consultable.

---

## Fase 4 — Dashboard y alertas

- **Panel general**: todos los clientes y proyectos activos con su % de cumplimiento, semáforo
  por umbral configurable, orden y filtros; vista consolidada por cliente.
- **Módulo de vencimientos**: alta y seguimiento de boletas de garantía, pólizas y permisos con
  fecha, monto, entidad emisora y documento adjunto.
- **Motor de alertas** (job diario vía Vercel Cron):
  - vencimientos próximos según los días de alerta configurados,
  - vencimientos ya cumplidos,
  - ítems atrasados según su frecuencia (semanal, mensual, etc.),
  - proyectos bajo el umbral de cumplimiento,
  - ciclos de revisión pendientes.
- Centro de alertas con estados (activa / vista / resuelta / descartada) e insignia en la
  navegación.
- Notificaciones por correo (opcional, con Resend) — resumen semanal y alertas críticas.
- Tests: cálculo de próxima fecha de control por frecuencia, estados de vencimiento, generación
  de alertas.

**Criterio de aceptación**: una boleta que vence en 25 días aparece como alerta activa en el
panel, sin que nadie la haya ingresado a mano en un recordatorio.

---

## Fase 5 — Exportación y reportes

- **PDF de estado de proyecto** con tu marca: portada con logo y datos del cliente, ficha del
  proyecto, resumen de cumplimiento por categoría, detalle del checklist, vencimientos
  vigentes, historial de revisiones y firmas.
- **Excel de estado de proyecto**: formato de planilla equivalente al Plan de Calidad, para
  quien prefiera el formato tradicional.
- Reporte consolidado por cliente (todos sus proyectos).
- Configuración del reporte: qué secciones incluir, con o sin observaciones internas.
- Tests: generación sin errores, cifras del reporte coinciden con las de la aplicación.

**Criterio de aceptación**: generas un PDF con tu logo y se lo puedes mandar al cliente tal cual.

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
