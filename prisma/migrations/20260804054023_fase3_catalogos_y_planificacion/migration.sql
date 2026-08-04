-- CreateEnum
CREATE TYPE "TipoCatalogo" AS ENUM ('TIPO_PROYECTO', 'ESTADO_DOCUMENTO', 'CAUSA_NO_CUMPLIMIENTO', 'TIPO_SERVICIO', 'CARGO_EQUIPO', 'RECURSO_TERRENO');

-- CreateEnum
CREATE TYPE "Dedicacion" AS ENUM ('TOTAL', 'PARCIAL', 'VISITAS');

-- AlterTable
ALTER TABLE "AsignacionProyecto" ADD COLUMN     "dedicacion" "Dedicacion";

-- AlterTable
ALTER TABLE "Proyecto" ADD COLUMN     "enfoqueServicio" TEXT;

-- CreateTable
CREATE TABLE "Especialidad" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Especialidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpcionCatalogo" (
    "id" TEXT NOT NULL,
    "tipo" "TipoCatalogo" NOT NULL,
    "codigo" TEXT NOT NULL,
    "etiqueta" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpcionCatalogo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicioContratado" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "opcionId" TEXT NOT NULL,
    "aplica" BOOLEAN NOT NULL DEFAULT false,
    "fechaInicio" TIMESTAMP(3),
    "fechaTermino" TIMESTAMP(3),
    "comentario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServicioContratado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponsabilidadPlantilla" (
    "id" TEXT NOT NULL,
    "plantillaId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "itemPlantillaId" TEXT,
    "orden" INTEGER NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResponsabilidadPlantilla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponsabilidadProyecto" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "responsabilidadPlantillaId" TEXT,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "aplica" BOOLEAN NOT NULL DEFAULT true,
    "responsableUsuarioId" TEXT,
    "itemProyectoId" TEXT,
    "requerimientoCliente" TEXT,
    "observaciones" TEXT,
    "orden" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResponsabilidadProyecto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Especialidad_codigo_key" ON "Especialidad"("codigo");

-- CreateIndex
CREATE INDEX "Especialidad_activa_orden_idx" ON "Especialidad"("activa", "orden");

-- CreateIndex
CREATE INDEX "OpcionCatalogo_tipo_activa_orden_idx" ON "OpcionCatalogo"("tipo", "activa", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "OpcionCatalogo_tipo_codigo_key" ON "OpcionCatalogo"("tipo", "codigo");

-- CreateIndex
CREATE INDEX "ServicioContratado_proyectoId_aplica_idx" ON "ServicioContratado"("proyectoId", "aplica");

-- CreateIndex
CREATE UNIQUE INDEX "ServicioContratado_proyectoId_opcionId_key" ON "ServicioContratado"("proyectoId", "opcionId");

-- CreateIndex
CREATE INDEX "ResponsabilidadPlantilla_plantillaId_orden_idx" ON "ResponsabilidadPlantilla"("plantillaId", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "ResponsabilidadPlantilla_plantillaId_codigo_key" ON "ResponsabilidadPlantilla"("plantillaId", "codigo");

-- CreateIndex
CREATE INDEX "ResponsabilidadProyecto_proyectoId_orden_idx" ON "ResponsabilidadProyecto"("proyectoId", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "ResponsabilidadProyecto_proyectoId_codigo_key" ON "ResponsabilidadProyecto"("proyectoId", "codigo");

-- AddForeignKey
ALTER TABLE "ServicioContratado" ADD CONSTRAINT "ServicioContratado_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicioContratado" ADD CONSTRAINT "ServicioContratado_opcionId_fkey" FOREIGN KEY ("opcionId") REFERENCES "OpcionCatalogo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsabilidadPlantilla" ADD CONSTRAINT "ResponsabilidadPlantilla_plantillaId_fkey" FOREIGN KEY ("plantillaId") REFERENCES "PlantillaChecklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsabilidadPlantilla" ADD CONSTRAINT "ResponsabilidadPlantilla_itemPlantillaId_fkey" FOREIGN KEY ("itemPlantillaId") REFERENCES "ItemPlantilla"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsabilidadProyecto" ADD CONSTRAINT "ResponsabilidadProyecto_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsabilidadProyecto" ADD CONSTRAINT "ResponsabilidadProyecto_responsableUsuarioId_fkey" FOREIGN KEY ("responsableUsuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResponsabilidadProyecto" ADD CONSTRAINT "ResponsabilidadProyecto_itemProyectoId_fkey" FOREIGN KEY ("itemProyectoId") REFERENCES "ItemProyecto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
