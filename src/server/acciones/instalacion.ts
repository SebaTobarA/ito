"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { aObjeto } from "@/lib/validaciones";
import { ID_CONFIGURACION } from "@/server/datos/empresa";
import { crearPlantillaInicial } from "@/server/servicios/plantilla-inicial";
import {
  crearCatalogosIniciales,
  crearResponsabilidadesIniciales,
} from "@/server/servicios/catalogos-iniciales";
import { aResultadoDeError, type ResultadoAccion } from "./resultado";

const esquemaInstalacion = z
  .object({
    nombreEmpresa: z.string().trim().min(2, "El nombre de la empresa es obligatorio"),
    nombreCorto: z
      .string()
      .trim()
      .min(1, "La sigla es obligatoria")
      .max(8, "Máximo 8 caracteres"),
    prefijoDocumentos: z
      .string()
      .trim()
      .min(1, "El prefijo es obligatorio")
      .max(8, "Máximo 8 caracteres"),
    nombre: z.string().trim().min(2, "Tu nombre es obligatorio"),
    apellido: z.string().trim().min(2, "Tu apellido es obligatorio"),
    email: z.string().trim().toLowerCase().email("Correo electrónico inválido"),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmacion: z.string(),
  })
  .refine((datos) => datos.password === datos.confirmacion, {
    path: ["confirmacion"],
    message: "Las contraseñas no coinciden",
  });

/**
 * Configuración inicial de una instalación nueva.
 *
 * Crea la configuración de la empresa, el primer usuario administrador y la
 * plantilla maestra del checklist, todo en una transacción.
 *
 * Solo funciona mientras no exista ningún usuario: una vez configurada la
 * instalación, esta acción queda cerrada para siempre.
 */
export async function configurarInstalacion(
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  try {
    if ((await prisma.usuario.count()) > 0) {
      return { error: "Esta instalación ya está configurada. Inicia sesión con tu cuenta." };
    }

    const valores = esquemaInstalacion.parse(aObjeto(datos));
    const passwordHash = await bcrypt.hash(valores.password, 10);

    await prisma.$transaction(
      async (tx) => {
        // Doble verificación dentro de la transacción, por si dos personas
        // abrieran el formulario al mismo tiempo.
        if ((await tx.usuario.count()) > 0) {
          throw new Error("Esta instalación ya está configurada.");
        }

        const configuracion = await tx.configuracionEmpresa.upsert({
          where: { id: ID_CONFIGURACION },
          update: {
            nombreEmpresa: valores.nombreEmpresa,
            nombreCorto: valores.nombreCorto,
            prefijoDocumentos: valores.prefijoDocumentos,
          },
          create: {
            id: ID_CONFIGURACION,
            nombreEmpresa: valores.nombreEmpresa,
            nombreCorto: valores.nombreCorto,
            prefijoDocumentos: valores.prefijoDocumentos,
          },
        });

        await tx.usuario.create({
          data: {
            email: valores.email,
            nombre: valores.nombre,
            apellido: valores.apellido,
            cargo: "Inspector Técnico de Obras",
            rolGlobal: "ADMIN",
            passwordHash,
          },
        });

        const { plantilla } = await crearPlantillaInicial(tx, {
          nombreEmpresa: configuracion.nombreEmpresa,
          prefijoDocumentos: configuracion.prefijoDocumentos,
          formatoCodigoRegistro: configuracion.formatoCodigoRegistro,
        });

        // Los catálogos y la matriz de responsabilidades nacen con la
        // instalación: sin ellos la guía de planificación no tendría con qué
        // llenarse, y son editables desde el panel igual que la plantilla.
        await crearCatalogosIniciales(tx);
        await crearResponsabilidadesIniciales(tx, plantilla.id);
      },
      { timeout: 30_000 },
    );

    revalidatePath("/", "layout");
    return { ok: true, mensaje: "Instalación configurada. Ya puedes iniciar sesión." };
  } catch (error) {
    return aResultadoDeError(error);
  }
}
