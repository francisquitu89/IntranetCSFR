import { useState } from "react";
import { authService } from "../services/authService";
import type { Usuario } from "../types";

type LoginPageProps = {
  onLogin: (usuario: Usuario) => void;
};

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authService.login(email, password);
      if (result?.user) {
        onLogin({
          id: result.user.id,
          email: result.user.email,
          nombre: result.user.user_metadata?.nombre ?? "Usuario",
          rol: result.user.user_metadata?.rol ?? "funcionario",
          created_at: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-content hero" style={{ minHeight: "calc(100vh - 5rem)" }}>
      <div className="container-max hero-grid" style={{ alignItems: "center" }}>
        <section className="hero-panel hero-panel-logo">
          <img
            src="https://i.postimg.cc/QdNh7rhG/1.png"
            alt="Logo del colegio"
            className="start-logo"
            style={{ width: "min(24rem, 82vw)", alignSelf: "center", marginBottom: "0.75rem" }}
          />
          <span className="eyebrow">Acceso seguro</span>
          <h1 className="hero-title" style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)" }}>Intranet de CSFR</h1>
          <p className="hero-copy">
            Entra para gestionar reservas, tickets y soporte desde una interfaz clara, moderna y rápida.
          </p>
        </section>

        <section className="auth-card form-card">
          <div style={{ marginBottom: "1.2rem" }}>
            <h2 className="section-title" style={{ marginBottom: "0.25rem" }}>Iniciar sesión</h2>
            <p className="section-subtitle">Usa tu correo y contraseña de prueba.</p>
          </div>

          <form onSubmit={handleSubmit} className="field-grid">
            <div className="field">
              <label>Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                className="input"
              />
            </div>

            <div className="field">
              <label>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="input"
              />
            </div>

            {error && <div className="alert">{error}</div>}

            <button type="submit" disabled={loading} className="button" style={{ width: "100%" }}>
              {loading ? "Iniciando..." : "Entrar"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
