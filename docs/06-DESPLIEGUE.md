# 06 — Despliegue en Vercel + Neon

Pasos exactos para dejar la aplicación en línea. Costo inicial: **USD 0**.

## 1. Base de datos en Neon

1. Crear cuenta en https://neon.tech (plan Free) e iniciar un proyecto nuevo.
   - Región recomendada: **AWS South America (São Paulo)** — es la más cercana a Chile.
   - Nombre de la base: `ito`.
2. En **Connection Details** copiar dos cadenas:
   - **Pooled connection** (la que dice `-pooler` en el host) → será `DATABASE_URL`.
     Agregarle `&pgbouncer=true` al final.
   - **Direct connection** (sin `-pooler`) → será `DIRECT_URL`.

Sin `pgbouncer=true` en la cadena pooled, Prisma falla con
«prepared statement "s0" already exists». Sin `DIRECT_URL`, las migraciones fallan.

## 2. Repositorio en GitHub

El repositorio debe existir antes de conectar Vercel:

1. https://github.com/new → nombre `ITO`, visibilidad **Private**, sin README ni .gitignore.
2. Desde el proyecto local:

```bash
git push -u origin main
```

## 3. Proyecto en Vercel

1. https://vercel.com/new → **Import Git Repository** → seleccionar `ITO`.
2. Framework: Next.js (se detecta solo). No cambiar el comando de build: el `package.json` ya
   ejecuta `prisma generate && prisma migrate deploy && next build`, de modo que **cada deploy
   aplica las migraciones pendientes automáticamente**.
3. En **Environment Variables**, agregar (para Production, Preview y Development):

   | Variable | Valor |
   |---|---|
   | `DATABASE_URL` | cadena pooled de Neon + `&pgbouncer=true` |
   | `DIRECT_URL` | cadena directa de Neon |
   | `AUTH_SECRET` | generar con `openssl rand -base64 32` |
   | `AUTH_TRUST_HOST` | `true` |
   | `ALMACENAMIENTO` | `blob` |

   `AUTH_URL` **no** hace falta en Vercel: se deduce del dominio del despliegue.

4. **Deploy**.

## 4. Almacenamiento de archivos (Vercel Blob)

En el proyecto de Vercel → pestaña **Storage** → **Create Database** → **Blob** → conectarlo al
proyecto. Vercel inyecta `BLOB_READ_WRITE_TOKEN` automáticamente; no hay que copiarlo a mano.

Si más adelante el volumen crece, se cambia a Cloudflare R2 (sin costo de egreso) apuntando
`ALMACENAMIENTO=s3` y las variables `S3_*`. La aplicación no cambia: el almacenamiento está
detrás de un adaptador (`src/lib/almacenamiento/`).

## 5. Carga inicial

La primera vez hay que crear el usuario administrador y la plantilla del checklist. Desde el
equipo local, apuntando a la base de producción:

```bash
DATABASE_URL="<cadena pooled de Neon>" DIRECT_URL="<cadena directa>" npm run db:seed
```

Ingresar con `admin@tuempresa.cl` / `Admin.2026` y **cambiar la contraseña de inmediato** en
Administración → Usuarios.

## 6. Dominio propio (opcional, cuando definas la marca)

Vercel → Settings → Domains → agregar el dominio y seguir las instrucciones de DNS.

---

## Verificación posterior al despliegue

1. Entrar a la URL de Vercel y hacer login.
2. Administración → Empresa: cambiar nombre y colores, comprobar que se aplican.
3. Crear un cliente y un proyecto; el checklist debe generarse con sus 20 categorías.
4. Subir un archivo de respaldo en cualquier ítem y volver a descargarlo.

## Problemas frecuentes

| Síntoma | Causa | Solución |
|---|---|---|
| `prepared statement "s0" already exists` | falta `&pgbouncer=true` | agregarlo a `DATABASE_URL` |
| El build falla en `prisma migrate deploy` | falta `DIRECT_URL` o apunta al pooler | usar la cadena directa |
| Login redirige en bucle | falta `AUTH_SECRET` o `AUTH_TRUST_HOST` | agregarlos y volver a desplegar |
| Primer request lento (~1 s) | Neon Free suspende la base al no usarse | normal; se resuelve con el plan Launch |
