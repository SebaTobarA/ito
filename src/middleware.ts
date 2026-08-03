import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

/**
 * El middleware corre en Edge, donde Prisma no está disponible: por eso usa solo
 * `authConfig` (sin proveedores ni adaptador) y valida la sesión desde el JWT.
 */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
