# 05 — Checklist Maestro: Metodología Propia

Estructura de la **Plantilla v1** que se cargará por seed en la Fase 1. Todo es editable desde
`/admin/plantillas` sin tocar código: se pueden agregar, renombrar, reordenar o desactivar
categorías e ítems, y publicar una nueva versión.

## Esquema de codificación propio

Definido en `/admin/empresa`, con plantilla de formato configurable:

```
{prefijo}-{categoria}-{correlativo}       →  TE-05-16
```

- `prefijo`: sigla de tu empresa (por defecto `TE` de "[Tu Empresa]"; lo cambias por el tuyo
  cuando definas la marca — `ITO`, `GPI`, lo que sea).
- `categoria`: código de dos dígitos de la categoría (`00` a `19`).
- `correlativo`: dos dígitos dentro de la categoría.

El formato es una plantilla de texto: si prefieres `TE-PROT-016` o `GPI.05.16`, se cambia el
patrón en configuración y se recalcula. El campo `codigoRegistro` de cada ítem también admite
un valor manual libre o quedar vacío cuando el ítem no tiene formato asociado.

**Nada de esta codificación proviene de terceros**: es un esquema nuevo derivado de la
numeración de tus propias categorías.

## Convenciones de las tablas

- **Frec.**: INI = inicio de proyecto · SEM = semanal · MEN = mensual · SR = según requerimiento ·
  EVE = por evento · PERM = permanente · FIN = final del proyecto
- **Resp. / Rev.**: rol responsable de producir el registro y rol que lo revisa
  (ITO, JP = Jefe de Proyecto, SUB = Subgerente)
- **Dig. / Fís.**: respaldo digital / respaldo físico firmado — R = requerido, O = opcional,
  N/A = no aplica

---

## 00 — Inicio de Obra

| Cód. | Registro | Frec. | Resp. | Rev. | Dig. | Fís. |
|---|---|---|---|---|---|---|
| 0.1 | Lista de chequeo de inicio de obra | INI | ITO | JP | R | R |
| 0.2 | Verificación de antecedentes contractuales y legales del proyecto | INI | JP | SUB | R | O |
| 0.3 | Constitución del equipo y matriz de responsabilidades | INI | JP | SUB | R | N/A |
| 0.4 | Apertura de carpeta digital del proyecto y estructura de archivos | INI | ITO | JP | R | N/A |

## 01 — Planificación

| Cód. | Registro | Frec. | Resp. | Rev. | Dig. | Fís. |
|---|---|---|---|---|---|---|
| 1.1 | Guía de planificación del proyecto | INI | JP | SUB | R | R |
| 1.2 | Plan de inspección y ensayos (alcance de la ITO) | INI | ITO | JP | R | O |
| 1.3 | Actualización de la planificación | MEN | JP | SUB | R | N/A |

## 02 — Correspondencia

| Cód. | Registro | Frec. | Resp. | Rev. | Dig. | Fís. |
|---|---|---|---|---|---|---|
| 2.1 | Libro de correspondencia enviada y recibida | PERM | ITO | JP | R | N/A |
| 2.2 | Cartas formales (emitidas y recibidas) | SR | ITO | JP | R | O |
| 2.3 | Registro de correos electrónicos relevantes | PERM | ITO | JP | R | N/A |

## 03 — Actas

| Cód. | Registro | Frec. | Resp. | Rev. | Dig. | Fís. |
|---|---|---|---|---|---|---|
| 3.1 | Acta de reunión de obra | SEM | ITO | JP | R | R |
| 3.2 | Acta de entrega de terreno | EVE | JP | SUB | R | R |
| 3.3 | Acta de ingreso de contratistas y subcontratos | EVE | ITO | JP | R | R |
| 3.4 | Acta de recepción provisoria | EVE | JP | SUB | R | R |
| 3.5 | Acta de recepción definitiva | EVE | JP | SUB | R | R |
| 3.6 | Acta de término anticipado de contrato | SR | JP | SUB | R | R |

## 04 — Planos y Especificaciones Técnicas

| Cód. | Registro | Frec. | Resp. | Rev. | Dig. | Fís. |
|---|---|---|---|---|---|---|
| 4.1 | Listado maestro de planos y especificaciones (control de versiones) | PERM | ITO | JP | R | N/A |
| 4.2 | Almacenamiento de planos por especialidad | PERM | ITO | JP | R | N/A |

## 05 — Protocolos de Control de Calidad Constructivo

Categoría con subgrupos para que sea manejable en pantalla (campo `subgrupo` del ítem).

**Movimiento de tierras y fundaciones**

| Cód. | Registro | Frec. | Resp. | Rev. | Dig. | Fís. |
|---|---|---|---|---|---|---|
| 5.1 | Topografía, trazado y niveles | EVE | ITO | JP | R | R |
| 5.2 | Excavaciones | EVE | ITO | JP | R | R |
| 5.3 | Demoliciones | EVE | ITO | JP | R | R |
| 5.4 | Relleno y compactación | EVE | ITO | JP | R | R |
| 5.5 | Pilas de socalzado | EVE | ITO | JP | R | R |

**Obra gruesa**

| Cód. | Registro | Frec. | Resp. | Rev. | Dig. | Fís. |
|---|---|---|---|---|---|---|
| 5.6 | Enfierradura | EVE | ITO | JP | R | R |
| 5.7 | Moldaje y descimbre | EVE | ITO | JP | R | R |
| 5.8 | Hormigones (colocación, muestreo y ensayos) | EVE | ITO | JP | R | R |
| 5.9 | Albañilerías | EVE | ITO | JP | R | R |
| 5.10 | Estructuras metálicas | EVE | ITO | JP | R | R |
| 5.11 | Estructuras de madera | EVE | ITO | JP | R | R |
| 5.12 | Montaje de elementos prefabricados | EVE | ITO | JP | R | R |
| 5.13 | Sobrelosas | EVE | ITO | JP | R | R |
| 5.14 | Tabiquerías | EVE | ITO | JP | R | R |
| 5.15 | Cubiertas | EVE | ITO | JP | R | R |
| 5.16 | Impermeabilizaciones | EVE | ITO | JP | R | R |
| 5.17 | Aislaciones térmicas y acústicas | EVE | ITO | JP | R | R |

**Terminaciones**

| Cód. | Registro | Frec. | Resp. | Rev. | Dig. | Fís. |
|---|---|---|---|---|---|---|
| 5.18 | Estucos | EVE | ITO | JP | R | R |
| 5.19 | Enlucidos | EVE | ITO | JP | R | R |
| 5.20 | Revestimientos de piso y muro | EVE | ITO | JP | R | R |
| 5.21 | Pavimentos de hormigón | EVE | ITO | JP | R | R |
| 5.22 | Pavimentos asfálticos | EVE | ITO | JP | R | R |
| 5.23 | Pinturas | EVE | ITO | JP | R | R |
| 5.24 | Instalación de cielos | EVE | ITO | JP | R | R |
| 5.25 | Instalación de puertas y ventanas | EVE | ITO | JP | R | R |
| 5.26 | Instalación de muebles | EVE | ITO | JP | R | R |
| 5.27 | Griferías y artefactos sanitarios | EVE | ITO | JP | R | R |

**Instalaciones**

| Cód. | Registro | Frec. | Resp. | Rev. | Dig. | Fís. |
|---|---|---|---|---|---|---|
| 5.28 | Instalaciones eléctricas y corrientes débiles | EVE | ITO | JP | R | R |
| 5.29 | Instalaciones sanitarias (agua potable y alcantarillado) | EVE | ITO | JP | R | R |
| 5.30 | Instalaciones de gas | EVE | ITO | JP | R | R |
| 5.31 | Climatización | EVE | ITO | JP | R | R |
| 5.32 | Sistemas mecánicos (ascensores, bombas, extracción) | EVE | ITO | JP | R | R |
| 5.33 | Seguridad contra incendios (red húmeda/seca, detección) | EVE | ITO | JP | R | R |

**Transversales y cierre**

| Cód. | Registro | Frec. | Resp. | Rev. | Dig. | Fís. |
|---|---|---|---|---|---|---|
| 5.34 | Instalación de faenas | INI | ITO | JP | R | R |
| 5.35 | Control presupuestario de partidas ejecutadas | MEN | ITO | JP | R | N/A |
| 5.36 | Recepción de departamentos / unidades | EVE | ITO | JP | R | R |
| 5.37 | Aseo final y entrega | FIN | ITO | JP | R | R |
| 5.38 | Listado de observaciones y su levantamiento (*punch list*) | SR | ITO | JP | R | R |

## 06 — Informes

| Cód. | Registro | Frec. | Resp. | Rev. | Dig. | Fís. |
|---|---|---|---|---|---|---|
| 6.1 | Informe semanal ejecutivo | SEM | ITO | JP | R | N/A |
| 6.2 | Informe mensual de avance | MEN | JP | SUB | R | O |
| 6.3 | Informe de ingreso a obra | INI | ITO | JP | R | N/A |
| 6.4 | Informe semanal de seguridad | SEM | ITO | JP | R | N/A |
| 6.5 | Informe mensual de seguridad | MEN | ITO | JP | R | N/A |
| 6.6 | Reporte preliminar de accidentes | EVE | ITO | JP | R | R |
| 6.7 | Informe final del proyecto | FIN | JP | SUB | R | R |

## 07 — Estados de Pago

| Cód. | Registro | Frec. | Resp. | Rev. | Dig. | Fís. |
|---|---|---|---|---|---|---|
| 7.1 | Carátula de estado de pago | MEN | ITO | JP | R | R |
| 7.2 | Resumen y control acumulado de estados de pago | MEN | JP | SUB | R | N/A |

## 08 — Presupuestos y Notas de Cambio

| Cód. | Registro | Frec. | Resp. | Rev. | Dig. | Fís. |
|---|---|---|---|---|---|---|
| 8.1 | Nota de cambio | SR | ITO | JP | R | R |
| 8.2 | Resumen y control de notas de cambio | MEN | JP | SUB | R | N/A |
| 8.3 | Valores proforma | SR | ITO | JP | R | N/A |
| 8.4 | Control de aportes del mandante | MEN | JP | SUB | R | N/A |

## 09 — Requerimientos de Información (RDI)

| Cód. | Registro | Frec. | Resp. | Rev. | Dig. | Fís. |
|---|---|---|---|---|---|---|
| 9.1 | Requerimiento de información (RDI) | SR | ITO | JP | R | O |
| 9.2 | Listado de RDI gestionadas y su estado | SEM | ITO | JP | R | N/A |

## 10 — Órdenes de Compra

| Cód. | Registro | Frec. | Resp. | Rev. | Dig. | Fís. |
|---|---|---|---|---|---|---|
| 10.1 | Orden de compra | SR | JP | SUB | R | R |
| 10.2 | Listado y control de órdenes de compra | MEN | ITO | JP | R | N/A |

## 11 — Programación y Avance

| Cód. | Registro | Frec. | Resp. | Rev. | Dig. | Fís. |
|---|---|---|---|---|---|---|
| 11.1 | Programa vigente de obra (carta Gantt) | MEN | JP | SUB | R | N/A |
| 11.2 | Revisión de curva S y avance físico real vs. programado | SEM | ITO | JP | R | N/A |

## 12 — Registro Fotográfico

| Cód. | Registro | Frec. | Resp. | Rev. | Dig. | Fís. |
|---|---|---|---|---|---|---|
| 12.1 | Registro fotográfico semanal de avance | SEM | ITO | JP | R | N/A |
| 12.2 | Registro fotográfico de hitos y de observaciones | EVE | ITO | JP | R | N/A |

## 13 — Contrato, Garantías y Permisos ⚠️ *con control de vencimiento*

| Cód. | Registro | Frec. | Resp. | Rev. | Dig. | Fís. | Vence |
|---|---|---|---|---|---|---|---|
| 13.1 | Contrato con la empresa constructora y sus anexos | INI | JP | SUB | R | R | — |
| 13.2 | Boletas de garantía (fiel cumplimiento, anticipo, correcta ejecución) | PERM | JP | SUB | R | R | ✅ |
| 13.3 | Seguros y pólizas (todo riesgo, responsabilidad civil) | PERM | JP | SUB | R | R | ✅ |
| 13.4 | Permisos y autorizaciones (edificación, rotura, faena, sectoriales) | PERM | JP | SUB | R | R | ✅ |

Los ítems marcados con ✅ tienen `controlaVencimiento = true` y habilitan el módulo de
vencimientos: cada boleta, póliza o permiso se registra individualmente con su número, entidad
emisora, monto, fecha de vencimiento y días de alerta previa.

## 14 — Planos As Built

| Cód. | Registro | Frec. | Resp. | Rev. | Dig. | Fís. |
|---|---|---|---|---|---|---|
| 14.1 | Listado de planos as built por especialidad | FIN | ITO | JP | R | N/A |
| 14.2 | Almacenamiento de planos as built | FIN | ITO | JP | R | O |

## 15 — Seguridad y Medio Ambiente

| Cód. | Registro | Frec. | Resp. | Rev. | Dig. | Fís. |
|---|---|---|---|---|---|---|
| 15.1 | Matriz de identificación de peligros y evaluación de riesgos | INI | ITO | JP | R | R |
| 15.2 | Matriz de aspectos e impactos ambientales | INI | ITO | JP | R | R |
| 15.3 | Análisis de trabajo seguro (ATS) | SR | ITO | JP | R | R |
| 15.4 | Verificación de condiciones de seguridad y ambiente en terreno | SEM | ITO | JP | R | R |
| 15.5 | Informe de investigación de incidentes y accidentes | EVE | ITO | JP | R | R |
| 15.6 | Informes de seguridad emitidos por la constructora | MEN | ITO | JP | R | N/A |
| 15.7 | Listado de teléfonos y plan de emergencia | INI | ITO | JP | R | O |
| 15.8 | Autoevaluación y evaluación de contratistas | MEN | ITO | JP | R | N/A |

## 16 — Recepción Municipal

| Cód. | Registro | Frec. | Resp. | Rev. | Dig. | Fís. |
|---|---|---|---|---|---|---|
| 16.1 | Seguimiento de certificados y documentos para recepción final | MEN | JP | SUB | R | N/A |
| 16.2 | Certificado de recepción municipal definitiva | FIN | JP | SUB | R | R |

## 17 — Carpeta Entregable

| Cód. | Registro | Frec. | Resp. | Rev. | Dig. | Fís. |
|---|---|---|---|---|---|---|
| 17.1 | Índice de la carpeta entregable al mandante | FIN | JP | SUB | R | R |
| 17.2 | Acta de entrega de documentación al mandante | FIN | JP | SUB | R | R |

## 18 — Cierre de Proyecto

| Cód. | Registro | Frec. | Resp. | Rev. | Dig. | Fís. |
|---|---|---|---|---|---|---|
| 18.1 | Lista de chequeo de cierre de proyecto | FIN | ITO | JP | R | R |
| 18.2 | Evaluación de desempeño de la constructora y lecciones aprendidas | FIN | JP | SUB | R | O |

## 19 — Otros / Administración Interna

| Cód. | Registro | Frec. | Resp. | Rev. | Dig. | Fís. |
|---|---|---|---|---|---|---|
| 19.1 | Registros administrativos internos del proyecto | SR | ITO | JP | O | N/A |
| 19.2 | Documentos varios no clasificados | SR | ITO | JP | O | N/A |

---

**Total: 20 categorías, 99 ítems.**

## Ajustes propuestos respecto de tu estructura original

Todos son sugerencias — se aplican o se descartan antes de generar el seed:

1. **Subgrupos dentro de la categoría 05.** Los 38 protocolos en una sola lista son difíciles de
   operar en pantalla, sobre todo en celular. Se agruparon en Movimiento de tierras / Obra
   gruesa / Terminaciones / Instalaciones / Transversales, manteniendo la categoría única y la
   numeración correlativa.
2. **Protocolos ordenados por secuencia constructiva** (topografía → excavación → fundaciones →
   obra gruesa → terminaciones → instalaciones) en vez de alfabético. En obra se recorre en ese
   orden.
3. **Ítem 5.38 — listado de observaciones (*punch list*)**: no estaba explícito y es el
   instrumento más usado en la práctica de una ITO durante la recepción.
4. **Ítem 1.2 — plan de inspección y ensayos**: define desde el inicio qué se va a controlar y
   con qué criterio. Es un buen diferenciador comercial frente al cliente.
5. **Ítem 3.3 renombrado** a "ingreso de contratistas y subcontratos" y ubicado en Actas.
6. **Ítem 18.2 — evaluación de la constructora y lecciones aprendidas**: alimenta tu propio
   conocimiento del mercado entre proyectos.
7. **Categoría 11 renombrada** de "Programaciones" a "Programación y Avance", con el programa
   vigente separado del control de curva S.
8. **Vencimientos como entidad propia** (ítems 13.2 a 13.4): una obra suele tener varias boletas
   y pólizas simultáneas con fechas distintas; con un solo campo de fecha por ítem se pierde el
   control real.
