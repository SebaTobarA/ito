# ITO — Sistema de Gerenciamiento de Proyectos Inmobiliarios

Aplicación web interna para prestar el servicio de **Inspección Técnica de Obras (ITO) y
Gerenciamiento de Proyectos Inmobiliarios** en Chile. Reemplaza el control por planilla Excel
tipo "Plan de Calidad" por un sistema multi-cliente / multi-proyecto con checklist de calidad
digitalizado, respaldos documentales, cálculo automático de cumplimiento, roles, ciclos de
revisión y alertas de vencimiento.

> El nombre comercial aún no está definido. En toda la aplicación la marca es **configurable**
> (nombre, logo, colores, prefijo de codificación de documentos) desde el panel de
> administración. En el código y los textos por defecto se usa el placeholder `[Tu Empresa]`.

## Estado actual

**Fases 1 y 2 completas**, verificadas contra una base de datos real.

- **Fase 1**: autenticación con roles, marca configurable, CRUD de clientes y proyectos,
  plantilla maestra versionada y clonado automático del checklist (20 categorías, 99 registros).
- **Fase 2**: checklist operativo por proyecto — filtros y búsqueda, edición campo a campo con
  guardado inmediato, recálculo automático de cumplimiento, acciones masivas por categoría,
  registros a medida, respaldos documentales versionados con descarga verificada por permisos,
  y aplicación instalable en el celular.

- **Fase 3**: catálogos configurables desde el panel y guía de planificación por proyecto —
  servicios contratados, enfoque del servicio, dedicación del equipo y matriz de
  responsabilidades. Lo contratado decide qué módulos ve el equipo en cada obra.

Las fases 4 a 8 están planificadas en [docs/04-PLAN-FASES.md](docs/04-PLAN-FASES.md); el diseño
del motor de informe ejecutivo está en
[docs/07-PLANIFICACION-E-INFORME-EJECUTIVO.md](docs/07-PLANIFICACION-E-INFORME-EJECUTIVO.md).

## Puesta en marcha

```bash
npm install
cp .env.example .env          # completar DATABASE_URL y AUTH_SECRET
npm run db:migrate            # crear las tablas
npm run db:seed               # admin + configuración + plantilla v1
npm run dev                   # http://localhost:3000
```

Credenciales iniciales: `admin@tuempresa.cl` / `Admin.2026` (cambiar al primer ingreso).

Si no tienes PostgreSQL instalado, `npx prisma dev -n ito -d` levanta uno local; recuerda
agregar `&pgbouncer=true` al `DATABASE_URL`. Detalles en [CLAUDE.md](CLAUDE.md).

## Documentación

| Documento | Contenido |
|---|---|
| [docs/01-ARQUITECTURA.md](docs/01-ARQUITECTURA.md) | Stack tecnológico, decisiones y justificación, despliegue y costos |
| [docs/02-MODELO-DATOS.md](docs/02-MODELO-DATOS.md) | Entidades, campos, relaciones, permisos y preparación del portal de cliente |
| [docs/03-ESTRUCTURA-PROYECTO.md](docs/03-ESTRUCTURA-PROYECTO.md) | Estructura de carpetas y convenciones de código |
| [docs/04-PLAN-FASES.md](docs/04-PLAN-FASES.md) | Plan de implementación por fases con entregables y criterios de aceptación |
| [docs/05-CHECKLIST-MAESTRO.md](docs/05-CHECKLIST-MAESTRO.md) | Metodología propia: categorías, ítems y esquema de codificación |
| [docs/06-DESPLIEGUE.md](docs/06-DESPLIEGUE.md) | Puesta en producción en Vercel + Neon |
| [docs/07-PLANIFICACION-E-INFORME-EJECUTIVO.md](docs/07-PLANIFICACION-E-INFORME-EJECUTIVO.md) | Guía de planificación, registros operativos, curva de avance, UF e informe ejecutivo semanal |

## Objetivo de negocio

Herramienta interna que permite:

1. Atender varios clientes (mandantes, inmobiliarias, constructoras) y varios proyectos en
   paralelo, con un estándar único y auditable.
2. Demostrar con reportes profesionales que cada proyecto está siendo controlado — parte de lo
   que justifica el cobro del servicio.
3. Escalar: incorporar más ITOs trabajando con la misma metodología, supervisables desde un
   único panel.

Uso **interno exclusivo** en el MVP. El portal de cliente (solo lectura, limitado a sus propios
proyectos) queda diseñado desde el día uno pero **no se implementa** en esta etapa.
