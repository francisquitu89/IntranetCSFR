import { useState, useEffect } from "react";
import { BackButton } from "./components/BackButton";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegistroPage } from "./pages/RegistroPage";
import { ReservasPage } from "./pages/ReservasPage";
import { TicketsPage } from "./pages/TicketsPage";
import { AdminPage } from "./pages/AdminPage";
import { CambiarContrasenaPage } from "./pages/CambiarContrasenaPage";
import { NavigationProvider, useNavigation } from "./contexts/NavigationContext";
import { authService } from "./services/authService";
import type { Usuario } from "./types";
import "./App.css";

function AppContent() {
  const { currentPage, navigate } = useNavigation();
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
        navigate("home");
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
    navigate("home");
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      setUsuario(null);
      localStorage.removeItem("ssff_temp_user");
      navigate("login");
    }
  };

  const canViewAdmin = usuario?.rol === "admin" || usuario?.rol === "director" || usuario?.rol === "funcionario";

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

  // Renderizar página según currentPage
  let pageComponent = null;

  if (!usuario) {
    // Si no hay usuario, mostrar login o registro
    if (currentPage === "registro") {
      pageComponent = <RegistroPage onRegistroSuccess={() => navigate("login")} />;
    } else {
      pageComponent = <LoginPage onLogin={handleLogin} />;
    }
  } else {
    // Si hay usuario autenticado
    switch (currentPage) {
      case "home":
        pageComponent = <HomePage usuario={usuario} />;
        break;
      case "reservas":
        pageComponent = <ReservasPage usuario={usuario} />;
        break;
      case "tickets":
        pageComponent = <TicketsPage usuario={usuario} />;
        break;
      case "admin":
        pageComponent = canViewAdmin ? (
          <AdminPage usuario={usuario} />
        ) : (
          <HomePage usuario={usuario} />
        );
        break;
      case "cambiar-contrasena":
        pageComponent = <CambiarContrasenaPage usuario={usuario} />;
        break;
      default:
        pageComponent = <HomePage usuario={usuario} />;
    }
  }

  return (
    <div className="app-shell">
      <BackButton />
      {usuario && (
        <div className="container-max" style={{ paddingTop: "1rem" }}>
          <div className="top-actions-bar">
            <button type="button" className="button-secondary" onClick={() => void handleLogout()}>
              Cerrar sesión
            </button>
            <div className="muted" style={{ textAlign: "right" }}>
              {usuario.nombre} · {usuario.rol}
            </div>
          </div>
        </div>
      )}
      <div className="app-content">
        {pageComponent}
      </div>
    </div>
  );
}

function App() {
  return (
    <NavigationProvider>
      <AppContent />
    </NavigationProvider>
  );
}

export default App;
