import { useState, useEffect } from "react";
import { CheckCircle, XCircle, User, AlertCircle } from "lucide-react";
import { ticketsService } from "../services/ticketsService";
import { supabase } from "../lib/supabase";
import type { Ticket, Usuario } from "../types";

interface TicketApprovalPanelProps {
  usuario: Usuario | null;
}

// Configuración de aprobadores
const ELENA_EMAIL = "ependas@csfr.cl"; // Elena - Aprobadora general
const MAURICIO_EMAIL = "marias@csfr.cl"; // Mauricio - Admin/Finanzas
const SERVICIOS_EMAIL = "servicios@csfr.cl"; // CC de servicios

export function TicketApprovalPanel({ usuario }: TicketApprovalPanelProps) {
  const [ticketsPendientes, setTicketsPendientes] = useState<Ticket[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [procesando, setProcesando] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [selectedResponsable, setSelectedResponsable] = useState<{ [key: string]: string }>({});
  const [razonRechazo, setRazonRechazo] = useState<{ [key: string]: string }>({});
  const [mostrarRechazo, setMostrarRechazo] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    cargarTicketsPendientes();
    cargarUsuarios();
  }, [usuario]);

  const cargarTicketsPendientes = async () => {
    try {
      setLoading(true);
      const data = await ticketsService.obtenerTicketsPendientesAprobacion();
      
      // Filtrar según la categoría y el rol del usuario
      let ticketsFiltrados = data;
      
      if (usuario?.rol === "funcionario" || usuario?.rol === "admin" || usuario?.rol === "director" || usuario?.rol === "administrativo") {
        // Elena ve todos excepto Admin/Finanzas
        if (usuario.email === ELENA_EMAIL || usuario.email === SERVICIOS_EMAIL) {
          ticketsFiltrados = data.filter(
            (t) => t.categoria !== "Requerimientos Administración y finanzas"
          );
        }
        // Mauricio solo ve Admin/Finanzas
        else if (usuario.email === MAURICIO_EMAIL) {
          ticketsFiltrados = data.filter(
            (t) => t.categoria === "Requerimientos Administración y finanzas"
          );
        }
      }
      
      setTicketsPendientes(ticketsFiltrados);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .in("rol", ["funcionario", "admin", "director", "administrativo", "servicios_generales"])
        .order("nombre", { ascending: true });

      if (error) throw error;
      setUsuarios((data || []) as Usuario[]);
    } catch (err: any) {
      console.error("Error cargando usuarios:", err);
    }
  };

  const handleAprobar = async (ticketId: string) => {
    const responsableId = selectedResponsable[ticketId];
    
    if (!responsableId) {
      alert("Debes seleccionar un responsable");
      return;
    }

    try {
      setProcesando(ticketId);
      await ticketsService.aprobarTicket(ticketId, usuario?.id || "", responsableId);
      await cargarTicketsPendientes();
      setSelectedResponsable((prev) => {
        const newState = { ...prev };
        delete newState[ticketId];
        return newState;
      });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcesando(null);
    }
  };

  const handleRechazar = async (ticketId: string) => {
    const razon = razonRechazo[ticketId];
    
    if (!razon || razon.trim() === "") {
      alert("Debes ingresar una razón para rechazar");
      return;
    }

    try {
      setProcesando(ticketId);
      await ticketsService.rechazarTicket(ticketId, usuario?.id || "", razon);
      await cargarTicketsPendientes();
      setRazonRechazo((prev) => {
        const newState = { ...prev };
        delete newState[ticketId];
        return newState;
      });
      setMostrarRechazo((prev) => {
        const newState = { ...prev };
        delete newState[ticketId];
        return newState;
      });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcesando(null);
    }
  };

  if (!usuario || (usuario.email !== ELENA_EMAIL && usuario.email !== MAURICIO_EMAIL && usuario.email !== SERVICIOS_EMAIL)) {
    return null;
  }

  if (loading) {
    return (
      <section style={{ marginBottom: "2rem", padding: "2rem", textAlign: "center" }}>
        <p>Cargando tickets pendientes...</p>
      </section>
    );
  }

  return (
    <section style={{ marginBottom: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <div style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <AlertCircle size={22} color="white" />
        </div>
        <div>
          <h2 style={{ margin: "0", fontSize: "1.5rem", fontWeight: "700", color: "#1e293b" }}>
            Aprobación de Tickets
          </h2>
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "#64748b" }}>
            Tickets pendientes de aprobación ({ticketsPendientes.length})
          </p>
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: "#fee2e2",
          border: "1px solid #fecaca",
          color: "#991b1b",
          padding: "1rem",
          borderRadius: "0.5rem",
          marginBottom: "1rem",
        }}>
          {error}
        </div>
      )}

      {ticketsPendientes.length === 0 ? (
        <div style={{
          backgroundColor: "#ecfdf5",
          border: "2px dashed #86efac",
          padding: "2rem",
          borderRadius: "0.75rem",
          textAlign: "center",
          color: "#166534",
        }}>
          <CheckCircle size={40} style={{ margin: "0 auto 0.75rem", opacity: 0.5 }} />
          <p style={{ margin: "0", fontWeight: "500" }}>
            No hay tickets pendientes de aprobación
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {ticketsPendientes.map((ticket) => (
            <div
              key={ticket.id}
              style={{
                backgroundColor: "#ffffff",
                borderLeft: "4px solid #8b5cf6",
                padding: "1.5rem",
                borderRadius: "0.75rem",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <h3 style={{ margin: "0 0 0.5rem 0", color: "#1e293b", fontSize: "1.1rem" }}>
                    Ticket #{ticket.id.slice(0, 8).toUpperCase()}
                  </h3>
                  <p style={{ margin: "0 0 0.5rem 0", color: "#475569", fontSize: "0.9rem" }}>
                    <strong>Asunto:</strong> {ticket.asunto}
                  </p>
                  <p style={{ margin: "0 0 0.5rem 0", color: "#475569", fontSize: "0.9rem" }}>
                    <strong>Categoría:</strong> {ticket.categoria}
                  </p>
                  <p style={{ margin: "0 0 0.5rem 0", color: "#475569", fontSize: "0.9rem" }}>
                    <strong>Prioridad:</strong> {ticket.prioridad}
                  </p>
                  <p style={{ margin: "0", color: "#64748b", fontSize: "0.85rem" }}>
                    <strong>Usuario:</strong> {ticket.usuario_nombre} ({ticket.usuario_email})
                  </p>
                </div>
              </div>

              <p style={{ margin: "1rem 0", color: "#1e293b", lineHeight: "1.5" }}>
                {ticket.descripcion}
              </p>

              {/* Seleccionar Responsable */}
              <div style={{ marginBottom: "1.5rem", padding: "1rem", backgroundColor: "#f8fafc", borderRadius: "0.5rem" }}>
                <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#1e293b", fontSize: "0.9rem" }}>
                  <User size={16} style={{ display: "inline", marginRight: "0.5rem" }} />
                  Asignar Responsable:
                </label>
                <select
                  value={selectedResponsable[ticket.id] || ""}
                  onChange={(e) =>
                    setSelectedResponsable((prev) => ({
                      ...prev,
                      [ticket.id]: e.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: "0.375rem",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.9rem",
                    fontFamily: "inherit",
                  }}
                >
                  <option value="">-- Seleccionar Responsable --</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Botones de Acción */}
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                <button
                  onClick={() => handleAprobar(ticket.id)}
                  disabled={procesando === ticket.id || !selectedResponsable[ticket.id]}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 1.25rem",
                    backgroundColor: selectedResponsable[ticket.id] ? "#22c55e" : "#d1d5db",
                    color: "white",
                    border: "none",
                    borderRadius: "0.375rem",
                    fontWeight: "600",
                    cursor: selectedResponsable[ticket.id] ? "pointer" : "not-allowed",
                    opacity: procesando === ticket.id ? 0.6 : 1,
                    transition: "all 0.2s",
                  }}
                >
                  <CheckCircle size={18} />
                  {procesando === ticket.id ? "Aprobando..." : "Aprobar"}
                </button>

                <button
                  onClick={() =>
                    setMostrarRechazo((prev) => ({
                      ...prev,
                      [ticket.id]: !prev[ticket.id],
                    }))
                  }
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.75rem 1.25rem",
                    backgroundColor: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "0.375rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "#dc2626";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "#ef4444";
                  }}
                >
                  <XCircle size={18} />
                  {mostrarRechazo[ticket.id] ? "Cancelar Rechazo" : "Rechazar"}
                </button>
              </div>

              {/* Razón de Rechazo */}
              {mostrarRechazo[ticket.id] && (
                <div style={{ padding: "1rem", backgroundColor: "#fee2e2", borderRadius: "0.5rem", marginBottom: "1rem" }}>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600", color: "#991b1b", fontSize: "0.9rem" }}>
                    Razón del Rechazo:
                  </label>
                  <textarea
                    value={razonRechazo[ticket.id] || ""}
                    onChange={(e) =>
                      setRazonRechazo((prev) => ({
                        ...prev,
                        [ticket.id]: e.target.value,
                      }))
                    }
                    placeholder="Explica por qué se rechaza este ticket..."
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      borderRadius: "0.375rem",
                      border: "1px solid #fca5a5",
                      fontSize: "0.9rem",
                      fontFamily: "inherit",
                      minHeight: "100px",
                      resize: "vertical",
                    }}
                  />
                  <button
                    onClick={() => handleRechazar(ticket.id)}
                    disabled={procesando === ticket.id || !razonRechazo[ticket.id]}
                    style={{
                      marginTop: "0.75rem",
                      padding: "0.75rem 1.25rem",
                      backgroundColor: razonRechazo[ticket.id] ? "#dc2626" : "#fca5a5",
                      color: "white",
                      border: "none",
                      borderRadius: "0.375rem",
                      fontWeight: "600",
                      cursor: razonRechazo[ticket.id] ? "pointer" : "not-allowed",
                      opacity: procesando === ticket.id ? 0.6 : 1,
                      transition: "all 0.2s",
                    }}
                  >
                    {procesando === ticket.id ? "Rechazando..." : "Confirmar Rechazo"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
