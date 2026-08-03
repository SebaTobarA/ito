# Convenciones del proyecto

Sistema de Inspección Técnica de Obras y Gerenciamiento de Proyectos Inmobiliarios.
Diseño completo en [`docs/`](docs/) — leer `02-MODELO-DATOS.md` antes de tocar el esquema.

## Reglas que no se rompen

1. **Ninguna consulta a Prisma fuera de `src/server/datos/`** sin pasar por el filtro de alcance
   (`filtroProyectos` / `filtroClientes`). Es lo que hace seguro el portal de cliente futuro.
2. **Ningún componente lee `rolGlobal` directamente.** Siempre vía `puede(usuario, accion, ctx)`
   de `src/lib/permisos.ts`.
3. **`src/dominio/` no importa Prisma, React ni Next.** Recibe y devuelve objetos planos; es la
   capa que se prueba con Vitest.
4. **Toda mutación es una Server Action** en `src/server/acciones/`, con este orden:
   validación Zod → `exigir(...)` permiso → servicio → transacción (incluye recálculo de
   cumplimiento y auditoría) → `revalidatePath`.
5. **Nada se borra físicamente.** Clientes y usuarios se desactivan; documentos usan
   `eliminadoAt`; las asignaciones de equipo se cierran con `hasta`, no se eliminan.
6. **El checklist de un proyecto es una copia independiente** de la plantilla. Editar la
   plantilla nunca debe afectar proyectos ya creados.

## Convención de fechas

Las fechas de calendario (vencimientos, inicio/término de obra, fechas de control) se guardan
como **medianoche UTC**, que es lo que envía `<input type="date">`. La aritmética de fechas usa
componentes UTC. Para comparar contra "ahora" hay que usar `hoyEnChile()` de
`src/dominio/frecuencias.ts`, nunca `new Date()` directamente: entre las 20:00 y la medianoche
en Chile el día UTC ya avanzó y las alertas se adelantarían un día.

## Idioma

Nombres de dominio, rutas, comentarios y textos en **español**. La única excepción es el hook
`useAccion` (`src/lib/use-accion.ts`): React exige el prefijo `use`.

## Comandos

```bash
npm run dev          # servidor de desarrollo
npm run test         # pruebas de dominio y permisos (Vitest)
npm run typecheck    # tsc --noEmit
npm run lint
npm run build        # prisma generate + next build
npm run db:migrate   # crear y aplicar migración
npm run db:seed      # carga inicial: admin, empresa y plantilla v1
npm run db:studio    # explorador de la base
```

## Base de datos local sin instalar Postgres

```bash
npx prisma dev -n ito -d
```

Levanta un Postgres local y devuelve la cadena de conexión. **Agregar `&pgbouncer=true`** al
`DATABASE_URL`: pasa por un pool y sin ese flag Prisma falla con
«prepared statement "s0" already exists». Lo mismo aplica a la cadena `-pooler` de Neon.

## Estado por fases

- **Fase 1 — completa**: autenticación, marca configurable, CRUD de clientes y proyectos,
  plantilla maestra versionada, clonado automático del checklist, gestión de usuarios.
- **Fases 2 a 5**: ver [`docs/04-PLAN-FASES.md`](docs/04-PLAN-FASES.md).
