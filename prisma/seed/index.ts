/**
 * Carga inicial de la base de datos.
 *
 * Es idempotente: se puede ejecutar varias veces sin duplicar datos.
 *   npm run db:seed
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import { PLANTILLA_MAESTRA_V1, TOTAL_ITEMS_PLANTILLA_V1 } from "./plantilla-maestra";
import { generarCodigoRegistro } from "../../src/dominio/codificacion";

const prisma = new PrismaClient();

const EMAIL_ADMIN = process.env.SEED_ADMIN_EMAIL ?? "admin@tuempresa.cl";
const PASSWORD_ADMIN = process.env.SEED_ADMIN_PASSWORD ?? "Admin.2026";

async function main() {
  console.log("→ Configuración de empresa…");
  const configuracion = await prisma.configuracionEmpresa.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
  console.log(`  Empresa: ${configuracion.nombreEmpresa} (prefijo ${configuracion.prefijoDocumentos})`);

  console.log("→ Usuario administrador…");
  const passwordHash = await bcrypt.hash(PASSWORD_ADMIN, 10);
  const admin = await prisma.usuario.upsert({
    where: { email: EMAIL_ADMIN },
    update: { rolGlobal: "ADMIN", activo: true },
    create: {
      email: EMAIL_ADMIN,
      nombre: "Administrador",
      apellido: "General",
      cargo: "Inspector Técnico de Obras",
      rolGlobal: "ADMIN",
      passwordHash,
    },
  });
  console.log(`  ${admin.email}`);

  console.log("→ Plantilla maestra del checklist…");
  const yaExiste = await prisma.plantillaChecklist.findFirst({ where: { version: 1 } });

  if (yaExiste) {
    console.log("  La plantilla v1 ya existe; no se vuelve a crear.");
  } else {
    const plantilla = await prisma.plantillaChecklist.create({
      data: {
        nombre: `Metodología ${configuracion.nombreEmpresa} — Edificación`,
        version: 1,
        descripcion:
          "Plantilla base de control de calidad para proyectos de edificación. Editable desde Administración → Plantillas.",
        esActiva: true,
        publicadaAt: new Date(),
      },
    });

    for (const [indiceCategoria, categoria] of PLANTILLA_MAESTRA_V1.entries()) {
      const categoriaCreada = await prisma.categoriaPlantilla.create({
        data: {
          plantillaId: plantilla.id,
          codigo: categoria.codigo,
          nombre: categoria.nombre,
          descripcion: categoria.descripcion,
          orden: indiceCategoria,
        },
      });

      await prisma.itemPlantilla.createMany({
        data: categoria.items.map((item, indiceItem) => ({
          categoriaId: categoriaCreada.id,
          codigo: item.codigo,
          descripcion: item.descripcion,
          codigoRegistro: generarCodigoRegistro(configuracion.formatoCodigoRegistro, {
            prefijo: configuracion.prefijoDocumentos,
            codigoCategoria: categoria.codigo,
            codigoItem: item.codigo,
          }),
          subgrupo: item.subgrupo,
          instrucciones: item.instrucciones,
          frecuencia: item.frecuencia,
          responsableRol: item.responsableRol,
          revisorRol: item.revisorRol,
          requiereRespaldoDigital: item.requiereRespaldoDigital,
          requiereRespaldoFisico: item.requiereRespaldoFisico,
          controlaVencimiento: item.controlaVencimiento ?? false,
          orden: indiceItem,
        })),
      });
    }

    console.log(
      `  ${PLANTILLA_MAESTRA_V1.length} categorías y ${TOTAL_ITEMS_PLANTILLA_V1} ítems creados.`,
    );
  }

  console.log("\n✓ Carga inicial completa.");
  console.log(`  Ingresa con  ${EMAIL_ADMIN}  /  ${PASSWORD_ADMIN}`);
  console.log("  Cambia esa contraseña en cuanto entres.\n");
}

main()
  .catch((error) => {
    console.error("✗ Error en la carga inicial:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
