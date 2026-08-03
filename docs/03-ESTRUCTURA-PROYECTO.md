# 03 — Estructura del Proyecto

## Árbol de carpetas

```
ITO/
├── docs/                              # Esta documentación de diseño
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed/
│       ├── index.ts                   # Ejecuta el seed completo
│       ├── plantilla-maestra.ts       # Las 20 categorías y ~95 ítems (docs/05)
│       ├── configuracion-empresa.ts
│       └── usuario-admin.ts
├── public/
│   ├── marca/                         # logo por defecto, favicon
│   └── manifest.webmanifest           # PWA
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Inyecta variables CSS de marca
│   │   ├── (auth)/
│   │   │   ├── iniciar-sesion/
│   │   │   └── recuperar-clave/
│   │   ├── (app)/                     # Rutas protegidas — layout con navegación
│   │   │   ├── layout.tsx
│   │   │   ├── panel/                 # Dashboard general
│   │   │   ├── clientes/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── nuevo/
│   │   │   │   └── [clienteId]/
│   │   │   ├── proyectos/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── nuevo/
│   │   │   │   └── [proyectoId]/
│   │   │   │       ├── page.tsx           # Ficha del proyecto
│   │   │   │       ├── checklist/
│   │   │   │       ├── documentos/
│   │   │   │       ├── vencimientos/
│   │   │   │       ├── revisiones/
│   │   │   │       ├── historial/         # Auditoría
│   │   │   │       └── reportes/
│   │   │   ├── alertas/
│   │   │   └── admin/
│   │   │       ├── usuarios/
│   │   │       ├── plantillas/            # CRUD del checklist maestro
│   │   │       └── empresa/               # Marca, colores, codificación
│   │   └── api/
│   │       ├── auth/[...nextauth]/
│   │       ├── archivos/[documentoId]/    # URL firmada, previa verificación de permisos
│   │       ├── reportes/[proyectoId]/     # PDF / Excel
│   │       └── cron/alertas/              # Job diario de vencimientos
│   │
│   ├── components/
│   │   ├── ui/                        # shadcn/ui — botones, inputs, dialog, tabla...
│   │   ├── layout/                    # Barra lateral, encabezado, navegación móvil
│   │   ├── marca/                     # Logo, proveedor de tema
│   │   ├── checklist/                 # Acordeón de categorías, fila/tarjeta de ítem
│   │   ├── proyectos/
│   │   ├── clientes/
│   │   ├── documentos/                # Subida, visor, historial de versiones
│   │   ├── revisiones/
│   │   └── graficos/                  # Barras de cumplimiento, evolución
│   │
│   ├── server/
│   │   ├── acciones/                  # Server Actions ("use server") — entrada validada con Zod
│   │   │   ├── clientes.ts
│   │   │   ├── proyectos.ts
│   │   │   ├── items.ts
│   │   │   ├── documentos.ts
│   │   │   ├── revisiones.ts
│   │   │   └── admin.ts
│   │   ├── servicios/                 # Lógica de negocio (orquesta dominio + base de datos)
│   │   │   ├── clonar-plantilla.ts
│   │   │   ├── recalcular-cumplimiento.ts
│   │   │   ├── generar-alertas.ts
│   │   │   ├── ciclos-revision.ts
│   │   │   └── reportes/
│   │   │       ├── pdf-estado-proyecto.tsx
│   │   │       └── excel-estado-proyecto.ts
│   │   └── datos/                     # Consultas Prisma; TODAS aplican el filtro de alcance
│   │       ├── alcance.ts             # 🔑 proyectos visibles según usuario
│   │       ├── proyectos.ts
│   │       └── ...
│   │
│   ├── dominio/                       # Lógica pura, sin Prisma, sin React → 100% testeable
│   │   ├── cumplimiento.ts            # Cálculo de %
│   │   ├── frecuencias.ts             # Próxima fecha de control según frecuencia
│   │   ├── vencimientos.ts            # Estado VIGENTE / POR_VENCER / VENCIDO
│   │   ├── codificacion.ts            # Generación de códigos de registro
│   │   └── tipos.ts
│   │
│   ├── lib/
│   │   ├── auth.ts                    # Configuración de Auth.js
│   │   ├── permisos.ts                # puede(usuario, accion, recurso)
│   │   ├── prisma.ts                  # Cliente singleton
│   │   ├── almacenamiento/
│   │   │   ├── index.ts               # Selección de adaptador por variable de entorno
│   │   │   ├── vercel-blob.ts
│   │   │   ├── s3.ts
│   │   │   └── disco-local.ts
│   │   ├── auditoria.ts               # Middleware de registro de cambios
│   │   ├── validaciones/              # Esquemas Zod compartidos
│   │   └── formato.ts                 # Fechas es-CL, CLP, UF, RUT
│   │
│   └── tipos/
│
├── tests/
│   ├── dominio/                       # Vitest — cumplimiento, frecuencias, vencimientos
│   ├── servicios/                     # Clonado de plantilla, ciclos, permisos
│   └── e2e/                           # Playwright (fase posterior)
│
├── .env.example
├── .gitignore
├── CLAUDE.md                          # Convenciones para trabajo asistido
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vitest.config.ts
```

## Convenciones

- **Idioma del código**: nombres de dominio en **español** (`Proyecto`, `cumplimiento`,
  `itemsAplicables`) porque el dominio es en español y evita traducciones mentales constantes.
  Palabras clave técnicas y librerías, en inglés como corresponde. Comentarios en español.
- **Rutas en español**: `/proyectos`, `/clientes`, `/admin/empresa` — la URL también es parte de
  la experiencia del usuario.
- **Ninguna consulta a Prisma fuera de `src/server/datos/`.** Toda consulta pasa por el filtro
  de alcance. Es lo que hace seguro el portal de cliente futuro.
- **Ningún componente lee `rolGlobal` directamente.** Siempre vía `puede(...)`.
- **`src/dominio/` no importa Prisma, React ni Next.** Recibe y devuelve objetos planos.
- **Mutaciones**: siempre Server Action → validación Zod → verificación de permiso → servicio →
  transacción (incluye recálculo de cumplimiento y registro de auditoría) → `revalidatePath`.
- **Variables de entorno** documentadas en `.env.example`; ningún secreto en el repositorio.
