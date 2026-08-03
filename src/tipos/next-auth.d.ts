import type { RolGlobal } from "@/lib/permisos";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    rolGlobal: RolGlobal;
    clienteId?: string | null;
    nombreCompleto?: string;
  }

  interface Session {
    user: {
      id: string;
      rolGlobal: RolGlobal;
      clienteId?: string | null;
      nombreCompleto?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    rolGlobal: RolGlobal;
    clienteId?: string | null;
    nombreCompleto?: string;
  }
}
