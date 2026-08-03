/**
 * Carga inicial por línea de comandos.
 *
 * Alternativa a la configuración inicial desde el navegador (/configuracion-inicial),
 * útil para entornos de desarrollo. Es idempotente: se puede ejecutar varias veces.
 *
 *   npm run db:seed
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

import {
  crearPlantillaInicial,
  TOTAL_CATEGORIAS_PLANTILLA_V1,
  TOTAL_ITEMS_PLANTILLA_V1,
} from "../../src/server/servicios/plantilla-inicial";

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
  console.log(`  ${configuracion.nombreEmpresa} (prefijo ${configuracion.prefijoDocumentos})`);

  console.log("→ Usuario administrador…");
  const admin = await prisma.usuario.upsert({
    where: { email: EMAIL_ADMIN },
    update: { rolGlobal: "ADMIN", activo: true },
    create: {
      email: EMAIL_ADMIN,
      nombre: "Administrador",
      apellido: "General",
      cargo: "Inspector Técnico de Obras",
      rolGlobal: "ADMIN",
      passwordHash: await bcrypt.hash(PASSWORD_ADMIN, 10),
    },
  });
  console.log(`  ${admin.email}`);

  console.log("→ Plantilla maestra del checklist…");
  const { creada } = await crearPlantillaInicial(prisma, {
    nombreEmpresa: configuracion.nombreEmpresa,
    prefijoDocumentos: configuracion.prefijoDocumentos,
    formatoCodigoRegistro: configuracion.formatoCodigoRegistro,
  });
  console.log(
    creada
      ? `  ${TOTAL_CATEGORIAS_PLANTILLA_V1} categorías y ${TOTAL_ITEMS_PLANTILLA_V1} ítems creados.`
      : "  La plantilla v1 ya existe; no se vuelve a crear.",
  );

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
