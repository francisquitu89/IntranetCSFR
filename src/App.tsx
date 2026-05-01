import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Navigation } from "./components/Navigation";
import { BackButton } from "./components/BackButton";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegistroPage } from "./pages/RegistroPage";
import { ReservasPage } from "./pages/ReservasPage";
import { TicketsPage } from "./pages/TicketsPage";
import { AdminPage } from "./pages/AdminPage";
import { CambiarContrasenaPage } from "./pages/CambiarContrasenaPage";
import { authService } from "./services/authService";
import type { Usuario } from "./types";
import "./App.css";

function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("ssff_temp_user");
    if (storedUser) {
      try {
        setUsuario(JSON.parse(storedUser) as Usuario);
      } catch {
        localStorage.removeItem("ssff_temp_user");
      }
    }

    verificarSesion();
  }, []);

  const verificarSesion = async () => {
    try {
      const sesion = await authService.obtenerSesion();
      if (sesion) {
        const user = await authService.usuarioActual();
        setUsuario(user);
      }
    } catch (error) {
      console.log("No hay sesión activa");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (nuevoUsuario: Usuario) => {
    setUsuario(nuevoUsuario);
    localStorage.setItem("ssff_temp_user", JSON.stringify(nuevoUsuario));
    localStorage.setItem("ssff_temp_user_needs_pwd_change", "true");
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      setUsuario(null);
      localStorage.removeItem("ssff_temp_user");
    }
  };

  const canViewAdmin = usuario?.rol === "admin" || usuario?.rol === "director";

  if (loading) {
    return (
      <div className="app-shell">
        <div
          className="app-content"
          style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}
        >
          <div
            className="form-card"
            style={{ textAlign: "center", minWidth: "min(92vw, 22rem)" }}
          >
            <div className="avatar" style={{ margin: "0 auto 1rem" }}>
              SS
            </div>
            <p className="muted">Cargando la intranet...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-shell">
        <Navigation />
        <BackButton />
        {usuario && (
          <div className="container-max" style={{ paddingTop: "1rem" }}>
            <div className="top-actions-bar">
              <button type="button" className="button-secondary" onClick={() => void handleLogout()}>
                Cerrar sesión
              </button>
              <RoutePathHint usuario={usuario} />
            </div>
          </div>
        )}
        <div className="app-content">
          <Routes>
            <Route path="/" element={<HomePage usuario={usuario} />} />
            <Route
              path="/login"
              element={usuario ? <Navigate to="/" replace /> : <LoginPage onLogin={handleLogin} />}
            />
            <Route
              path="/registro"
              element={usuario ? <Navigate to="/" replace /> : <RegistroPage />}
            />
            <Route
              path="/reservas"
              element={usuario ? <ReservasPage usuario={usuario} /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/tickets"
              element={usuario ? <TicketsPage usuario={usuario} /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/admin"
              element={usuario && canViewAdmin ? <AdminPage usuario={usuario} /> : <Navigate to="/" replace />}
            />
            <Route
              path="/cambiar-contrasena"
              element={usuario ? <CambiarContrasenaPage usuario={usuario} /> : <Navigate to="/login" replace />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

function RoutePathHint({ usuario }: { usuario: Usuario }) {
  return (
    <div className="muted" style={{ textAlign: "right" }}>
      {usuario.nombre} · {usuario.rol}
    </div>
  );
}
