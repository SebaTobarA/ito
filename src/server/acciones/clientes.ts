"use server";

import { revalidatePath } from "next/cache";

import { exigirSesion } from "@/auth";
import { exigir } from "@/lib/permisos";
import { prisma } from "@/lib/prisma";
import { aObjeto, esquemaCliente } from "@/lib/validaciones";
import { camposModificados, registrarAuditoria } from "@/server/servicios/auditoria";
import { aResultadoDeError, type ResultadoAccion } from "./resultado";

const BOOLEANOS = ["activo"];

export async function crearCliente(
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  try {
    const usuario = await exigirSesion();
    exigir(usuario, "cliente.crear");

    const valores = esquemaCliente.parse(aObjeto(datos, BOOLEANOS));
    const cliente = await prisma.cliente.create({ data: valores });

    await registrarAuditoria({
      entidad: "Cliente",
      entidadId: cliente.id,
      accion: "CREAR",
      usuarioId: usuario.id,
      valorNuevo: { nombre: cliente.nombre, rut: cliente.rut },
    });

    revalidatePath("/clientes");
    return { ok: true, mensaje: `Cliente "${cliente.nombre}" creado.` };
  } catch (error) {
    return aResultadoDeError(error);
  }
}

export async function actualizarCliente(
  clienteId: string,
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  try {
    const usuario = await exigirSesion();
    exigir(usuario, "cliente.editar");

    const valores = esquemaCliente.parse(aObjeto(datos, BOOLEANOS));

    const anterior = await prisma.cliente.findUniqueOrThrow({ where: { id: clienteId } });
    const cliente = await prisma.cliente.update({ where: { id: clienteId }, data: valores });

    const cambios = camposModificados(
      anterior as unknown as Record<string, unknown>,
      valores as unknown as Record<string, unknown>,
    );
    await registrarAuditoria({
      entidad: "Cliente",
      entidadId: cliente.id,
      accion: "ACTUALIZAR",
      usuarioId: usuario.id,
      valorAnterior: cambios.anterior,
      valorNuevo: cambios.nuevo,
    });

    revalidatePath("/clientes");
    revalidatePath(`/clientes/${clienteId}`);
    return { ok: true, mensaje: "Cliente actualizado." };
  } catch (error) {
    return aResultadoDeError(error);
  }
}

/**
 * Desactiva un cliente. No se elimina físicamente: sus proyectos y su historial
 * deben seguir siendo consultables.
 */
export async function desactivarCliente(clienteId: string): Promise<ResultadoAccion> {
  try {
    const usuario = await exigirSesion();
    exigir(usuario, "cliente.eliminar");

    await prisma.cliente.update({ where: { id: clienteId }, data: { activo: false } });

    await registrarAuditoria({
      entidad: "Cliente",
      entidadId: clienteId,
      accion: "ACTUALIZAR",
      usuarioId: usuario.id,
      campo: "activo",
      valorAnterior: true,
      valorNuevo: false,
    });

    revalidatePath("/clientes");
    return { ok: true, mensaje: "Cliente desactivado." };
  } catch (error) {
    return aResultadoDeError(error);
  }
}
