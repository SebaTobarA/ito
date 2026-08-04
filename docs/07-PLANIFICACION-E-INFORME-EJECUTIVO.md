# 07 — Guía de Planificación e Informe Ejecutivo Semanal

Diseño aprobado, **todavía sin implementar**: es la extensión del modelo de
[02-MODELO-DATOS](02-MODELO-DATOS.md) y del plan de [04-PLAN-FASES](04-PLAN-FASES.md) para
incorporar los dos documentos del flujo de trabajo real: la guía de planificación de inicio de
proyecto y el motor de informe ejecutivo semanal.

Como en el resto del diseño, la codificación, los catálogos y los nombres son **configurables**:
aquí no hay ningún nombre ni código heredado de terceros.

---

## Resumen de la decisión de diseño

Cuatro ideas ordenan todo lo demás. Si estas cuatro se aprueban, el resto es consecuencia.

**1. `PeriodoControl` es la columna vertebral.** En el Excel, la fecha de control aparece tres
veces sin relación entre sí: como columna nueva en la matriz de protocolos, como fila en la
curva de avance, y como pestaña de informe semanal. Son la misma cosa. Al unificarlas en una
entidad, «avanzar una semana» pasa a ser **crear una fila**, y desaparecen de golpe la macro de
insertar columnas, las referencias rotas y el desfase entre hojas.

**2. Lo calculado no se guarda, salvo que haya que poder reproducirlo.** El estado de una RDI o
los días de respuesta se derivan al leer. Pero el informe que se le manda al mandante debe poder
reimprimirse igual dentro de dos años, aunque los registros hayan seguido cambiando: por eso el
informe **congela un snapshot al emitirse**. Es el mismo patrón que ya usa `EvaluacionItem` con
los ciclos de revisión, así que no introduce un concepto nuevo.

**3. La guía de planificación es el interruptor de módulos.** Los servicios contratados y la
matriz de responsabilidades no son documentación decorativa: definen qué módulos se le muestran
al equipo en ese proyecto. Un proyecto de «solo inspección técnica» no debería mostrar el módulo
de estados de pago si ese servicio no está contratado.

**4. La UF es la unidad de cuenta; los pesos son una vista.** Los montos se guardan en UF y se
convierten al mostrar, con el valor del día que fije el contrato. Solo los pagos ya liquidados
congelan su equivalente en pesos, porque son un hecho ocurrido. Ver §1.4.

---

## 1. Piezas transversales nuevas

### 1.1 Período de control

```prisma
model PeriodoControl {
  id          String   @id @default(cuid())
  proyectoId  String
  proyecto    Proyecto @relation(fields: [proyectoId], references: [id], onDelete: Cascade)
  numero      Int                      // correlativo por proyecto
  fechaControl DateTime                // medianoche UTC (ver convención de fechas)
  esHito      Boolean  @default(false)
  cerradoAt   DateTime?

  seguimientos SeguimientoProtocolo[]
  puntoCurva   PuntoCurva?
  informe      InformeSemanal?

  @@unique([proyectoId, numero])
  @@unique([proyectoId, fechaControl])
}
```

Un período agrupa: el punto de la curva de esa semana, la columna de la matriz de protocolos y
el informe semanal. Cerrar el período congela el informe.

### 1.2 Especialidad

Merece tabla propia (no catálogo genérico) porque la referencian RDI, protocolos y todas las
agregaciones del informe.

```prisma
model Especialidad {
  id       String  @id @default(cuid())
  codigo   String  @unique          // "TOP", "MOV", "EST" — configurable
  nombre   String                   // "Topografía", "Movimiento de tierra"
  orden    Int
  activa   Boolean @default(true)
}
```

### 1.3 Catálogos simples

Para las listas planas que hoy viven en la hoja «Desplegables». Una sola tabla con
discriminador evita crear seis tablas casi idénticas, y son valores sin relaciones propias.

```prisma
enum TipoCatalogo {
  TIPO_PROYECTO
  ESTADO_DOCUMENTO           // En trámite / Entregado / Pendiente / Resuelto / No aplica
  CAUSA_NO_CUMPLIMIENTO
  TIPO_SERVICIO              // Gerenciamiento, ITO, Licitación, Asesoría…
  CARGO_EQUIPO               // Gerente de Proyecto, ITO Residente…
  DEDICACION                 // Parcial / Total / Visitas
  TIPO_MODIFICACION_OBRA     // Adicional / Extraordinaria / Disminución
  RECURSO_TERRENO
}

model OpcionCatalogo {
  id       String       @id @default(cuid())
  tipo     TipoCatalogo
  codigo   String
  etiqueta String
  orden    Int
  activa   Boolean      @default(true)

  @@unique([tipo, codigo])
}
```

> **Regla**: ningún `enum` de Prisma para valores que el usuario deba poder editar. Los `enum`
> quedan solo para estados que la lógica de negocio conoce por nombre (`EstadoRdi`,
> `EstadoProtocolo`), porque cambiarlos implicaría cambiar código de todas formas.

### 1.4 Moneda: la UF como unidad de cuenta

Los contratos se manejan en **UF**. Eso no es un detalle de formato: define dónde vive la verdad.

**Regla fundacional: el monto en UF es el dato autoritativo y nunca se recalcula.** Un contrato
de 45.000 UF sigue siendo 45.000 UF para siempre. El monto en pesos es una *proyección* a una
fecha, y se calcula al mostrar. Guardar pesos como dato principal significaría que el valor del
contrato cambia solo con el tiempo, que es exactamente el error que la UF existe para evitar.

```prisma
model ValorUf {
  fecha DateTime @id            // medianoche UTC
  valor Decimal  @db.Decimal(12, 4)
  fuente String                 // trazabilidad del origen
  obtenidoAt DateTime @default(now())
}
```

Se alimenta con un job diario —el mismo Vercel Cron ya previsto para las alertas— desde una
fuente pública. Reglas de resolución, en este orden:

1. Valor exacto de la fecha pedida.
2. Si no existe (fin de semana, festivo, caída de la fuente): **último valor conocido ≤ fecha**,
   y el resultado se marca como estimado.
3. Si no hay ningún valor anterior: se muestra el monto en UF sin convertir, nunca un cero ni un
   error silencioso.

Un valor estimado se marca visualmente en pantalla y en el PDF. Un informe que le llega al
mandante con cifras en pesos calculadas sobre un valor supuesto, sin decirlo, es un problema
serio; decirlo cuesta un asterisco.

#### Qué fecha de UF se usa

Esta es la parte que en la práctica genera discusiones con la constructora, y por eso es
**configurable por proyecto**, no una constante:

```prisma
enum PoliticaConversionUf {
  FECHA_ESTADO_PAGO      // UF del día de presentación del EP
  ULTIMO_DIA_MES         // UF del último día del mes del período
  FECHA_PAGO_EFECTIVO    // UF del día en que se paga
}
```

Los tres se usan en contratos reales de obra en Chile y la diferencia entre ellos no es menor
cuando hay inflación. El contrato manda; la aplicación solo tiene que respetarlo y dejar
registrado cuál se aplicó.

**Los montos ya liquidados se congelan.** Cuando un estado de pago se paga efectivamente, se
guardan los tres datos —monto en UF, valor de la UF aplicado y monto en pesos resultante— como
hecho histórico. Ese registro no se vuelve a calcular nunca, aunque después se corrija la tabla
de UF: refleja lo que realmente ocurrió en la cuenta corriente.

#### Parámetros financieros del proyecto

Tampoco se codifican en duro. Van en `Proyecto`, porque varían de contrato en contrato:

| Campo | Por qué es configurable |
|---|---|
| `monedaContrato` | UF por defecto; algunos contratos menores siguen en CLP |
| `politicaConversionUf` | Ver arriba |
| `porcentajeAnticipo` y su política de amortización | Suele amortizarse proporcionalmente en cada EP |
| `porcentajeRetencion` | Se libera contra recepción provisoria y definitiva, en dos tramos |
| `porcentajeIva` | 19 % hoy, pero es una tasa legal y las tasas cambian |
| `regimenIva` | Exento, afecto, o con crédito especial de empresas constructoras |
| `porcentajeGastosGenerales`, `porcentajeUtilidades` | Base del cálculo de las notas de cambio |

El `regimenIva` merece su propio campo y no un booleano: en Chile una obra puede ser afecta,
exenta, o acogerse al crédito especial para viviendas bajo cierto tope en UF. Son tres cálculos
distintos, y un `boolean tieneBeneficioTributario` obliga a migrar apenas aparezca el tercer
caso.

---

## 2. Guía de planificación → wizard de proyecto

```
Proyecto ──┬── ServicioContratado      (qué se contrató → qué módulos se activan)
           ├── AsignacionProyecto      (ya existe — se le agrega `iniciales` y `dedicacion`)
           ├── ResponsabilidadProyecto (matriz RACI, clonada de plantilla)
           ├── RecursoProyecto         (equipos en terreno)
           ├── Protocolo               (partidas con protocolo — ver §3.4)
           └── enfoqueServicio: String (texto libre en Proyecto)
```

### 2.1 Servicios contratados

```prisma
model ServicioContratado {
  id           String   @id @default(cuid())
  proyectoId   String
  proyecto     Proyecto @relation(fields: [proyectoId], references: [id], onDelete: Cascade)
  opcionId     String                  // OpcionCatalogo tipo TIPO_SERVICIO
  aplica       Boolean  @default(false)
  fechaInicio  DateTime?
  fechaTermino DateTime?
  comentario   String?  @db.Text

  @@unique([proyectoId, opcionId])
}
```

### 2.2 Matriz de responsabilidades

Mismo patrón que el checklist: **plantilla maestra versionada** + **copia independiente por
proyecto**. Es la regla 6 de `CLAUDE.md` y aplica igual aquí — editar la matriz maestra no debe
alterar proyectos en curso.

```prisma
model ResponsabilidadPlantilla {
  id                String  @id @default(cuid())
  plantillaId       String                 // reutiliza PlantillaChecklist (misma versión)
  codigo            String
  descripcion       String                 // "Liderar reuniones de obra"
  itemPlantillaId   String?                // registro del sistema de calidad asociado
  orden             Int
  activa            Boolean @default(true)

  @@unique([plantillaId, codigo])
}

model ResponsabilidadProyecto {
  id                   String   @id @default(cuid())
  proyectoId           String
  proyecto             Proyecto @relation(fields: [proyectoId], references: [id], onDelete: Cascade)
  responsabilidadPlantillaId String?
  codigo               String
  descripcion          String
  aplica               Boolean  @default(true)
  responsableUsuarioId String?             // las "iniciales" salen del usuario, no se tipean
  itemProyectoId       String?             // ← enlaza la responsabilidad con su registro
  requerimientoCliente String?  @db.Text   // lo que pide el cliente en vez del estándar
  observaciones        String?  @db.Text

  @@unique([proyectoId, codigo])
}
```

El campo `itemProyectoId` es la costura entre este módulo y el checklist ya implementado: cada
responsabilidad apunta al registro que la evidencia. Permite responder «¿quién es responsable de
este ítem del checklist?» sin duplicar datos.

### 2.3 Piezas menores

`RecursoProyecto` (recurso, cantidad, disponible, observación) y `EntregaAcceso` (usuarioId,
fecha, versión) son tablas planas sin lógica. `EncuestaSatisfaccion` y `CertificadoCalidad`
—punto 9 de la guía— los propongo **fuera del MVP** (ver §9).

---

## 3. Registros operativos (Capa 1)

### 3.1 Notas de cambio

Los tres bloques de montos (solicitado por la constructora / validado por la ITO / aprobado por
el mandante) **no** se modelan como 12 columnas paralelas, sino como filas de una tabla hija.
Así se agrega un cuarto origen sin migrar el esquema, y las agregaciones del informe son un
`groupBy` en vez de doce sumas distintas.

```prisma
enum OrigenMonto      { SOLICITADO VALIDADO APROBADO }
enum EstadoNotaCambio { PENDIENTE APROBADA RECHAZADA ANULADA }

model NotaCambio {
  id             String   @id @default(cuid())
  proyectoId     String
  numero         Int
  solicitanteId  String?
  areaResponsable String?
  tipoModificacionId String              // OpcionCatalogo TIPO_MODIFICACION_OBRA
  descripcion    String   @db.Text
  fechaSolicitud DateTime
  fechaValidacion DateTime?
  fechaRespuesta DateTime?
  estado         EstadoNotaCambio @default(PENDIENTE)
  documentoId    String?

  montos MontoNotaCambio[]

  @@unique([proyectoId, numero])
}

model MontoNotaCambio {
  id            String     @id @default(cuid())
  notaCambioId  String
  origen        OrigenMonto
  diasPlazo     Int        @default(0)
  montoNeto     Decimal    @db.Decimal(15, 2)
  gastosGenerales Decimal  @db.Decimal(15, 2) @default(0)
  utilidades    Decimal    @db.Decimal(15, 2) @default(0)

  @@unique([notaCambioId, origen])
}
```

### 3.2 RDI

```prisma
model Rdi {
  id              String   @id @default(cuid())
  proyectoId      String
  numero          Int
  fechaSolicitud  DateTime
  solicitanteId   String?
  planoReferencia String?
  especialidadId  String?
  elementoOArea   String?
  descripcion     String   @db.Text
  fechaRespuestaEspecialista DateTime?
  responsableRespuesta       String?
  fechaValidacionIto         DateTime?
  documentoId     String?

  @@unique([proyectoId, numero])
  @@index([proyectoId, fechaSolicitud])
}
```

`estado` y `diasRespuesta` **no son columnas**: se derivan (ver §7).

### 3.3 Estados de pago

```prisma
model EstadoPago {
  id             String   @id @default(cuid())
  proyectoId     String
  numero         Int
  nombre         String
  fecha          DateTime
  moneda         Moneda   @default(CLP)
  cantidadObra   Decimal? @db.Decimal(15, 2)
  avanceFisico   Decimal? @db.Decimal(5, 2)   // % a la fecha
  montoPeriodo   Decimal  @db.Decimal(15, 2)
  documentoId    String?

  @@unique([proyectoId, numero])
}
```

### 3.4 Protocolos: catálogo + matriz + agregado

Aquí se unifican dos cosas que en los documentos originales aparecen separadas: el punto 6 de la
guía de planificación (qué partidas llevan protocolo, con qué frecuencia y con qué equipo) y el
catálogo de protocolos del informe semanal. **Es la misma entidad en dos momentos distintos**:
se define al planificar y se controla durante la obra.

```prisma
enum EstadoProtocoloPeriodo { ABIERTO CERRADO INACTIVO NO_APLICA }
enum OrigenProtocolo        { PROPIO CONSTRUCTORA }

model Protocolo {
  id              String   @id @default(cuid())
  proyectoId      String
  codigo          String
  nombre          String                     // partida: Hormigón, Enfierradura…
  especialidadId  String
  origen          OrigenProtocolo @default(PROPIO)
  frecuenciaControl String?
  equipoControl   String?
  certificadoCalibracionVigente Boolean @default(false)
  fechaVencimientoCalibracion   DateTime?
  supervisorConstructora String?
  supervisorSubcontrato  String?
  activo          Boolean  @default(true)

  seguimientos SeguimientoProtocolo[]

  @@unique([proyectoId, codigo])
}

model SeguimientoProtocolo {
  id          String @id @default(cuid())
  protocoloId String
  periodoId   String
  estado      EstadoProtocoloPeriodo @default(NO_APLICA)
  observacion String?

  @@unique([protocoloId, periodoId])
}
```

La hoja «Estado de Protocolos» (conteos, % avance, % cierre por especialidad) **no es una tabla**:
es una agregación sobre `SeguimientoProtocolo`. Se calcula al vuelo.

### 3.5 Procedimientos, correspondencia, libro de obra, seguridad

Tablas planas, sin lógica más allá de un par de campos derivados:

| Entidad | Campos propios | Derivado |
|---|---|---|
| `ProcedimientoInterno` | código, nombre, versión, fechaEntrega, estadoId, entregadoACliente | — |
| `Correspondencia` | número, código, destinatario, descripción, fechaEntrega, tipo, fechaRespuesta, medioRespuesta | `estado`, `tiempoRespuesta` |
| `AnotacionLibroObra` | libro, folio, fecha, especialidadId, redactaPor, recibePor, observación | — |
| `EventoSeguridad` | número, tipo (INCIDENTE/ACCIDENTE), fecha, hora, lugar, descripción, informadoPor, trabajador, lesiones, díasPerdidos, empresa, accionesCorrectivas | — |

---

## 4. Curva de avance y control de plazo

### 4.1 Punto de curva

```prisma
model PuntoCurva {
  id                    String   @id @default(cuid())
  proyectoId            String
  periodoId             String   @unique
  avanceParcialProgramado   Decimal @db.Decimal(6, 3)
  avanceParcialReal         Decimal? @db.Decimal(6, 3)
  // Solo si el proyecto maneja holgura formal (ver §9)
  avanceParcialProgramadoTardio Decimal? @db.Decimal(6, 3)
}
```

Acumulados, atraso, velocidad relativa y avance esperado **no se guardan**: son una función pura
sobre la serie ordenada de puntos (`src/dominio/curva.ts`). El avance esperado es recursivo —el
de esta semana depende del de la anterior—, así que se calcula recorriendo la serie completa, no
punto a punto.

### 4.2 Partidas y avance por partida

```prisma
model PartidaProyecto {
  id            String   @id @default(cuid())
  proyectoId    String
  codigo        String
  nombre        String
  especialidadId String?
  fechaInicioProgramada DateTime?
  fechaTerminoProgramada DateTime?
  incidencia    Decimal? @db.Decimal(6, 3)   // peso en el total

  avances AvancePartida[]

  @@unique([proyectoId, codigo])
}

model AvancePartida {
  id         String @id @default(cuid())
  partidaId  String
  periodoId  String
  avanceProgramado Decimal @db.Decimal(6, 3)
  avanceReal       Decimal? @db.Decimal(6, 3)

  @@unique([partidaId, periodoId])
}
```

«Qué partidas están en ejecución en la fecha de control» es una consulta por rango de fechas
programadas, no un campo.

### 4.3 Hitos, aumentos de plazo y no cumplimientos

```prisma
model Hito {
  id                String   @id @default(cuid())
  proyectoId        String
  nombre            String
  esFinal           Boolean  @default(false)
  fechaProgramada   DateTime
  fechaReal         DateTime?
  multaDiariaAplicable Decimal? @db.Decimal(15, 2)
  topeMulta         Decimal? @db.Decimal(15, 2)
  moneda            Moneda   @default(CLP)
}

model AumentoPlazo {
  id                String   @id @default(cuid())
  proyectoId        String
  fechaPresentacion DateTime
  fechaAprobacion   DateTime?
  diasOtorgados     Int?
  estado            EstadoNotaCambio @default(PENDIENTE)
  motivo            String   @db.Text
}

model NoCumplimiento {
  id          String   @id @default(cuid())
  proyectoId  String
  periodoId   String?
  causaId     String                  // OpcionCatalogo CAUSA_NO_CUMPLIMIENTO
  motivo      String   @db.Text
  prioridad   Severidad @default(MEDIA)
  acciones    String?  @db.Text
  resueltoAt  DateTime?
}
```

`diasAtraso`, `variacionFin` y `multaAcumulada` se derivan. La multa es
`min(diasAtraso × multaDiariaAplicable, topeMulta)`.

---

## 5. Consolidado semanal (Capa 2)

```prisma
enum EstadoInforme { BORRADOR EMITIDO }

model InformeSemanal {
  id          String   @id @default(cuid())
  proyectoId  String
  periodoId   String   @unique
  estado      EstadoInforme @default(BORRADOR)

  // ── Captura manual ──
  resumenSemana        String? @db.Text
  proyectistas         String? @db.Text
  personalConstructora String? @db.Text
  especialistasEnObra  String? @db.Text

  // ── Snapshot congelado al emitir (null mientras es BORRADOR) ──
  datos       Json?
  emitidoPorId String?
  emitidoAt   DateTime?

  observaciones ObservacionDiaria[]
  dotaciones    DotacionDiaria[]
  capacitaciones Capacitacion[]
}

model ObservacionDiaria {
  id        String   @id @default(cuid())
  informeId String
  fecha     DateTime
  texto     String   @db.Text
  @@unique([informeId, fecha])
}

model DotacionDiaria {
  id        String   @id @default(cuid())
  informeId String
  fecha     DateTime
  empresa   String                    // constructora o subcontrato
  cantidad  Int
  @@unique([informeId, fecha, empresa])
}
```

### Por qué el snapshot es `Json` y no columnas

El informe emitido tiene ~80 cifras agregadas. Modelarlas como columnas significa una migración
cada vez que se agregue un indicador, y todas quedarían `null` en los informes viejos. Como el
snapshot **solo se lee para reimprimir** —nunca se filtra ni se agrega por SQL—, `Json` es el
tipo correcto. Los pocos indicadores sobre los que sí se querrá graficar evolución
(`avanceReal`, `avanceProgramado`, `montoCobrado`) se guardan **además** como columnas
tipadas, exactamente como `CicloRevision` ya cachea su `porcentajeCumplimiento`.

---

## 6. Resumen ejecutivo (Capa 3)

**No es una entidad.** Es una vista de solo lectura sobre `InformeSemanal`:

- Si el informe está `EMITIDO` → se renderiza desde `datos` (el snapshot). Reproducible para
  siempre.
- Si está `BORRADOR` → se calcula en vivo, con un aviso visual de «previsualización».

De ahí salen el PDF y el Excel de Fase 5, y es la vista que el portal de cliente expondrá tal
cual —filtrando por `visibleParaCliente`— sin construir nada nuevo.

---

## 7. Campos manuales vs. calculados

Esta es la tabla que evita que el formulario semanal le pida al usuario lo que ya sabe. Cuatro
categorías:

- **M** — manual: lo escribe una persona.
- **D** — derivado en vivo: se calcula al leer, nunca se guarda.
- **C** — cacheado: se guarda para rendimiento, se recalcula en cada mutación.
- **S** — snapshot: se congela al emitir el informe.

| Dato | Tipo | Regla |
|---|---|---|
| Datos generales del proyecto en el informe | **D** | Se leen de `Proyecto` y `Cliente` |
| Días transcurridos / restantes | **D** | `fechaControl − fechaInicio`, con `hoyEnChile()` |
| Plazo actualizado | **D** | plazo contractual + Σ `AumentoPlazo.diasOtorgados` aprobados |
| Avance programado y real a la fecha | **D** | Lookup en la serie de `PuntoCurva` |
| Avance acumulado | **D** | Suma corrida de los parciales |
| Atraso | **D** | `max(0, programado − real)` |
| Velocidad relativa requerida | **D** | `(100 − acumuladoReal) / semanasRestantes` |
| Velocidad relativa promedio real | **D** | `acumuladoReal / semanasTranscurridas` |
| Avance esperado | **D** | Recursivo sobre la serie completa |
| Fecha de término proyectada | **D** | Del avance esperado |
| Estado de RDI (Liberada / Pendiente) | **D** | `fechaRespuestaEspecialista != null` |
| Días de respuesta de RDI | **D** | Con respuesta: `respuesta − solicitud`. Sin ella: `fechaControl − solicitud` |
| RDI de la semana / acumuladas / promedio días | **D** | Agregación filtrada por ventana |
| Estado de correspondencia y tiempo de respuesta | **D** | Misma regla que RDI |
| Conteos y % de avance/cierre de protocolos | **D** | Agregación sobre `SeguimientoProtocolo` |
| Montos de notas de cambio por origen | **D** | `groupBy` sobre `MontoNotaCambio`, filtrado por estado y ventana |
| % de aprobación de notas de cambio | **D** | `aprobado / solicitado` |
| Subtotales, IVA, total de contrato | **D** | Función pura sobre los parámetros del proyecto |
| Devolución de anticipo, retenciones, líquido | **D** | Función pura |
| Multa por atraso | **D** | `min(díasAtraso × multaDiaria, tope)` |
| Equivalente en pesos de cualquier monto en UF | **D** | `montoUf × ValorUf(fecha según política)` |
| Valor de la UF del día | **C** | Lo trae el job diario; nunca se teclea |
| Monto en pesos de un pago ya liquidado | **S** | Se congela con el valor de UF aplicado |
| Incidentes/accidentes de la semana y acumulados | **D** | Agregación sobre `EventoSeguridad` |
| Promedio semanal de dotación | **D** | Media de `DotacionDiaria` |
| % de cumplimiento del checklist | **C** | Ya implementado |
| Avance real **del proyecto** | **D** | Σ(incidencia × avance de cada partida) — ver §10.6 |
| Avance real **de cada partida** | **M** | Lo mide el ITO en terreno |
| Avance programado y partidas | **M** | Viene del programa de obra |
| Estado de cada protocolo por período | **M** | Criterio del inspector |
| Notas de cambio, RDI, cartas, libro, seguridad | **M** | Registro operativo |
| Observaciones diarias, dotación, capacitaciones | **M** | Captura de la semana |
| Hitos, aumentos de plazo, no cumplimientos | **M** | Con sus fechas y motivos |
| Todo el bloque agregado del informe emitido | **S** | Congelado al emitir |

> **La consecuencia práctica**: de las ~80 cifras del resumen ejecutivo, el ITO escribe
> aproximadamente **12**. El resto se calcula. Esa proporción es la justificación entera de
> reemplazar el Excel.

---

## 8. Plan de fases ajustado

Sí, hace falta reordenar, y por una dependencia dura: **el consolidado semanal es una agregación
de los registros operativos, así que no puede ir antes que ellos.** Además hay una razón
comercial: el informe semanal es lo que se le entrega al mandante todas las semanas, mientras que
los ciclos de revisión son control interno. Por eso propongo **postergar los ciclos de revisión**
y adelantar el motor de reporting.

| Fase | Antes | Ahora | Motivo del cambio |
|---|---|---|---|
| 1 | Fundacional | **Fundacional** ✅ completa | — |
| 2 | Checklist operativo | **Checklist operativo** | Sin cambios |
| 3 | Ciclos de revisión | **Catálogos + wizard de planificación** | Barato, y define qué módulos se activan: bloquea a todo lo demás |
| 4 | Dashboard y alertas | **Registros operativos + UF** | RDI, notas de cambio, protocolos, cartas, libro, seguridad. Incluye la tabla `ValorUf` y su job diario: los estados de pago ya manejan dinero, así que la conversión tiene que existir aquí y no en la fase financiera |
| 5 | Reportes | **Curva de avance y control de plazo** | Partidas, hitos, multas. Es la pieza más vendible y la de dominio más denso |
| 6 | — | **Consolidado semanal + resumen ejecutivo** | Depende de las fases 4 y 5 |
| 7 | — | **Exportación PDF/Excel + dashboard + alertas** | Las alertas se enriquecen con RDI vencidas, protocolos abiertos e hitos atrasados |
| 8 | — | **Ciclos de revisión y auditoría** | Se posterga: es control interno, no entregable al cliente |

Las fases 3 y 5 son las de mayor densidad de lógica pura y, por lo tanto, donde más rinden las
pruebas de Vitest: `curva.ts`, `financiero.ts` y `plazo.ts` se prueban sin base de datos.

---

## 9. Qué simplificaría para el MVP

Recomendaciones concretas, con su porqué. Todas dejan el campo en el esquema para no migrar
después.

**Sí simplificaría:**

1. **Curva temprana/tardía → una sola curva programada.** Preguntaste puntualmente por esto: la
   distinción solo sirve si administras holgura formalmente y negocias plazos contra la curva
   tardía. Si no, son dos series que hay que mantener para que una nunca se mire. Dejo el campo
   `avanceParcialProgramadoTardio` nullable desde el día uno: activarlo después es llenar datos,
   no migrar.
2. **Encuesta de satisfacción y certificado de calidad de obra.** Ocurren una vez, al cierre, y
   hoy se resuelven con un documento adjunto. Bastan dos ítems del checklist en la categoría de
   cierre. Construir dos módulos completos para un evento único por proyecto no se paga.
3. **Recursos a utilizar y entrega de accesos.** Son listas de verificación de inicio. Van como
   ítems del checklist, no como módulos.
4. **Multas.** Guardar los parámetros y calcular el monto sí; el flujo de aplicación,
   descuento y disputa de la multa, no. Eso es negociación contractual, no seguimiento.
5. **Fotografías.** Reutilizar `Documento` con una bandera `esFotografiaAvance`, en vez de una
   galería propia. La galería puede venir después sin tocar el modelo.

**No simplificaría, aunque parezca tentador:**

6. **Los tres bloques de montos de las notas de cambio.** Es justamente donde se ve el trabajo de
   la ITO: la brecha entre lo que pide la constructora, lo que valida el inspector y lo que
   aprueba el mandante es un argumento de venta directo. Reducirlo a un monto único destruye el
   indicador más demostrable que tienes.
7. **El avance esperado recursivo.** Parece complejo pero son ~15 líneas de función pura y es lo
   que permite proyectar la fecha de término. Es el número que un gerente mira primero.
8. **La matriz de protocolos.** Es el corazón del control de calidad constructivo y ya está
   alineada con la categoría 05 del checklist maestro.

---

## 10. Decisiones tomadas

Resueltas a criterio técnico. Cada una queda anotada con su fundamento para poder revisarla más
adelante sabiendo qué se estaba optimizando.

### 10.1 Moneda: UF autoritativa

Definido en §1.4. El monto en UF es el dato; los pesos son una proyección a una fecha, salvo en
pagos ya liquidados, que se congelan con el valor de UF aplicado.

### 10.2 Lookup de la curva: escalonado, sin interpolar

Se toma el **último punto con fecha ≤ la fecha de control**. Interpolar inventaría un avance que
nadie midió, y el avance de obra no es lineal entre mediciones: una semana de hormigonado y una
de curado no avanzan igual aunque estén contiguas. Además, como `PeriodoControl` ancla tanto la
curva como el informe, en el uso normal la fecha coincide exactamente y el lookup es exacto.

### 10.3 Periodicidad: configurable por proyecto, cálculos normalizados por día

`Proyecto.periodicidadControl` (semanal / quincenal / mensual). **Todas las velocidades se
calculan en % por día y se presentan multiplicadas por la duración del período.** Nunca se asume
que un período dura 7 días.

Esto no es purismo: las obras paran. Vacaciones de la construcción, temporales, paralizaciones
por accidente. En cuanto un período dura 10 días en vez de 7, dividir por «una semana» produce
una velocidad falsa y una fecha de término proyectada equivocada, que es justamente el número que
el gerente del mandante mira primero.

### 10.4 Ventana de agregación: de período a período

«La semana» va desde la `fechaControl` del período anterior (exclusiva) hasta la del período
actual (inclusiva). **No** son «los últimos 7 días».

La propiedad que importa: con período a período, cada registro se cuenta **exactamente una vez**
a lo largo de todo el proyecto. Con ventana fija de 7 días, un período de 10 días pierde 3 días
de RDI y de notas de cambio en silencio, y la suma de las semanas deja de cuadrar con el
acumulado. Un descuadre así, detectado por el cliente en una reunión, cuesta más que toda la
prolijidad de haberlo evitado.

### 10.5 Informe emitido: inmutable, se corrige con versión nueva

`InformeSemanal` lleva `version` y `esVersionActual`. Un informe emitido no se reabre ni se
edita. Corregir es emitir la versión 2, que queda enlazada a la anterior.

Es coherente con la regla 5 de `CLAUDE.md` y con el mismo patrón de `Documento`. La razón de
fondo: el informe ya salió por correo. Si el archivo del sistema puede cambiar después, el
sistema deja de ser la fuente de verdad de lo que se comunicó, y en una discusión contractual eso
es precisamente lo que se necesita poder demostrar.

### 10.6 Avance real: derivado de partidas, no tecleado dos veces

Decisión adicional, no estaba en la lista pero es del mismo orden. El avance real del proyecto se
**calcula** como Σ(`incidencia` × `avanceReal`) sobre las partidas del período. No se captura
aparte.

En el Excel actual el avance global y el avance por partida se escriben por separado, así que
pueden contradecirse —y con el tiempo se contradicen—. Una sola fuente elimina esa clase entera
de error. Se admite captura manual del avance global **solo** si el proyecto no tiene partidas
cargadas, para obras chicas donde desglosarlas no se justifica.

La condición para que esto funcione: las incidencias deben sumar 100 %. La aplicación lo valida y
lo advierte, sin bloquear la carga —durante el armado del presupuesto es normal estar a medias—.

---

## Resumen del impacto

| | Antes | Después |
|---|---|---|
| Modelos | 23 | ~50 |
| Enums de código | 17 | ~25 (el resto son catálogos editables) |
| Módulos de dominio puro | 4 | 8 (`+curva`, `+financiero`, `+plazo`, `+uf`) |
| Fases | 5 | 8 |
| Cifras del informe que se tipean | ~80 | ~12 |
