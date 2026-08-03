import type { NextAuthConfig } from "next-auth";

/**
 * Configuración compartida de Auth.js, sin acceso a base de datos.
 *
 * El middleware corre en el runtime Edge, donde Prisma no está disponible; por eso
 * la configuración se parte en dos: esta parte (edge-safe, usada por el middleware)
 * y `src/auth.ts` (con Prisma, usada por el servidor).
 */
export const authConfig = {
  pages: {
    signIn: "/iniciar-sesion",
    error: "/iniciar-sesion",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7, // 7 días
  },
  providers: [], // Se completan en src/auth.ts (Credentials hoy; SSO más adelante).
  callbacks: {
    /** Protege todas las rutas salvo las públicas. Lo usa el middleware. */
    authorized({ auth, request }) {
      const estaAutenticado = Boolean(auth?.user);
      const ruta = request.nextUrl.pathname;

      const esRutaPublica =
        ruta === "/iniciar-sesion" ||
        ruta.startsWith("/api/auth") ||
        ruta.startsWith("/_next") ||
        ruta === "/manifest.webmanifest" ||
        ruta === "/favicon.ico";

      if (esRutaPublica) return true;
      return estaAutenticado;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.rolGlobal = user.rolGlobal;
        token.clienteId = user.clienteId ?? null;
        token.nombreCompleto = user.nombreCompleto;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.rolGlobal = token.rolGlobal;
        session.user.clienteId = token.clienteId;
        session.user.nombreCompleto = token.nombreCompleto;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
