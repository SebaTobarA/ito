# 02 — Modelo de Datos

Propuesta de esquema completo. La notación es Prisma, pero lo importante son las **entidades,
campos y relaciones**; los detalles de sintaxis se afinan al implementar.

Este documento cubre el núcleo: clientes, proyectos, checklist, documentos, vencimientos y
ciclos de revisión. Las entidades del motor de reporting —planificación, registros operativos,
curva de avance, informe semanal y manejo de UF— están en
[07-PLANIFICACION-E-INFORME-EJECUTIVO](07-PLANIFICACION-E-INFORME-EJECUTIVO.md).

## Mapa de entidades

```
ConfiguracionEmpresa (fila única — marca, colores, codificación)

Usuario ──┬── AsignacionProyecto ──┬── Proyecto ── Cliente
          │                        │
          │                        └── (rol en proyecto: ITO / JP / SUBGERENTE / CLIENTE_LECTOR)
          └── RegistroAuditoria

PlantillaChecklist (versionada)
  └── CategoriaPlantilla
        └── ItemPlantilla
                │  (se clona al crear un proyecto)
                ▼
Proyecto ── CategoriaProyecto ── ItemProyecto ──┬── Documento (versionado)
    │                                           ├── Vencimiento (garantías / seguros / permisos)
    │                                           └── EvaluacionItem ── CicloRevision ── AprobacionCiclo
    └── Alerta
```

## Enumeraciones

```prisma
enum RolGlobal {
  ADMIN          // Tú: todo el sistema
  SUBGERENTE     // Consolidado de sus clientes y proyectos, aprobación superior
  JEFE_PROYECTO  // Revisa y aprueba lo cargado por el ITO
  ITO            // Carga y actualiza el checklist de sus proyectos
  CLIENTE        // ⚠️ Definido desde ya, SIN uso en el MVP. Portal de solo lectura.
}

enum RolProyecto {
  ITO
  ITO_APOYO
  JEFE_PROYECTO
  SUBGERENTE
  OBSERVADOR
  CLIENTE_LECTOR // ⚠️ Reservado para el portal de cliente
}

enum TipoCliente        { INMOBILIARIA CONSTRUCTORA MANDANTE_PRIVADO ORGANISMO_PUBLICO OTRO }
enum EstadoProyecto     { PLANIFICACION ACTIVO SUSPENDIDO EN_CIERRE CERRADO }
enum Frecuencia         { INICIO_PROYECTO DIARIA SEMANAL QUINCENAL MENSUAL TRIMESTRAL SEGUN_REQUERIMIENTO POR_EVENTO PERMANENTE FINAL_PROYECTO }
enum Requisito          { REQUERIDO OPCIONAL NO_APLICA }
enum Cumple             { SI NO NA PENDIENTE }
enum SiNoNa             { SI NO NA }
enum EstadoCiclo        { ABIERTO EN_REVISION_JP EN_REVISION_SUBGERENCIA CERRADO }
enum ResultadoAprobacion{ APROBADO APROBADO_CON_OBSERVACIONES RECHAZADO }
enum TipoVencimiento    { BOLETA_GARANTIA POLIZA_SEGURO PERMISO CERTIFICADO OTRO }
enum EstadoVencimiento  { VIGENTE POR_VENCER VENCIDO RENOVADO LIBERADO }
enum TipoAlerta         { VENCIMIENTO_PROXIMO VENCIMIENTO_CUMPLIDO ITEM_ATRASADO CICLO_PENDIENTE CUMPLIMIENTO_BAJO DOCUMENTO_FALTANTE }
enum Severidad          { INFO MEDIA ALTA CRITICA }
enum EstadoAlerta       { ACTIVA VISTA RESUELTA DESCARTADA }
enum AccionAuditoria    { CREAR ACTUALIZAR ELIMINAR APROBAR RECHAZAR SUBIR_ARCHIVO ELIMINAR_ARCHIVO CERRAR_CICLO INICIAR_SESION }
enum Moneda             { CLP UF USD }
```

---

## 1. Configuración de empresa (marca)

Fila única. Es lo que hace que la app se sienta propia desde el primer proyecto que vendas y lo
que te permite renombrar la marca cuando la definas, sin tocar código.

```prisma
model ConfiguracionEmpresa {
  id                  String  @id @default("singleton")
  nombreEmpresa       String  @default("[Tu Empresa]")
  nombreCorto         String  @default("[TE]")
  razonSocial         String?
  rut                 String?
  giro                String?
  direccion           String?
  comuna              String?
  telefono            String?
  email               String?
  sitioWeb            String?

  // Marca visual
  logoUrl             String?
  logoOscuroUrl       String?
  faviconUrl          String?
  colorPrimario       String  @default("#1e3a5f")
  colorSecundario     String  @default("#2d6a9f")
  colorAcento         String  @default("#e08b2c")

  // Codificación propia de documentos (ver docs/05)
  prefijoDocumentos   String  @default("TE")           // ej. "ITO", "GPI"
  formatoCodigoRegistro String @default("{prefijo}-{categoria}-{correlativo}")

  // Reportes
  piePaginaReportes   String?
  mostrarLogoEnPdf    Boolean @default(true)

  // Parámetros de negocio
  diasAlertaVencimientoDefecto Int @default(30)
  umbralCumplimientoBajo       Int @default(70)  // % bajo el cual se alerta

  actualizadoAt       DateTime @updatedAt
  actualizadoPorId    String?
}
```

Los colores se inyectan como variables CSS en el layout raíz, de modo que toda la interfaz y
los PDF se re-marcan cambiando tres campos.

---

## 2. Usuarios, clientes y proyectos

```prisma
model Usuario {
  id            String    @id @default(cuid())
  email         String    @unique
  nombre        String
  apellido      String
  passwordHash  String?           // null si en el futuro entra por SSO
  telefono      String?
  cargo         String?           // texto libre para reportes: "Inspector Técnico de Obras"
  avatarUrl     String?
  rolGlobal     RolGlobal @default(ITO)
  activo        Boolean   @default(true)

  // 🔑 PREPARACIÓN PORTAL DE CLIENTE:
  // usuarios internos → null; usuarios del futuro rol CLIENTE → su empresa.
  clienteId     String?
  cliente       Cliente?  @relation(fields: [clienteId], references: [id])

  ultimoAccesoAt DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  asignaciones  AsignacionProyecto[]
  // ... relaciones inversas de auditoría, documentos, aprobaciones

  // Tablas del adaptador Auth.js, preinstaladas para habilitar SSO sin migrar después
  accounts      Account[]
  sessions      Session[]
}

model Cliente {
  id              String      @id @default(cuid())
  nombre          String                    // razón social
  nombreFantasia  String?
  rut             String?     @unique
  tipo            TipoCliente @default(INMOBILIARIA)
  contactoNombre  String?
  contactoCargo   String?
  contactoEmail   String?
  contactoTelefono String?
  direccion       String?
  comuna          String?
  region          String?
  logoUrl         String?                   // para reportes co-marcados
  notas           String?     @db.Text
  activo          Boolean     @default(true)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  proyectos       Proyecto[]
  usuarios        Usuario[]                 // 🔑 futuros usuarios del portal
}

model Proyecto {
  id                String         @id @default(cuid())
  codigo            String         @unique   // código interno / centro de costo
  nombre            String
  clienteId         String
  cliente           Cliente        @relation(fields: [clienteId], references: [id])

  // Constructora ejecutora, cuando es distinta del cliente
  constructoraNombre String?
  constructoraRut    String?

  centroCosto       String?
  direccion         String?
  comuna            String?
  region            String?
  tipoObra          String?                  // edificación en altura, casas, industrial...
  superficieM2      Decimal?       @db.Decimal(12, 2)
  numeroUnidades    Int?
  montoContrato     Decimal?       @db.Decimal(15, 2)
  moneda            Moneda         @default(CLP)

  fechaInicio           DateTime?
  fechaTerminoEstimada  DateTime?
  fechaTerminoReal      DateTime?
  estado                EstadoProyecto @default(PLANIFICACION)

  plantillaOrigenId String?                  // versión de plantilla desde la que se clonó
  portadaUrl        String?
  notas             String?        @db.Text

  // Cacheado, recalculado en cada mutación de ítem
  porcentajeCumplimiento    Decimal? @db.Decimal(5, 2)
  itemsAplicables           Int      @default(0)
  itemsCumplen              Int      @default(0)
  cumplimientoActualizadoAt DateTime?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  asignaciones AsignacionProyecto[]
  categorias   CategoriaProyecto[]
  ciclos       CicloRevision[]
  alertas      Alerta[]

  @@index([clienteId, estado])
}
```

### Asignaciones: la pieza clave del control de acceso

En vez de campos rígidos `itoId` / `jefeProyectoId` / `subgerenteId` en `Proyecto`, se usa una
tabla intermedia. Esto permite dos ITOs en una obra grande, cambiar el JP a mitad de proyecto
conservando el historial, y —sobre todo— **agregar el rol de cliente lector como una fila, no
como un cambio de esquema**.

```prisma
model AsignacionProyecto {
  id           String      @id @default(cuid())
  proyectoId   String
  proyecto     Proyecto    @relation(fields: [proyectoId], references: [id], onDelete: Cascade)
  usuarioId    String
  usuario      Usuario     @relation(fields: [usuarioId], references: [id])
  rol          RolProyecto
  activo       Boolean     @default(true)
  desde        DateTime    @default(now())
  hasta        DateTime?                     // historial: no se borra, se cierra
  asignadoPorId String?

  @@unique([proyectoId, usuarioId, rol])
  @@index([usuarioId, activo])
}
```

---

## 3. Plantilla maestra del checklist (versionada)

```prisma
model PlantillaChecklist {
  id          String   @id @default(cuid())
  nombre      String                          // "Metodología [Tu Empresa] — Edificación"
  version     Int      @default(1)
  descripcion String?  @db.Text
  esActiva    Boolean  @default(false)        // solo una activa a la vez
  publicadaAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  categorias  CategoriaPlantilla[]
}

model CategoriaPlantilla {
  id          String  @id @default(cuid())
  plantillaId String
  plantilla   PlantillaChecklist @relation(fields: [plantillaId], references: [id], onDelete: Cascade)
  codigo      String                          // "00", "05", "13"
  nombre      String
  descripcion String? @db.Text
  orden       Int
  peso        Int     @default(1)             // ponderación futura; MVP usa 1
  activa      Boolean @default(true)

  items       ItemPlantilla[]

  @@unique([plantillaId, codigo])
}

model ItemPlantilla {
  id            String      @id @default(cuid())
  categoriaId   String
  categoria     CategoriaPlantilla @relation(fields: [categoriaId], references: [id], onDelete: Cascade)

  codigo        String                        // "5.16" — correlativo dentro de la categoría
  descripcion   String
  codigoRegistro String?                      // esquema propio, libre, puede quedar vacío
  subgrupo      String?                       // ej. "Obra gruesa" dentro de Protocolos
  instrucciones String?     @db.Text          // cómo se usa este registro
  frecuencia    Frecuencia  @default(SEGUN_REQUERIMIENTO)
  responsableRol RolProyecto @default(ITO)
  revisorRol     RolProyecto @default(JEFE_PROYECTO)
  requiereRespaldoDigital Requisito @default(REQUERIDO)
  requiereRespaldoFisico  Requisito @default(NO_APLICA)
  controlaVencimiento     Boolean   @default(false)  // garantías, seguros, permisos
  aplicaPorDefecto        Boolean   @default(true)
  visibleParaCliente      Boolean   @default(true)   // 🔑 portal futuro
  formatoArchivoUrl       String?                    // formulario en blanco descargable
  orden         Int
  peso          Int         @default(1)
  activo        Boolean     @default(true)

  @@unique([categoriaId, codigo])
}
```

**Por qué versionar**: vas a refinar tu metodología durante el primer año. Sin versiones, editar
la plantilla alteraría proyectos ya en curso y rompería el historial de cumplimiento. Con
versiones: los proyectos abiertos conservan su copia clonada intacta, y los nuevos nacen con la
versión activa.

---

## 4. Checklist del proyecto (copia viva)

Al crear un proyecto se **clona** la plantilla activa completa. Desde ahí, el proyecto es
independiente: se pueden desactivar ítems, editar textos o agregar ítems ad-hoc sin afectar la
plantilla ni a otros proyectos.

```prisma
model CategoriaProyecto {
  id                   String   @id @default(cuid())
  proyectoId           String
  proyecto             Proyecto @relation(fields: [proyectoId], references: [id], onDelete: Cascade)
  categoriaPlantillaId String?             // trazabilidad al origen
  codigo               String
  nombre               String
  descripcion          String?  @db.Text
  orden                Int
  peso                 Int      @default(1)
  aplica               Boolean  @default(true)

  // cacheado
  porcentajeCumplimiento Decimal? @db.Decimal(5, 2)
  itemsAplicables        Int      @default(0)
  itemsCumplen           Int      @default(0)

  items ItemProyecto[]

  @@unique([proyectoId, codigo])
}

model ItemProyecto {
  id                  String   @id @default(cuid())
  categoriaProyectoId String
  categoriaProyecto   CategoriaProyecto @relation(fields: [categoriaProyectoId], references: [id], onDelete: Cascade)
  itemPlantillaId     String?             // null = ítem creado a medida para este proyecto

  // Definición (copiada de la plantilla, editable por proyecto)
  codigo         String
  descripcion    String
  codigoRegistro String?
  subgrupo       String?
  instrucciones  String?    @db.Text
  frecuencia     Frecuencia
  responsableRol RolProyecto
  revisorRol     RolProyecto
  requiereRespaldoDigital Requisito
  requiereRespaldoFisico  Requisito
  controlaVencimiento     Boolean @default(false)
  visibleParaCliente      Boolean @default(true)
  orden          Int
  peso           Int        @default(1)

  // Estado vivo (el "último valor conocido")
  aplica              Boolean @default(true)
  cumple              Cumple  @default(PENDIENTE)
  respaldoDigital     SiNoNa  @default(NA)
  respaldoFisico      SiNoNa  @default(NA)
  observaciones       String? @db.Text
  responsableUsuarioId String?            // sobrescribe el rol, si se asigna a alguien puntual

  // Control por frecuencia
  fechaUltimoControl  DateTime?
  fechaProximoControl DateTime?           // calculado desde frecuencia + último control

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  documentos   Documento[]
  vencimientos Vencimiento[]
  evaluaciones EvaluacionItem[]

  @@index([categoriaProyectoId, orden])
}
```

---

## 5. Documentos (respaldo digital versionado)

```prisma
model Documento {
  id             String   @id @default(cuid())
  itemProyectoId String?
  itemProyecto   ItemProyecto? @relation(fields: [itemProyectoId], references: [id])
  proyectoId     String              // desnormalizado para filtrar y para el control de acceso

  nombre         String              // nombre visible, editable
  nombreOriginal String
  claveAlmacenamiento String @unique // key en el bucket; nunca se expone al navegador
  mimeType       String
  tamanoBytes    Int
  version        Int      @default(1)
  esVersionActual Boolean @default(true)
  reemplazaAId   String?             // cadena de versiones
  descripcion    String?
  visibleParaCliente Boolean @default(true)   // 🔑 portal futuro

  subidoPorId    String
  subidoAt       DateTime @default(now())
  eliminadoAt    DateTime?           // borrado lógico: nunca se pierde un respaldo
  eliminadoPorId String?

  @@index([itemProyectoId, esVersionActual])
  @@index([proyectoId])
}
```

---

## 6. Vencimientos (garantías, seguros, permisos)

Mejora respecto de la planilla Excel: un mismo ítem (por ejemplo "Boletas de garantía") suele
tener **varias** boletas vigentes con fechas distintas. Una sola fecha en el ítem no alcanza.

```prisma
model Vencimiento {
  id             String  @id @default(cuid())
  itemProyectoId String
  itemProyecto   ItemProyecto @relation(fields: [itemProyectoId], references: [id], onDelete: Cascade)
  proyectoId     String

  tipo           TipoVencimiento
  identificador  String?           // N° de boleta / póliza / permiso
  entidadEmisora String?           // banco, compañía de seguros, DOM
  glosa          String?
  monto          Decimal? @db.Decimal(15, 2)
  moneda         Moneda   @default(CLP)
  fechaEmision   DateTime?
  fechaVencimiento DateTime
  diasAlertaPrevia Int    @default(30)
  estado         EstadoVencimiento @default(VIGENTE)
  documentoId    String?
  notas          String?  @db.Text

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([proyectoId, fechaVencimiento])
  @@index([estado, fechaVencimiento])
}
```

---

## 7. Ciclos de revisión (historial que se acumula, no se sobrescribe)

```prisma
model CicloRevision {
  id         String   @id @default(cuid())
  proyectoId String
  proyecto   Proyecto @relation(fields: [proyectoId], references: [id], onDelete: Cascade)
  numero     Int                    // correlativo por proyecto
  nombre     String                 // "Revisión N°3 — Agosto 2026"
  fechaProgramada DateTime?
  fechaRealizada  DateTime?
  estado     EstadoCiclo @default(ABIERTO)

  // Snapshot congelado al cerrar el ciclo
  porcentajeCumplimiento Decimal? @db.Decimal(5, 2)
  itemsAplicables        Int      @default(0)
  itemsCumplen           Int      @default(0)
  observacionesGenerales String?  @db.Text

  creadoPorId String
  createdAt   DateTime @default(now())
  cerradoAt   DateTime?

  evaluaciones EvaluacionItem[]
  aprobaciones AprobacionCiclo[]

  @@unique([proyectoId, numero])
}

// Snapshot inmutable del estado de un ítem en un ciclo. Es el "no se sobrescribe, se acumula".
model EvaluacionItem {
  id             String @id @default(cuid())
  cicloId        String
  ciclo          CicloRevision @relation(fields: [cicloId], references: [id], onDelete: Cascade)
  itemProyectoId String
  itemProyecto   ItemProyecto  @relation(fields: [itemProyectoId], references: [id], onDelete: Cascade)

  aplica          Boolean
  cumple          Cumple
  respaldoDigital SiNoNa
  respaldoFisico  SiNoNa
  observaciones   String? @db.Text

  evaluadoPorId String?
  evaluadoAt    DateTime?
  revisadoPorId String?
  revisadoAt    DateTime?

  @@unique([cicloId, itemProyectoId])
}

model AprobacionCiclo {
  id         String @id @default(cuid())
  cicloId    String
  ciclo      CicloRevision @relation(fields: [cicloId], references: [id], onDelete: Cascade)
  usuarioId  String
  rol        RolProyecto              // JEFE_PROYECTO o SUBGERENTE
  resultado  ResultadoAprobacion
  comentario String? @db.Text
  fecha      DateTime @default(now())

  @@index([cicloId])
}
```

**Cómo funciona en la práctica**: `ItemProyecto` guarda el estado actual (lo que el ITO edita
día a día). Al abrir un ciclo de revisión se congela un `EvaluacionItem` por ítem; el JP revisa
y aprueba, luego el Subgerente. Al cerrar el ciclo se guarda el porcentaje del momento. Los
ciclos anteriores quedan intactos y permiten mostrar la **evolución del cumplimiento en el
tiempo** — un gráfico muy vendible frente al cliente.

---

## 8. Auditoría y alertas

```prisma
model RegistroAuditoria {
  id          String  @id @default(cuid())
  entidad     String                 // "ItemProyecto", "Documento", ...
  entidadId   String
  accion      AccionAuditoria
  campo       String?
  valorAnterior Json?
  valorNuevo    Json?
  usuarioId   String?
  proyectoId  String?                // para filtrar el historial de un proyecto
  ip          String?
  userAgent   String?
  createdAt   DateTime @default(now())

  @@index([entidad, entidadId])
  @@index([proyectoId, createdAt])
}

model Alerta {
  id             String   @id @default(cuid())
  proyectoId     String
  proyecto       Proyecto @relation(fields: [proyectoId], references: [id], onDelete: Cascade)
  itemProyectoId String?
  vencimientoId  String?
  tipo           TipoAlerta
  severidad      Severidad @default(MEDIA)
  titulo         String
  mensaje        String    @db.Text
  fechaObjetivo  DateTime?
  estado         EstadoAlerta @default(ACTIVA)
  resueltaPorId  String?
  resueltaAt     DateTime?
  createdAt      DateTime @default(now())

  @@index([proyectoId, estado])
  @@index([estado, severidad, fechaObjetivo])
}
```

---

## Cálculo de cumplimiento

Función pura, sin dependencias de base de datos, en `src/dominio/cumplimiento.ts` — el primer
lugar donde se escriben pruebas automatizadas.

```
Denominador (itemsAplicables) = ítems con aplica = true  Y  cumple ≠ NA
Numerador   (itemsCumplen)    = ítems con aplica = true  Y  cumple = SI
% cumplimiento = itemsCumplen / itemsAplicables × 100     (0 si el denominador es 0)
```

Reglas explícitas a confirmar:

- `NA` **excluye** el ítem del cálculo (no penaliza ni premia) — igual que la planilla Excel.
- `PENDIENTE` **sí** cuenta en el denominador y no en el numerador: un ítem sin evaluar es
  incumplimiento hasta que se demuestre lo contrario.
- El porcentaje del **proyecto** se calcula sobre todos los ítems, no como promedio de
  categorías (así una categoría de 2 ítems no pesa lo mismo que una de 38).
- El campo `peso` existe en el esquema para ponderar categorías/ítems más adelante; en el MVP
  todos valen 1.
- Se recalcula en la misma transacción de cada mutación de ítem y se cachea en
  `CategoriaProyecto` y `Proyecto`.

---

## Permisos

Un único módulo `src/lib/permisos.ts` con la firma `puede(usuario, accion, recurso)`. Nunca se
consulta el rol directamente desde un componente.

| Acción | ADMIN | SUBGERENTE | JEFE_PROYECTO | ITO | CLIENTE *(futuro)* |
|---|---|---|---|---|---|
| Ver todos los proyectos | ✅ | Sus asignados | Sus asignados | Sus asignados | Solo los de su `clienteId` |
| Crear / editar cliente | ✅ | — | — | — | — |
| Crear proyecto | ✅ | ✅ | — | — | — |
| Editar ficha de proyecto | ✅ | ✅ | ✅ | — | — |
| Editar ítem del checklist | ✅ | ✅ | ✅ | ✅ | — |
| Subir / eliminar respaldo | ✅ | ✅ | ✅ | ✅ | — |
| Marcar cumplimiento | ✅ | ✅ | ✅ | ✅ | — |
| Aprobar ciclo (nivel JP) | ✅ | ✅ | ✅ | — | — |
| Aprobar ciclo (nivel superior) | ✅ | ✅ | — | — | — |
| Gestionar usuarios | ✅ | — | — | — | — |
| Gestionar plantilla maestra | ✅ | — | — | — | — |
| Configurar marca / alertas | ✅ | — | — | — | — |
| Exportar reporte | ✅ | ✅ | ✅ | ✅ | Solo su proyecto |

### Cómo queda preparado el portal de cliente

Cuatro decisiones tomadas ahora hacen que agregar el portal sea **incremental y no un
rediseño**:

1. **`Usuario.clienteId`** ya existe: un usuario externo queda ligado a su empresa.
2. **`AsignacionProyecto`** con `RolProyecto.CLIENTE_LECTOR` ya está en el enum: dar acceso es
   insertar una fila, no migrar el esquema.
3. **Banderas `visibleParaCliente`** en `ItemProyecto` y `Documento`: permiten ocultar
   observaciones internas o respaldos sensibles sin duplicar entidades.
4. **Todo acceso a datos pasa por un filtro obligatorio** (`src/server/datos/alcance.ts`) que
   deriva del usuario la lista de proyectos visibles. El portal no agrega una nueva ruta de
   acceso: reutiliza la misma, con un rol que solo lee.

Lo único que faltará construir en esa fase futura es la interfaz (un layout reducido de solo
lectura) y el flujo de invitación por correo. Cero cambios al modelo de datos.
