import { useState } from "react";
import { authService } from "../services/authService";
import { useNavigation } from "../contexts/NavigationContext";

export function RegistroPage({ onRegistroSuccess }: { onRegistroSuccess?: () => void }) {
  const { navigate } = useNavigation();
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    password: "",
    confirmPassword: "",
    rol: "profesor",
    departamento: "",
    telefono: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      await authService.registroUsuario(
        formData.email,
        formData.password,
        formData.nombre,
        formData.rol as "admin" | "profesor" | "funcionario" | "director" | "servicios_generales",
        formData.departamento,
        formData.telefono
      );
      if (onRegistroSuccess) {
        onRegistroSuccess();
      } else {
        navigate("login");
      }
    } catch (err: any) {
      setError(err.message || "Error al registrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-content hero" style={{ minHeight: "calc(100vh - 5rem)" }}>
      <div className="container-max hero-grid" style={{ alignItems: "start" }}>
        <section className="hero-panel">
          <span className="eyebrow">Crear acceso</span>
          <h1 className="hero-title" style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)" }}>Registro</h1>
          <p className="hero-copy">
            Crea una cuenta temporal para probar el flujo de reservas y tickets.
          </p>
        </section>

        <section className="auth-card form-card">
          <h2 className="section-title" style={{ marginBottom: "0.25rem" }}>Nueva cuenta</h2>
          <p className="section-subtitle">Completa los datos para entrar al portal.</p>

          <form onSubmit={handleSubmit} className="field-grid" style={{ marginTop: "1rem" }}>
            <div className="field">
              <label>Nombre</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required className="input" />
            </div>

            <div className="field">
              <label>Correo electrónico</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className="input" />
            </div>

            <div className="field-grid two">
              <div className="field">
                <label>Rol</label>
                <select name="rol" value={formData.rol} onChange={handleChange} className="select">
                  <option value="profesor">Profesor</option>
                  <option value="funcionario">Funcionario</option>
                  <option value="servicios_generales">Servicios Generales</option>
                  <option value="director">Director</option>
                </select>
              </div>

              <div className="field">
                <label>Teléfono</label>
                <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} className="input" />
              </div>
            </div>

            <div className="field">
              <label>Departamento</label>
              <input type="text" name="departamento" value={formData.departamento} onChange={handleChange} className="input" />
            </div>

            <div className="field-grid two">
              <div className="field">
                <label>Contraseña</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required className="input" />
              </div>

              <div className="field">
                <label>Confirmar contraseña</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="input" />
              </div>
            </div>

            {error && <div className="alert">{error}</div>}

            <button type="submit" disabled={loading} className="button" style={{ width: "100%" }}>
              {loading ? "Registrando..." : "Registrarse"}
            </button>

            <p className="section-subtitle" style={{ marginTop: "0.5rem", textAlign: "center" }}>
              ¿Ya tienes cuenta? <button type="button" onClick={() => navigate("login")} style={{ color: "#7dd3fc", fontWeight: 700, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Inicia sesión</button>
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
