# 01 — Arquitectura y Stack Tecnológico

## Resumen de la propuesta

| Capa | Elección | Alternativa considerada |
|---|---|---|
| Framework | **Next.js 15 (App Router) + React 19 + TypeScript** | Backend separado (Express/Nest) |
| Estilos / UI | **Tailwind CSS v4 + shadcn/ui** (Radix) | MUI, Chakra |
| Base de datos | **PostgreSQL** (Neon, plan gratuito) | SQLite local |
| ORM | **Prisma 6** | Drizzle |
| Autenticación | **Auth.js v5 (NextAuth)** — Credentials + adaptador Prisma | Clerk, Lucia |
| Archivos | **Adaptador de almacenamiento** propio → Vercel Blob (MVP) / S3-R2 | Sistema de archivos local |
| PDF | **@react-pdf/renderer** | Puppeteer / headless Chrome |
| Excel | **ExcelJS** | SheetJS |
| Validación | **Zod** + react-hook-form | Yup |
| Tests | **Vitest** (lógica de dominio) + Playwright (E2E, fase posterior) | Jest |
| Tareas programadas | **Vercel Cron** → endpoint `/api/cron/alertas` | node-cron en VPS |
| Despliegue | **Vercel** (Hobby/Pro) + Neon + Blob | VPS con Docker Compose |

## Decisiones y justificación

### 1. Next.js monolítico, no backend separado

Un solo despliegue, un solo lenguaje, un solo repositorio. Para un equipo de 1–5 personas, un
backend separado agrega infraestructura y latencia sin beneficio. Se usan **Server Actions**
para mutaciones y **Server Components** para lectura, lo que reduce drásticamente el código de
API que habría que escribir y mantener.

Se mantiene una **frontera limpia**: toda la lógica de negocio vive en `src/server/servicios/`
y `src/dominio/`, no en los componentes. Si algún día se necesita una API pública (por ejemplo,
integración con el ERP de un cliente), se expone en `src/app/api/` reutilizando los mismos
servicios, sin reescribir nada.

### 2. PostgreSQL desde el inicio, no SQLite

Propusiste SQLite para iterar rápido. **Recomiendo ir directo a PostgreSQL** por tres razones
concretas:

- La aplicación es **multiusuario concurrente** desde el primer día (ITO en terreno + JP en
  oficina editando el mismo proyecto). SQLite serializa las escrituras.
- Se usan tipos que SQLite no soporta bien y que este modelo sí necesita: `enum` nativos,
  `Decimal` para montos de contrato, arreglos y `Json` para el registro de auditoría.
- Migrar SQLite → Postgres después implica reescribir migraciones y arreglar diferencias de
  tipos. Es trabajo tirado a la basura.

**Neon** tiene un plan gratuito suficiente para arrancar (0,5 GB, suspende cuando no se usa) y
escala a pago sin migración. Para desarrollo local sin Docker se usa la misma base Neon con una
rama de desarrollo (`branching` de Neon), que es gratis y evita instalar Postgres en el equipo.

### 3. Auth.js v5 con credenciales, preparado para SSO y portal de cliente

- MVP: email + contraseña (`bcrypt`), sesión JWT que transporta `usuarioId`, `rolGlobal` y la
  lista de proyectos asignados.
- Se instalan **igualmente las tablas del adaptador Prisma** (`Account`, `Session`,
  `VerificationToken`). Así, agregar Google Workspace / Microsoft Entra SSO más adelante es
  agregar un `provider` en la configuración, sin migración de base de datos.
- El portal de cliente futuro reutiliza el mismo login; lo único que cambia es el rol y el
  filtro de acceso (ver [02-MODELO-DATOS.md](02-MODELO-DATOS.md#permisos)).

### 4. Almacenamiento de archivos tras un adaptador

Los respaldos documentales (PDF, imágenes, Excel, Word) **nunca** se guardan en la base de
datos ni se accede a ellos directamente desde los componentes. Se define una interfaz:

```ts
interface AdaptadorAlmacenamiento {
  subir(archivo: File, ruta: string): Promise<{ clave: string; url: string; bytes: number }>
  obtenerUrlFirmada(clave: string, expiraEnSegundos: number): Promise<string>
  eliminar(clave: string): Promise<void>
}
```

Implementaciones: `VercelBlobStorage` (MVP, cero configuración), `S3Storage` (Cloudflare R2 —
sin costo de egreso, recomendado cuando el volumen crezca) y `DiscoLocalStorage` (para
desarrollo y para un eventual despliegue en VPS). Cambiar de proveedor es una variable de
entorno.

**Los archivos nunca son públicos.** Se sirven mediante URLs firmadas de corta duración
generadas por el servidor tras verificar permisos — condición indispensable para el portal de
cliente, donde un mandante no debe poder adivinar la URL del documento de otro proyecto.

### 5. PDF con @react-pdf/renderer

Puppeteer requiere un Chrome headless, que no corre en el runtime serverless de Vercel sin
paquetes especiales y aumenta mucho el tamaño del despliegue. `@react-pdf/renderer` genera el
PDF con React puro, corre en serverless, y permite construir la portada, encabezados y pie de
página con el **logo y colores configurados de la empresa**.

### 6. Responsive y uso en terreno

- Diseño *mobile-first*. El checklist en móvil se muestra como tarjetas apiladas, no como tabla
  horizontal.
- **PWA** (manifest + service worker) desde la Fase 2 para que se pueda "instalar" en el
  celular/tablet y abrir a pantalla completa.
- Subida de archivos con `capture` en móvil: sacar la foto del avance y adjuntarla al ítem sin
  salir de la app.
- El modo offline completo **no** entra en el MVP (es complejo y caro de mantener). Sí se
  contempla en el diseño: las evaluaciones de ítem se escriben una por una y son idempotentes,
  por lo que una cola de sincronización se puede agregar después sin cambiar el modelo.

## Requisitos no funcionales — cómo se cubren

| Requisito | Implementación |
|---|---|
| Interfaz en español (Chile) | Textos en español directamente en el código; `date-fns` con locale `es`, zona horaria `America/Santiago`; formato de moneda CLP y UF |
| Responsive / terreno | Tailwind mobile-first + PWA + captura de cámara |
| Auth con roles, extensible a SSO | Auth.js v5 con tablas de adaptador preinstaladas |
| Carga de archivos con versión y fecha | Modelo `Documento` con `version`, `esVersionActual`, `reemplazaADocumentoId` |
| Historial / auditoría | Tabla `RegistroAuditoria` escrita por un middleware de Prisma + snapshots inmutables por ciclo de revisión |
| Recálculo automático de cumplimiento | Función pura en `src/dominio/cumplimiento.ts`, invocada tras cada mutación; resultado cacheado en `Proyecto.porcentajeCumplimiento` |
| Panel de marca configurable | Tabla `ConfiguracionEmpresa` (fila única) → variables CSS inyectadas en el layout raíz |
| Código mantenible y con pruebas | Lógica pura en `src/dominio/` sin dependencias de base de datos → tests unitarios rápidos con Vitest |
| Hosting simple y barato | Vercel + Neon + Blob: **USD 0 para arrancar**, ~USD 20–25/mes al crecer |

## Costo estimado de operación

| Servicio | Plan inicial | Al crecer |
|---|---|---|
| Vercel | Hobby — USD 0 | Pro — USD 20/mes |
| Neon (Postgres) | Free — USD 0 | Launch — USD 19/mes |
| Vercel Blob / R2 | Incluido / ~USD 0,015 por GB | ~USD 1–5/mes |
| Dominio | — | ~USD 12/año |

**Alternativa VPS**: si prefieres un único servidor propio (por ejemplo un VPS de USD 6/mes con
Docker Compose: app + Postgres + MinIO), el stack funciona igual — solo cambia el adaptador de
almacenamiento a S3/MinIO y el cron a `node-cron`. No hay dependencia de infraestructura
propietaria de Vercel en la lógica de la aplicación.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| La metodología del checklist va a cambiar mucho el primer año | Plantillas **versionadas**: los proyectos ya creados conservan su copia; los nuevos usan la versión activa |
| Pérdida de un respaldo documental | Documentos versionados con borrado lógico (`eliminadoAt`), nunca borrado físico |
| Un cliente ve datos de otro cliente (futuro portal) | Filtro de acceso obligatorio en la capa de datos + URLs firmadas + banderas `visibleParaCliente` |
| Cold start de Neon free tier | Aceptable en MVP (~1 s); se resuelve con el plan Launch |
