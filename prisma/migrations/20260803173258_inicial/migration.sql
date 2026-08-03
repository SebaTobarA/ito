-- CreateEnum
CREATE TYPE "RolGlobal" AS ENUM ('ADMIN', 'SUBGERENTE', 'JEFE_PROYECTO', 'ITO', 'CLIENTE');

-- CreateEnum
CREATE TYPE "RolProyecto" AS ENUM ('ITO', 'ITO_APOYO', 'JEFE_PROYECTO', 'SUBGERENTE', 'OBSERVADOR', 'CLIENTE_LECTOR');

-- CreateEnum
CREATE TYPE "TipoCliente" AS ENUM ('INMOBILIARIA', 'CONSTRUCTORA', 'MANDANTE_PRIVADO', 'ORGANISMO_PUBLICO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoProyecto" AS ENUM ('PLANIFICACION', 'ACTIVO', 'SUSPENDIDO', 'EN_CIERRE', 'CERRADO');

-- CreateEnum
CREATE TYPE "Frecuencia" AS ENUM ('INICIO_PROYECTO', 'DIARIA', 'SEMANAL', 'QUINCENAL', 'MENSUAL', 'TRIMESTRAL', 'SEGUN_REQUERIMIENTO', 'POR_EVENTO', 'PERMANENTE', 'FINAL_PROYECTO');

-- CreateEnum
CREATE TYPE "Requisito" AS ENUM ('REQUERIDO', 'OPCIONAL', 'NO_APLICA');

-- CreateEnum
CREATE TYPE "Cumple" AS ENUM ('SI', 'NO', 'NA', 'PENDIENTE');

-- CreateEnum
CREATE TYPE "SiNoNa" AS ENUM ('SI', 'NO', 'NA');

-- CreateEnum
CREATE TYPE "EstadoCiclo" AS ENUM ('ABIERTO', 'EN_REVISION_JP', 'EN_REVISION_SUBGERENCIA', 'CERRADO');

-- CreateEnum
CREATE TYPE "ResultadoAprobacion" AS ENUM ('APROBADO', 'APROBADO_CON_OBSERVACIONES', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "TipoVencimiento" AS ENUM ('BOLETA_GARANTIA', 'POLIZA_SEGURO', 'PERMISO', 'CERTIFICADO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoVencimiento" AS ENUM ('VIGENTE', 'POR_VENCER', 'VENCIDO', 'RENOVADO', 'LIBERADO');

-- CreateEnum
CREATE TYPE "TipoAlerta" AS ENUM ('VENCIMIENTO_PROXIMO', 'VENCIMIENTO_CUMPLIDO', 'ITEM_ATRASADO', 'CICLO_PENDIENTE', 'CUMPLIMIENTO_BAJO', 'DOCUMENTO_FALTANTE');

-- CreateEnum
CREATE TYPE "Severidad" AS ENUM ('INFO', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateEnum
CREATE TYPE "EstadoAlerta" AS ENUM ('ACTIVA', 'VISTA', 'RESUELTA', 'DESCARTADA');

-- CreateEnum
CREATE TYPE "AccionAuditoria" AS ENUM ('CREAR', 'ACTUALIZAR', 'ELIMINAR', 'APROBAR', 'RECHAZAR', 'SUBIR_ARCHIVO', 'ELIMINAR_ARCHIVO', 'CERRAR_CICLO', 'INICIAR_SESION');

-- CreateEnum
CREATE TYPE "Moneda" AS ENUM ('CLP', 'UF', 'USD');

-- CreateTable
CREATE TABLE "ConfiguracionEmpresa" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "nombreEmpresa" TEXT NOT NULL DEFAULT '[Tu Empresa]',
    "nombreCorto" TEXT NOT NULL DEFAULT '[TE]',
    "razonSocial" TEXT,
    "rut" TEXT,
    "giro" TEXT,
    "direccion" TEXT,
    "comuna" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "sitioWeb" TEXT,
    "logoUrl" TEXT,
    "logoOscuroUrl" TEXT,
    "faviconUrl" TEXT,
    "colorPrimario" TEXT NOT NULL DEFAULT '#1E3A5F',
    "colorSecundario" TEXT NOT NULL DEFAULT '#2D6A9F',
    "colorAcento" TEXT NOT NULL DEFAULT '#E08B2C',
    "prefijoDocumentos" TEXT NOT NULL DEFAULT 'TE',
    "formatoCodigoRegistro" TEXT NOT NULL DEFAULT '{prefijo}-{categoria}-{correlativo}',
    "piePaginaReportes" TEXT,
    "mostrarLogoEnPdf" BOOLEAN NOT NULL DEFAULT true,
    "diasAlertaVencimientoDefecto" INTEGER NOT NULL DEFAULT 30,
    "umbralCumplimientoBajo" INTEGER NOT NULL DEFAULT 70,
    "actualizadoAt" TIMESTAMP(3) NOT NULL,
    "actualizadoPorId" TEXT,

    CONSTRAINT "ConfiguracionEmpresa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "passwordHash" TEXT,
    "telefono" TEXT,
    "cargo" TEXT,
    "avatarUrl" TEXT,
    "rolGlobal" "RolGlobal" NOT NULL DEFAULT 'ITO',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "clienteId" TEXT,
    "ultimoAccesoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombreFantasia" TEXT,
    "rut" TEXT,
    "tipo" "TipoCliente" NOT NULL DEFAULT 'INMOBILIARIA',
    "contactoNombre" TEXT,
    "contactoCargo" TEXT,
    "contactoEmail" TEXT,
    "contactoTelefono" TEXT,
    "direccion" TEXT,
    "comuna" TEXT,
    "region" TEXT,
    "logoUrl" TEXT,
    "notas" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proyecto" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "constructoraNombre" TEXT,
    "constructoraRut" TEXT,
    "centroCosto" TEXT,
    "direccion" TEXT,
    "comuna" TEXT,
    "region" TEXT,
    "tipoObra" TEXT,
    "superficieM2" DECIMAL(12,2),
    "numeroUnidades" INTEGER,
    "montoContrato" DECIMAL(15,2),
    "moneda" "Moneda" NOT NULL DEFAULT 'CLP',
    "fechaInicio" TIMESTAMP(3),
    "fechaTerminoEstimada" TIMESTAMP(3),
    "fechaTerminoReal" TIMESTAMP(3),
    "estado" "EstadoProyecto" NOT NULL DEFAULT 'PLANIFICACION',
    "plantillaOrigenId" TEXT,
    "portadaUrl" TEXT,
    "notas" TEXT,
    "porcentajeCumplimiento" DECIMAL(5,2),
    "itemsAplicables" INTEGER NOT NULL DEFAULT 0,
    "itemsCumplen" INTEGER NOT NULL DEFAULT 0,
    "cumplimientoActualizadoAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proyecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AsignacionProyecto" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "rol" "RolProyecto" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "desde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hasta" TIMESTAMP(3),
    "asignadoPorId" TEXT,

    CONSTRAINT "AsignacionProyecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlantillaChecklist" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "descripcion" TEXT,
    "esActiva" BOOLEAN NOT NULL DEFAULT false,
    "publicadaAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlantillaChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoriaPlantilla" (
    "id" TEXT NOT NULL,
    "plantillaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL,
    "peso" INTEGER NOT NULL DEFAULT 1,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CategoriaPlantilla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemPlantilla" (
    "id" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "codigoRegistro" TEXT,
    "subgrupo" TEXT,
    "instrucciones" TEXT,
    "frecuencia" "Frecuencia" NOT NULL DEFAULT 'SEGUN_REQUERIMIENTO',
    "responsableRol" "RolProyecto" NOT NULL DEFAULT 'ITO',
    "revisorRol" "RolProyecto" NOT NULL DEFAULT 'JEFE_PROYECTO',
    "requiereRespaldoDigital" "Requisito" NOT NULL DEFAULT 'REQUERIDO',
    "requiereRespaldoFisico" "Requisito" NOT NULL DEFAULT 'NO_APLICA',
    "controlaVencimiento" BOOLEAN NOT NULL DEFAULT false,
    "aplicaPorDefecto" BOOLEAN NOT NULL DEFAULT true,
    "visibleParaCliente" BOOLEAN NOT NULL DEFAULT true,
    "formatoArchivoUrl" TEXT,
    "orden" INTEGER NOT NULL,
    "peso" INTEGER NOT NULL DEFAULT 1,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ItemPlantilla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoriaProyecto" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "categoriaPlantillaId" TEXT,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL,
    "peso" INTEGER NOT NULL DEFAULT 1,
    "aplica" BOOLEAN NOT NULL DEFAULT true,
    "porcentajeCumplimiento" DECIMAL(5,2),
    "itemsAplicables" INTEGER NOT NULL DEFAULT 0,
    "itemsCumplen" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CategoriaProyecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemProyecto" (
    "id" TEXT NOT NULL,
    "categoriaProyectoId" TEXT NOT NULL,
    "itemPlantillaId" TEXT,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "codigoRegistro" TEXT,
    "subgrupo" TEXT,
    "instrucciones" TEXT,
    "frecuencia" "Frecuencia" NOT NULL,
    "responsableRol" "RolProyecto" NOT NULL,
    "revisorRol" "RolProyecto" NOT NULL,
    "requiereRespaldoDigital" "Requisito" NOT NULL,
    "requiereRespaldoFisico" "Requisito" NOT NULL,
    "controlaVencimiento" BOOLEAN NOT NULL DEFAULT false,
    "visibleParaCliente" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL,
    "peso" INTEGER NOT NULL DEFAULT 1,
    "aplica" BOOLEAN NOT NULL DEFAULT true,
    "cumple" "Cumple" NOT NULL DEFAULT 'PENDIENTE',
    "respaldoDigital" "SiNoNa" NOT NULL DEFAULT 'NA',
    "respaldoFisico" "SiNoNa" NOT NULL DEFAULT 'NA',
    "observaciones" TEXT,
    "responsableUsuarioId" TEXT,
    "fechaUltimoControl" TIMESTAMP(3),
    "fechaProximoControl" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemProyecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "itemProyectoId" TEXT,
    "proyectoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombreOriginal" TEXT NOT NULL,
    "claveAlmacenamiento" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanoBytes" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "esVersionActual" BOOLEAN NOT NULL DEFAULT true,
    "reemplazaAId" TEXT,
    "descripcion" TEXT,
    "visibleParaCliente" BOOLEAN NOT NULL DEFAULT true,
    "subidoPorId" TEXT NOT NULL,
    "subidoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eliminadoAt" TIMESTAMP(3),
    "eliminadoPorId" TEXT,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vencimiento" (
    "id" TEXT NOT NULL,
    "itemProyectoId" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "tipo" "TipoVencimiento" NOT NULL,
    "identificador" TEXT,
    "entidadEmisora" TEXT,
    "glosa" TEXT,
    "monto" DECIMAL(15,2),
    "moneda" "Moneda" NOT NULL DEFAULT 'CLP',
    "fechaEmision" TIMESTAMP(3),
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "diasAlertaPrevia" INTEGER NOT NULL DEFAULT 30,
    "estado" "EstadoVencimiento" NOT NULL DEFAULT 'VIGENTE',
    "notas" TEXT,
    "documentoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vencimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CicloRevision" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "fechaProgramada" TIMESTAMP(3),
    "fechaRealizada" TIMESTAMP(3),
    "estado" "EstadoCiclo" NOT NULL DEFAULT 'ABIERTO',
    "porcentajeCumplimiento" DECIMAL(5,2),
    "itemsAplicables" INTEGER NOT NULL DEFAULT 0,
    "itemsCumplen" INTEGER NOT NULL DEFAULT 0,
    "observacionesGenerales" TEXT,
    "creadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cerradoAt" TIMESTAMP(3),

    CONSTRAINT "CicloRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluacionItem" (
    "id" TEXT NOT NULL,
    "cicloId" TEXT NOT NULL,
    "itemProyectoId" TEXT NOT NULL,
    "aplica" BOOLEAN NOT NULL,
    "cumple" "Cumple" NOT NULL,
    "respaldoDigital" "SiNoNa" NOT NULL,
    "respaldoFisico" "SiNoNa" NOT NULL,
    "observaciones" TEXT,
    "evaluadoPorId" TEXT,
    "evaluadoAt" TIMESTAMP(3),
    "revisadoPorId" TEXT,
    "revisadoAt" TIMESTAMP(3),

    CONSTRAINT "EvaluacionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AprobacionCiclo" (
    "id" TEXT NOT NULL,
    "cicloId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "rol" "RolProyecto" NOT NULL,
    "resultado" "ResultadoAprobacion" NOT NULL,
    "comentario" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AprobacionCiclo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroAuditoria" (
    "id" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "accion" "AccionAuditoria" NOT NULL,
    "campo" TEXT,
    "valorAnterior" JSONB,
    "valorNuevo" JSONB,
    "usuarioId" TEXT,
    "proyectoId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistroAuditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alerta" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "itemProyectoId" TEXT,
    "vencimientoId" TEXT,
    "tipo" "TipoAlerta" NOT NULL,
    "severidad" "Severidad" NOT NULL DEFAULT 'MEDIA',
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "fechaObjetivo" TIMESTAMP(3),
    "estado" "EstadoAlerta" NOT NULL DEFAULT 'ACTIVA',
    "resueltaPorId" TEXT,
    "resueltaAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alerta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE INDEX "Usuario_rolGlobal_activo_idx" ON "Usuario"("rolGlobal", "activo");

-- CreateIndex
CREATE INDEX "Usuario_clienteId_idx" ON "Usuario"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_rut_key" ON "Cliente"("rut");

-- CreateIndex
CREATE INDEX "Cliente_activo_idx" ON "Cliente"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "Proyecto_codigo_key" ON "Proyecto"("codigo");

-- CreateIndex
CREATE INDEX "Proyecto_clienteId_estado_idx" ON "Proyecto"("clienteId", "estado");

-- CreateIndex
CREATE INDEX "Proyecto_estado_idx" ON "Proyecto"("estado");

-- CreateIndex
CREATE INDEX "AsignacionProyecto_usuarioId_activo_idx" ON "AsignacionProyecto"("usuarioId", "activo");

-- CreateIndex
CREATE INDEX "AsignacionProyecto_proyectoId_activo_idx" ON "AsignacionProyecto"("proyectoId", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "AsignacionProyecto_proyectoId_usuarioId_rol_key" ON "AsignacionProyecto"("proyectoId", "usuarioId", "rol");

-- CreateIndex
CREATE INDEX "PlantillaChecklist_esActiva_idx" ON "PlantillaChecklist"("esActiva");

-- CreateIndex
CREATE INDEX "CategoriaPlantilla_plantillaId_orden_idx" ON "CategoriaPlantilla"("plantillaId", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaPlantilla_plantillaId_codigo_key" ON "CategoriaPlantilla"("plantillaId", "codigo");

-- CreateIndex
CREATE INDEX "ItemPlantilla_categoriaId_orden_idx" ON "ItemPlantilla"("categoriaId", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "ItemPlantilla_categoriaId_codigo_key" ON "ItemPlantilla"("categoriaId", "codigo");

-- CreateIndex
CREATE INDEX "CategoriaProyecto_proyectoId_orden_idx" ON "CategoriaProyecto"("proyectoId", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "CategoriaProyecto_proyectoId_codigo_key" ON "CategoriaProyecto"("proyectoId", "codigo");

-- CreateIndex
CREATE INDEX "ItemProyecto_categoriaProyectoId_orden_idx" ON "ItemProyecto"("categoriaProyectoId", "orden");

-- CreateIndex
CREATE INDEX "ItemProyecto_fechaProximoControl_idx" ON "ItemProyecto"("fechaProximoControl");

-- CreateIndex
CREATE UNIQUE INDEX "Documento_claveAlmacenamiento_key" ON "Documento"("claveAlmacenamiento");

-- CreateIndex
CREATE INDEX "Documento_itemProyectoId_esVersionActual_idx" ON "Documento"("itemProyectoId", "esVersionActual");

-- CreateIndex
CREATE INDEX "Documento_proyectoId_eliminadoAt_idx" ON "Documento"("proyectoId", "eliminadoAt");

-- CreateIndex
CREATE INDEX "Vencimiento_proyectoId_fechaVencimiento_idx" ON "Vencimiento"("proyectoId", "fechaVencimiento");

-- CreateIndex
CREATE INDEX "Vencimiento_estado_fechaVencimiento_idx" ON "Vencimiento"("estado", "fechaVencimiento");

-- CreateIndex
CREATE INDEX "CicloRevision_proyectoId_estado_idx" ON "CicloRevision"("proyectoId", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "CicloRevision_proyectoId_numero_key" ON "CicloRevision"("proyectoId", "numero");

-- CreateIndex
CREATE INDEX "EvaluacionItem_itemProyectoId_idx" ON "EvaluacionItem"("itemProyectoId");

-- CreateIndex
CREATE UNIQUE INDEX "EvaluacionItem_cicloId_itemProyectoId_key" ON "EvaluacionItem"("cicloId", "itemProyectoId");

-- CreateIndex
CREATE INDEX "AprobacionCiclo_cicloId_idx" ON "AprobacionCiclo"("cicloId");

-- CreateIndex
CREATE INDEX "RegistroAuditoria_entidad_entidadId_idx" ON "RegistroAuditoria"("entidad", "entidadId");

-- CreateIndex
CREATE INDEX "RegistroAuditoria_proyectoId_createdAt_idx" ON "RegistroAuditoria"("proyectoId", "createdAt");

-- CreateIndex
CREATE INDEX "RegistroAuditoria_usuarioId_createdAt_idx" ON "RegistroAuditoria"("usuarioId", "createdAt");

-- CreateIndex
CREATE INDEX "Alerta_proyectoId_estado_idx" ON "Alerta"("proyectoId", "estado");

-- CreateIndex
CREATE INDEX "Alerta_estado_severidad_fechaObjetivo_idx" ON "Alerta"("estado", "severidad", "fechaObjetivo");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proyecto" ADD CONSTRAINT "Proyecto_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proyecto" ADD CONSTRAINT "Proyecto_plantillaOrigenId_fkey" FOREIGN KEY ("plantillaOrigenId") REFERENCES "PlantillaChecklist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsignacionProyecto" ADD CONSTRAINT "AsignacionProyecto_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AsignacionProyecto" ADD CONSTRAINT "AsignacionProyecto_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoriaPlantilla" ADD CONSTRAINT "CategoriaPlantilla_plantillaId_fkey" FOREIGN KEY ("plantillaId") REFERENCES "PlantillaChecklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPlantilla" ADD CONSTRAINT "ItemPlantilla_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "CategoriaPlantilla"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoriaProyecto" ADD CONSTRAINT "CategoriaProyecto_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemProyecto" ADD CONSTRAINT "ItemProyecto_categoriaProyectoId_fkey" FOREIGN KEY ("categoriaProyectoId") REFERENCES "CategoriaProyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemProyecto" ADD CONSTRAINT "ItemProyecto_responsableUsuarioId_fkey" FOREIGN KEY ("responsableUsuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_itemProyectoId_fkey" FOREIGN KEY ("itemProyectoId") REFERENCES "ItemProyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_subidoPorId_fkey" FOREIGN KEY ("subidoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vencimiento" ADD CONSTRAINT "Vencimiento_itemProyectoId_fkey" FOREIGN KEY ("itemProyectoId") REFERENCES "ItemProyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vencimiento" ADD CONSTRAINT "Vencimiento_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vencimiento" ADD CONSTRAINT "Vencimiento_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "Documento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CicloRevision" ADD CONSTRAINT "CicloRevision_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CicloRevision" ADD CONSTRAINT "CicloRevision_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionItem" ADD CONSTRAINT "EvaluacionItem_cicloId_fkey" FOREIGN KEY ("cicloId") REFERENCES "CicloRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionItem" ADD CONSTRAINT "EvaluacionItem_itemProyectoId_fkey" FOREIGN KEY ("itemProyectoId") REFERENCES "ItemProyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionItem" ADD CONSTRAINT "EvaluacionItem_evaluadoPorId_fkey" FOREIGN KEY ("evaluadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionItem" ADD CONSTRAINT "EvaluacionItem_revisadoPorId_fkey" FOREIGN KEY ("revisadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AprobacionCiclo" ADD CONSTRAINT "AprobacionCiclo_cicloId_fkey" FOREIGN KEY ("cicloId") REFERENCES "CicloRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AprobacionCiclo" ADD CONSTRAINT "AprobacionCiclo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroAuditoria" ADD CONSTRAINT "RegistroAuditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alerta" ADD CONSTRAINT "Alerta_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alerta" ADD CONSTRAINT "Alerta_itemProyectoId_fkey" FOREIGN KEY ("itemProyectoId") REFERENCES "ItemProyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
