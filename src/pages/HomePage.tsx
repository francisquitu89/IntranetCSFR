import { useEffect, useState } from "react";
import { useNavigation } from "../contexts/NavigationContext";
import type { Usuario } from "../types";
import { Calendar, AlertCircle, Building2 } from "lucide-react";

interface HomePageProps {
  usuario: Usuario | null;
}

export function HomePage({ usuario }: HomePageProps) {
  const { navigate } = useNavigation();
  const [showPasswordReminder, setShowPasswordReminder] = useState(false);

  useEffect(() => {
    const needsChange = localStorage.getItem("ssff_temp_user_needs_pwd_change");
    if (needsChange === "true") {
      setShowPasswordReminder(true);
    }
  }, []);

  const handlePasswordReminderDismiss = () => {
    setShowPasswordReminder(false);
    localStorage.removeItem("ssff_temp_user_needs_pwd_change");
  };

  const handleGoToChangePassword = () => {
    navigate("cambiar-contrasena");
    handlePasswordReminderDismiss();
  };

  if (!usuario) {
    return (
      <main className="app-content hero">
        <div className="container-max hero-grid">
          <section className="hero-panel hero-panel-logo" style={{ textAlign: "center" }}>
            <img
              src="https://i.postimg.cc/QdNh7rhG/1.png"
              alt="Logo del colegio"
              className="start-logo"
              style={{ width: "min(24rem, 82vw)", alignSelf: "center", marginBottom: "0.75rem" }}
            />
            <span className="eyebrow">Portal interno · Reservas · Soporte</span>
            <h1 className="hero-title">Intranet de CSFR</h1>
            <p className="hero-copy">
              Una plataforma clara y rápida para gestionar reservas,
              coordinar soporte y mantener la operación del colegio con una
              interfaz moderna y de colores institucionales.
            </p>
            <div className="hero-actions">
              <button type="button" className="button" onClick={() => navigate("login")}>Entrar ahora</button>
            </div>
          </section>

          <aside className="hero-side">
            <div className="mini-card">
              <h3>Reservas de espacios</h3>
              <p className="muted">Auditorios, salas y equipos en un solo lugar.</p>
            </div>
            <div className="mini-card">
              <h3>Tickets de soporte</h3>
              <p className="muted">Solicitudes clasificadas por prioridad y categoría.</p>
            </div>
            <div className="mini-card">
              <h3>Notificaciones automáticas</h3>
              <p className="muted">Confirmaciones y seguimiento por correo.</p>
            </div>
          </aside>
        </div>
      </main>
    );
  }

  return (
    <main className="app-content hero">
      {showPasswordReminder && (
        <div className="alert" style={{ backgroundColor: "rgba(255, 193, 7, 0.1)", borderLeft: "4px solid #ffc107", margin: "1rem auto", maxWidth: "55rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
            <div>
              <strong style={{ color: "#ffc107" }}>⚠️ Recordatorio de seguridad</strong>
              <p className="muted" style={{ marginTop: "0.25rem", marginBottom: 0 }}>Cambia tu contraseña temporal por una más segura.</p>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
              <button onClick={handleGoToChangePassword} className="button" style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}>Cambiar ahora</button>
              <button onClick={handlePasswordReminderDismiss} className="button-secondary" style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}>Recordar después</button>
            </div>
          </div>
        </div>
      )}
      <div className="container-max">
        <section className="hero-panel hero-panel-logo" style={{ marginBottom: "1.25rem" }}>
          <img
            src="https://i.postimg.cc/QdNh7rhG/1.png"
            alt="Logo del colegio"
            className="start-logo"
            style={{ width: "min(24rem, 82vw)", alignSelf: "center", marginBottom: "0.75rem" }}
          />
          <span className="eyebrow">Bienvenido</span>
          <h1 className="hero-title" style={{ fontSize: "clamp(2.1rem, 4vw, 3.4rem)" }}>Intranet de CSFR</h1>
          <p className="hero-copy">
            {usuario.rol === "admin" || usuario.rol === "director" || usuario.rol === "funcionario"
              ? "Panel de Administración"
              : "Portal de Reservas y Soporte"}
          </p>
          <div className="hero-actions">
            {(usuario.rol === "admin" || usuario.rol === "director" || usuario.rol === "funcionario") && (
              <button type="button" className="button" onClick={() => navigate("admin")}>Abrir Admin</button>
            )}
          </div>
        </section>

        <section className="section">
          <div className="section-title-wrap">
            <div>
              <h2 className="section-title">Accesos principales</h2>
              <p className="section-subtitle">Las rutas más usadas están aquí arriba para que no tengas que buscar nada.</p>
            </div>
          </div>

          <div className="grid-3">
            <div className="feature-card" onClick={() => navigate("reservas")} style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="feature-icon blue"><Calendar size={22} /></div>
              <div>
                <h3 className="card-title">Reservas</h3>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <span style={{ color: "#1e293b", fontSize: "1.75rem", lineHeight: "1.2", flexShrink: 0, fontWeight: "bold" }}>•</span>
                  <p className="muted" style={{ margin: 0, lineHeight: "1.5" }}>Gestiona salas y equipos del colegio con confirmación automática.</p>
                </div>
              </div>
            </div>

            <div className="feature-card" onClick={() => navigate("tickets")} style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="feature-icon orange"><AlertCircle size={22} /></div>
              <div>
                <h3 className="card-title">Tickets</h3>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginTop: "0.5rem" }}>
                  <span style={{ color: "#1e293b", fontSize: "1.75rem", lineHeight: "1.2", flexShrink: 0, fontWeight: "bold" }}>•</span>
                  <p className="muted" style={{ margin: 0, lineHeight: "1.5" }}>Crea solicitudes de soporte con prioridad y categoría clara.</p>
                </div>
              </div>
            </div>

            {(usuario.rol === "admin" || usuario.rol === "director" || usuario.rol === "funcionario") && (
              <div className="feature-card" onClick={() => navigate("admin")} style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="feature-icon green"><Building2 size={22} /></div>
                <div>
                  <h3 className="card-title">Administración</h3>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginTop: "0.5rem" }}>
                    <span style={{ color: "#1e293b", fontSize: "1.75rem", lineHeight: "1.2", flexShrink: 0, fontWeight: "bold" }}>•</span>
                    <p className="muted" style={{ margin: 0, lineHeight: "1.5" }}>Panel para supervisar usuarios, reservas y tickets.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="section">
          <div className="section-title-wrap">
            <div>
              <h2 className="section-title">Acerca de SSFF Intranet</h2>
              <p className="section-subtitle">Una interfaz más moderna, legible y rápida para el trabajo diario.</p>
            </div>
          </div>

          <div className="grid-2">
            <div className="stat-card">
              <div className="stat-icon blue"><Calendar size={22} /></div>
              <h3 className="card-title">Sistema de Reservas</h3>
              <p className="muted">Reserva fácilmente salas y equipos. Recibe confirmación por correo automáticamente.</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon orange"><AlertCircle size={22} /></div>
              <h3 className="card-title">Sistema de Tickets</h3>
              <p className="muted">Reporta incidencias con prioridades y categorías para una mejor gestión.</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon green"><Building2 size={22} /></div>
              <h3 className="card-title">Colaboración</h3>
              <p className="muted">Comunicación más directa entre profesores, funcionarios y administración.</p>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple"><Building2 size={22} /></div>
              <h3 className="card-title">Transparencia</h3>
              <p className="muted">Visibilidad clara sobre el estado de reservas y tickets.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
