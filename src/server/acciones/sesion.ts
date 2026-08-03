"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

export interface EstadoIngreso {
  error?: string;
}

export async function ingresar(
  _estadoPrevio: EstadoIngreso,
  datos: FormData,
): Promise<EstadoIngreso> {
  const email = String(datos.get("email") ?? "").trim();
  const password = String(datos.get("password") ?? "");

  if (!email || !password) {
    return { error: "Ingresa tu correo y tu contraseña." };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/panel" });
    return {};
  } catch (error) {
    // signIn lanza un redirect cuando las credenciales son correctas: hay que
    // dejarlo propagar para que Next haga la navegación.
    if (error instanceof AuthError) {
      return { error: "Correo o contraseña incorrectos, o la cuenta está desactivada." };
    }
    throw error;
  }
}

export async function cerrarSesion() {
  await signOut({ redirectTo: "/iniciar-sesion" });
}
