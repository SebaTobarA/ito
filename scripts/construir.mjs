#!/usr/bin/env node
/**
 * Pipeline de compilación: normaliza las variables de base de datos, aplica las
 * migraciones pendientes y compila la aplicación.
 *
 * Existe para que la integración Neon de Vercel funcione sin configurar nada a
 * mano: esa integración inyecta sus propios nombres de variable
 * (DATABASE_URL_UNPOOLED, POSTGRES_URL_NON_POOLING, …) y Prisma espera
 * DATABASE_URL y DIRECT_URL. Aquí se hace la traducción una sola vez.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

// En Vercel las variables vienen del entorno; en local hay que leer .env, que
// Node no carga por su cuenta (a diferencia de Next).
cargarEnvLocal(".env");

const entorno = { ...process.env };

function cargarEnvLocal(archivo) {
  if (!existsSync(archivo)) return;
  for (const linea of readFileSync(archivo, "utf8").split("\n")) {
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith("#")) continue;
    const separador = limpia.indexOf("=");
    if (separador === -1) continue;
    const clave = limpia.slice(0, separador).trim();
    if (process.env[clave] !== undefined) continue; // el entorno real manda
    process.env[clave] = limpia
      .slice(separador + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
}

/** Primera variable definida y no vacía de la lista. */
function primera(...nombres) {
  for (const nombre of nombres) {
    const valor = entorno[nombre];
    if (valor && valor.trim() !== "") return valor.trim();
  }
  return undefined;
}

const conexionPooled = primera("DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL");
const conexionDirecta = primera(
  "DIRECT_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_URL_NO_SSL",
);

if (!conexionPooled) {
  console.error(
    "\n✗ Falta DATABASE_URL.\n" +
      "  Agrégala en Vercel → Settings → Environment Variables, o conecta una base\n" +
      "  Neon desde la pestaña Storage. Ver docs/06-DESPLIEGUE.md.\n",
  );
  process.exit(1);
}

/**
 * Una conexión a través del pool necesita `pgbouncer=true`: sin eso Prisma falla
 * con «prepared statement "s0" already exists» en la primera consulta repetida.
 */
function conPgBouncer(url) {
  if (url.includes("pgbouncer=")) return url;
  const esPooled = url.includes("-pooler.") || url.includes("pgbouncer");
  if (!esPooled) return url;
  return url + (url.includes("?") ? "&" : "?") + "pgbouncer=true";
}

entorno.DATABASE_URL = conPgBouncer(conexionPooled);
// Sin conexión directa disponible, las migraciones usan la misma cadena: funciona
// igual, solo es menos robusto si el pool corta la sesión a mitad de una migración.
entorno.DIRECT_URL = conexionDirecta ?? conexionPooled;

console.log(
  `→ Base de datos: ${entorno.DATABASE_URL === conexionPooled ? "conexión directa" : "conexión con pool (pgbouncer)"}` +
    `${conexionDirecta ? ", migraciones por conexión directa" : ""}`,
);

const pasos = [
  ["npx", ["prisma", "generate"]],
  ["npx", ["prisma", "migrate", "deploy"]],
  // Los catálogos configurables se crean en la configuración inicial. Una
  // instalación anterior a la Fase 3 ya pasó por ahí, así que sin este paso
  // quedaría con las tablas nuevas vacías y la guía de planificación sin
  // servicios que ofrecer. Es idempotente y no aborta el despliegue.
  ["npx", ["tsx", "scripts/asegurar-catalogos.ts"]],
  ["npx", ["next", "build"]],
];

for (const [comando, argumentos] of pasos) {
  const resultado = spawnSync(comando, argumentos, { stdio: "inherit", env: entorno });
  if (resultado.status !== 0) {
    process.exit(resultado.status ?? 1);
  }
}
