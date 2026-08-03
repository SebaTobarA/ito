import { describe, expect, it } from "vitest";

import { puede, veTodosLosProyectos, type UsuarioSesion } from "@/lib/permisos";

const admin: UsuarioSesion = { id: "u1", rolGlobal: "ADMIN" };
const subgerente: UsuarioSesion = { id: "u2", rolGlobal: "SUBGERENTE" };
const jefe: UsuarioSesion = { id: "u3", rolGlobal: "JEFE_PROYECTO" };
const ito: UsuarioSesion = { id: "u4", rolGlobal: "ITO" };
const cliente: UsuarioSesion = { id: "u5", rolGlobal: "CLIENTE", clienteId: "c1" };

describe("permisos globales", () => {
  it("el administrador puede todo", () => {
    expect(puede(admin, "empresa.configurar")).toBe(true);
    expect(puede(admin, "plantilla.gestionar")).toBe(true);
    expect(puede(admin, "usuario.gestionar")).toBe(true);
    expect(puede(admin, "cliente.eliminar")).toBe(true);
  });

  it("solo el administrador gestiona usuarios, plantillas y la marca", () => {
    for (const usuario of [subgerente, jefe, ito]) {
      expect(puede(usuario, "usuario.gestionar")).toBe(false);
      expect(puede(usuario, "plantilla.gestionar")).toBe(false);
      expect(puede(usuario, "empresa.configurar")).toBe(false);
    }
  });

  it("el ITO no crea proyectos ni clientes", () => {
    expect(puede(ito, "proyecto.crear")).toBe(false);
    expect(puede(ito, "cliente.crear")).toBe(false);
  });

  it("sin sesión no se puede nada", () => {
    expect(puede(null, "proyecto.ver")).toBe(false);
    expect(puede(undefined, "item.ver")).toBe(false);
  });
});

describe("permisos sobre un proyecto", () => {
  it("un rol interno necesita estar asignado al proyecto", () => {
    expect(puede(ito, "item.editar", { rolesEnProyecto: [] })).toBe(false);
    expect(puede(ito, "item.editar", { rolesEnProyecto: ["ITO"] })).toBe(true);
  });

  it("el administrador no necesita asignación", () => {
    expect(puede(admin, "item.editar", { rolesEnProyecto: [] })).toBe(true);
  });

  it("la aprobación superior exige rol de subgerente en el proyecto", () => {
    expect(puede(subgerente, "ciclo.aprobarSuperior", { rolesEnProyecto: ["SUBGERENTE"] })).toBe(
      true,
    );
    expect(puede(subgerente, "ciclo.aprobarSuperior", { rolesEnProyecto: ["JEFE_PROYECTO"] })).toBe(
      false,
    );
  });

  it("el jefe de proyecto aprueba a nivel de jefatura, no a nivel superior", () => {
    expect(puede(jefe, "ciclo.aprobarJefatura", { rolesEnProyecto: ["JEFE_PROYECTO"] })).toBe(true);
    expect(puede(jefe, "ciclo.aprobarSuperior", { rolesEnProyecto: ["JEFE_PROYECTO"] })).toBe(false);
  });

  it("el ITO no aprueba ciclos", () => {
    expect(puede(ito, "ciclo.aprobarJefatura", { rolesEnProyecto: ["ITO"] })).toBe(false);
  });

  it("el observador solo lee", () => {
    expect(puede(jefe, "item.ver", { rolesEnProyecto: ["OBSERVADOR"] })).toBe(true);
    expect(puede(jefe, "item.editar", { rolesEnProyecto: ["OBSERVADOR"] })).toBe(false);
  });
});

// El rol CLIENTE está definido pero no habilitado en el MVP. Estas pruebas fijan
// el contrato para que el portal de cliente futuro no requiera rediseñar permisos.
describe("portal de cliente (rol definido, aún sin uso)", () => {
  it("solo lee proyectos de su propia empresa", () => {
    expect(puede(cliente, "proyecto.ver", { clienteId: "c1" })).toBe(true);
    expect(puede(cliente, "proyecto.ver", { clienteId: "c2" })).toBe(false);
  });

  it("nunca escribe", () => {
    expect(puede(cliente, "item.editar", { clienteId: "c1" })).toBe(false);
    expect(puede(cliente, "documento.subir", { clienteId: "c1" })).toBe(false);
    expect(puede(cliente, "proyecto.crear", { clienteId: "c1" })).toBe(false);
  });

  it("sin cliente asociado no ve nada", () => {
    const huerfano: UsuarioSesion = { id: "u6", rolGlobal: "CLIENTE", clienteId: null };
    expect(puede(huerfano, "proyecto.ver", { clienteId: "c1" })).toBe(false);
  });
});

describe("veTodosLosProyectos", () => {
  it("solo el administrador ve la cartera completa", () => {
    expect(veTodosLosProyectos(admin)).toBe(true);
    expect(veTodosLosProyectos(subgerente)).toBe(false);
    expect(veTodosLosProyectos(ito)).toBe(false);
  });
});
