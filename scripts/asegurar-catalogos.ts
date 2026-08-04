/**
 * Garantiza que los catálogos configurables existan en el entorno.
 *
 * Corre en cada despliegue, después de aplicar las migraciones. Existe porque
 * los catálogos se crean en la configuración inicial, y una instalación que ya
 * pasó por ahí antes de la Fase 3 se quedaría con las tablas vacías: la guía de
 * planificación no tendría servicios que ofrecer.
 *
 * Es idempotente (usa `upsert` y no toca lo existente), así que repetirlo en
 * cada deploy es inofensivo. Y nunca hace fallar el despliegue: si no se puede
 * escribir, se avisa y la aplicación igual queda arriba.
 */

import { PrismaClient } from "@prisma/client";

import {
  crearCatalogosIniciales,
  crearResponsabilidadesIniciales,
} from "../src/server/servicios/catalogos-iniciales";

const prisma = new PrismaClient();

async function main() {
  // Una instalación nueva todavía no tiene usuarios: en ese caso los catálogos
  // los crea la pantalla de configuración inicial, y aquí no hay nada que hacer.
  const usuarios = await prisma.usuario.count();
  if (usuarios === 0) {
    console.log("→ Catálogos: instalación nueva, los crea la configuración inicial.");
    return;
  }

  await crearCatalogosIniciales(prisma);

  const plantilla = await prisma.plantillaChecklist.findFirst({
    where: { esActiva: true },
    select: { id: true },
  });
  if (plantilla) {
    await crearResponsabilidadesIniciales(prisma, plantilla.id);
  }

  const [especialidades, opciones] = await Promise.all([
    prisma.especialidad.count(),
    prisma.opcionCatalogo.count(),
  ]);
  console.log(`→ Catálogos listos: ${especialidades} especialidades, ${opciones} opciones.`);
}

main()
  .catch((error) => {
    console.warn("⚠ No se pudieron asegurar los catálogos:", error);
    console.warn("  El despliegue continúa; revísalos en Administración → Catálogos.");
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
