"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

import { exigirSesion } from "@/auth";
import { exigir } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { aObjeto, esquemaUsuario } from "@/lib/validaciones";
import { registrarAuditoria } from "@/server/servicios/auditoria";
import { aResultadoDeError, type ResultadoAccion } from "./resultado";

const BOOLEANOS = ["activo"];

export async function crearUsuario(
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  try {
    const usuario = await exigirSesion();
    exigir(usuario, "usuario.gestionar");

    const valores = esquemaUsuario.parse(aObjeto(datos, BOOLEANOS));
    if (!valores.password) {
      return {
        error: "Revisa los datos ingresados.",
        errores: { password: "Define una contraseña inicial de al menos 8 caracteres." },
      };
    }

    const { password, ...campos } = valores;
    const creado = await prisma.usuario.create({
      data: { ...campos, passwordHash: await bcrypt.hash(password, 10) },
    });

    await registrarAuditoria({
      entidad: "Usuario",
      entidadId: creado.id,
      accion: "CREAR",
      usuarioId: usuario.id,
      valorNuevo: { email: creado.email, rolGlobal: creado.rolGlobal },
    });

    revalidatePath("/admin/usuarios");
    return { ok: true, mensaje: `Usuario ${creado.email} creado.` };
  } catch (error) {
    return aResultadoDeError(error);
  }
}

export async function actualizarUsuario(
  usuarioId: string,
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  try {
    const sesion = await exigirSesion();
    exigir(sesion, "usuario.gestionar");

    const valores = esquemaUsuario.parse(aObjeto(datos, BOOLEANOS));
    const { password, ...campos } = valores;

    // No dejar el sistema sin ningún administrador activo.
    const anterior = await prisma.usuario.findUniqueOrThrow({ where: { id: usuarioId } });
    if (anterior.rolGlobal === "ADMIN" && (campos.rolGlobal !== "ADMIN" || !campos.activo)) {
      const otrosAdmins = await prisma.usuario.count({
        where: { rolGlobal: "ADMIN", activo: true, id: { not: usuarioId } },
      });
      if (otrosAdmins === 0) {
        return { error: "Debe quedar al menos un administrador activo en el sistema." };
      }
    }

    await prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        ...campos,
        ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
      },
    });

    await registrarAuditoria({
      entidad: "Usuario",
      entidadId: usuarioId,
      accion: "ACTUALIZAR",
      usuarioId: sesion.id,
      valorAnterior: { rolGlobal: anterior.rolGlobal, activo: anterior.activo },
      valorNuevo: { rolGlobal: campos.rolGlobal, activo: campos.activo },
    });

    revalidatePath("/admin/usuarios");
    return {
      ok: true,
      mensaje: password ? "Usuario actualizado y contraseña restablecida." : "Usuario actualizado.",
    };
  } catch (error) {
    return aResultadoDeError(error);
  }
}
