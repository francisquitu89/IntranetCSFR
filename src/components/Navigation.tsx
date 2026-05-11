import type { Usuario } from "../types";
import type { Page } from "../contexts/NavigationContext";

interface NavigationProps {
  usuario: Usuario | null;
  onNavigate: (page: Page) => void;
}

export function Navigation({ usuario, onNavigate }: NavigationProps) {
  if (!usuario) {
    return null;
  }

  return (
    <nav style={{
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      padding: "0.75rem 0",
      borderBottom: "1px solid rgba(255,255,255,0.1)",
      position: "sticky",
      top: 0,
      zIndex: 100
    }}>
      <div className="container-max" style={{ display: "flex", gap: "1rem", alignItems: "center", justifyContent: "space-between" }}>
        <button
          type="button"
          onClick={() => onNavigate("home")}
          style={{
            background: "none",
            border: "none",
            color: "white",
            fontWeight: "bold",
            fontSize: "1.1rem",
            cursor: "pointer",
            padding: "0.5rem 0",
            transition: "opacity 0.2s"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          CSFR
        </button>
        
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => onNavigate("reservas")}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "white",
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              cursor: "pointer",
              fontSize: "0.875rem",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
          >
            Reservas
          </button>
          <button
            type="button"
            onClick={() => onNavigate("tickets")}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "white",
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              cursor: "pointer",
              fontSize: "0.875rem",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
          >
            Tickets
          </button>
          {(usuario.rol === "admin" || usuario.rol === "director" || usuario.rol === "funcionario") && (
            <button
              type="button"
              onClick={() => onNavigate("admin")}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "white",
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                cursor: "pointer",
                fontSize: "0.875rem",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
            >
              Admin
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigate("cambiar-contrasena")}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "white",
              padding: "0.5rem 1rem",
              borderRadius: "0.375rem",
              cursor: "pointer",
              fontSize: "0.875rem",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.3)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
          >
            Contraseña
          </button>
        </div>
      </div>
    </nav>
  );
}
