import NextAuth from "next-auth";
import type { Adapter } from "next-auth/adapters";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import type { UsuarioSesion } from "@/lib/permisos";

const credencialesSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // El adaptador queda instalado aunque hoy solo usemos credenciales: cuando se
  // agregue SSO (Google Workspace, Entra ID) basta con sumar un provider.
  // El cast salva la doble copia de @auth/core que arrastran next-auth y
  // @auth/prisma-adapter; en tiempo de ejecución es el mismo adaptador.
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  providers: [
    Credentials({
      name: "Credenciales",
      credentials: {
        email: { label: "Correo electrónico", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credenciales) {
        const validadas = credencialesSchema.safeParse(credenciales);
        if (!validadas.success) return null;

        const { email, password } = validadas.data;
        const usuario = await prisma.usuario.findUnique({
          where: { email: email.toLowerCase().trim() },
        });

        if (!usuario || !usuario.activo || !usuario.passwordHash) return null;

        const claveCorrecta = await bcrypt.compare(password, usuario.passwordHash);
        if (!claveCorrecta) return null;

        await prisma.usuario.update({
          where: { id: usuario.id },
          data: { ultimoAccesoAt: new Date() },
        });

        return {
          id: usuario.id,
          email: usuario.email,
          name: `${usuario.nombre} ${usuario.apellido}`,
          nombreCompleto: `${usuario.nombre} ${usuario.apellido}`,
          rolGlobal: usuario.rolGlobal,
          clienteId: usuario.clienteId,
        };
      },
    }),
  ],
});

/**
 * Usuario de la sesión actual en el formato que espera el módulo de permisos.
 * Devuelve `null` si no hay sesión.
 */
export async function usuarioActual(): Promise<
  (UsuarioSesion & { email: string; nombreCompleto: string }) | null
> {
  const sesion = await auth();
  if (!sesion?.user?.id) return null;

  return {
    id: sesion.user.id,
    rolGlobal: sesion.user.rolGlobal,
    clienteId: sesion.user.clienteId ?? null,
    email: sesion.user.email ?? "",
    nombreCompleto: sesion.user.nombreCompleto ?? sesion.user.name ?? "",
  };
}

/** Igual que `usuarioActual`, pero lanza si no hay sesión. Para Server Actions. */
export async function exigirSesion() {
  const usuario = await usuarioActual();
  if (!usuario) throw new Error("Debes iniciar sesión para realizar esta acción.");
  return usuario;
}
