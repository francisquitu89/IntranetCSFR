import { supabase } from "../lib/supabase";
import type { Usuario } from "../types";

export const authService = {
  // Registro de usuario
  async registroUsuario(
    email: string,
    password: string,
    nombre: string,
    rol: "admin" | "profesor" | "funcionario" | "director",
    departamento?: string,
    telefono?: string
  ): Promise<{ usuario: Usuario; sesion: any }> {
    const { data: authData, error: authError } =
      await supabase.auth.signUp({
        email,
        password,
      });

    if (authError) throw authError;

    if (!authData.user) throw new Error("Error en registro de usuario");

    const { data: usuarioData, error: usuarioError } = await supabase
      .from("usuarios")
      .insert({
        id: authData.user.id,
        email,
        nombre,
        rol,
        departamento,
        telefono,
      })
      .select()
      .single();

    if (usuarioError) throw usuarioError;

    return {
      usuario: usuarioData,
      sesion: authData.session,
    };
  },

  // Login
  async login(email: string, password: string): Promise<any> {
    // TEMPORARY: authenticate against `usuarios` table (INSECURE - for local testing only)
    const { data, error } = await supabase
      .from("usuarios")
      .select("id,email,nombre,password,rol")
      .eq("email", email)
      .single();

    if (error || !data) throw new Error("Invalid login credentials");
    if (data.password !== password) throw new Error("Invalid login credentials");

    return {
      user: { id: data.id, email: data.email, user_metadata: { nombre: data.nombre, rol: data.rol } },
      session: null,
    };
  },

  // Logout
  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Obtener usuario actual
  async usuarioActual(): Promise<Usuario | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) throw error;
    return data;
  },

  // Obtener sesión actual
  async obtenerSesion(): Promise<any> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  },

  // Cambiar contraseña
  async cambiarContrasenaTemporal(
    usuarioId: string,
    passwordActual: string,
    nuevoPassword: string
  ): Promise<void> {
    const { data, error } = await supabase
      .from("usuarios")
      .select("id,password")
      .eq("id", usuarioId)
      .single();

    if (error || !data) throw new Error("No se pudo validar el usuario");
    if (data.password !== passwordActual) throw new Error("La contraseña actual no coincide");

    const { error: updateError } = await supabase
      .from("usuarios")
      .update({ password: nuevoPassword })
      .eq("id", usuarioId);

    if (updateError) throw updateError;
  },

  // Cambiar contraseña temporal desde admin
  async cambiarContrasenaTemporalAdmin(usuarioId: string, nuevoPassword: string): Promise<void> {
    const { error } = await supabase
      .from("usuarios")
      .update({ password: nuevoPassword })
      .eq("id", usuarioId);

    if (error) throw error;
  },
};
