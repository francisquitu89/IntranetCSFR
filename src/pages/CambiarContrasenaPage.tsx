import { useState } from "react";
import { useNavigation } from "../contexts/NavigationContext";
import { authService } from "../services/authService";
import type { Usuario } from "../types";

interface CambiarContrasenaPageProps {
  usuario: Usuario | null;
}

export function CambiarContrasenaPage({ usuario }: CambiarContrasenaPageProps) {
  const { navigate } = useNavigation();
  const [formData, setFormData] = useState({
    passwordActual: "",
    nuevaPassword: "",
    confirmarPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  if (!usuario) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.nuevaPassword.length < 4) {
      setError("La nueva contraseña debe tener al menos 4 caracteres.");
      return;
    }

    if (formData.nuevaPassword !== formData.confirmarPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    try {
      await authService.cambiarContrasenaTemporal(
        usuario.id,
        formData.passwordActual,
        formData.nuevaPassword
      );

      setSuccess("Contraseña actualizada correctamente.");
      setFormData({ passwordActual: "", nuevaPassword: "", confirmarPassword: "" });
      setTimeout(() => navigate("home"), 1200);
    } catch (err: any) {
      setError(err.message || "No se pudo cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-content hero" style={{ minHeight: "calc(100vh - 5rem)" }}>
      <div className="container-max hero-grid" style={{ alignItems: "center" }}>
        <section className="hero-panel">
          <span className="eyebrow">Seguridad</span>
          <h1 className="hero-title" style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)" }}>Cambiar contraseña</h1>
          <p className="hero-copy">
            {usuario.nombre}, aquí puedes actualizar la contraseña temporal que usas para entrar.
          </p>
          <div className="hero-actions">
            <button type="button" className="button-secondary" onClick={() => navigate("home")}>Volver al inicio</button>
          </div>
        </section>

        <section className="auth-card form-card">
          <h2 className="section-title" style={{ marginBottom: "0.25rem" }}>Nueva contraseña</h2>
          <p className="section-subtitle">Ingresa tu contraseña actual y define una nueva.</p>

          <form onSubmit={handleSubmit} className="field-grid" style={{ marginTop: "1rem" }}>
            <div className="field">
              <label>Contraseña actual</label>
              <input
                type="password"
                value={formData.passwordActual}
                onChange={(e) => setFormData({ ...formData, passwordActual: e.target.value })}
                required
                className="input"
              />
            </div>

            <div className="field">
              <label>Nueva contraseña</label>
              <input
                type="password"
                value={formData.nuevaPassword}
                onChange={(e) => setFormData({ ...formData, nuevaPassword: e.target.value })}
                required
                className="input"
              />
            </div>

            <div className="field">
              <label>Confirmar nueva contraseña</label>
              <input
                type="password"
                value={formData.confirmarPassword}
                onChange={(e) => setFormData({ ...formData, confirmarPassword: e.target.value })}
                required
                className="input"
              />
            </div>

            {error && <div className="alert">{error}</div>}
            {success && <div className="empty-state">{success}</div>}

            <button type="submit" disabled={loading} className="button" style={{ width: "100%" }}>
              {loading ? "Actualizando..." : "Guardar contraseña"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
