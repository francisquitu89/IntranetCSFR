import { useState, useEffect } from "react";
import { Bell, CheckCircle, AlertCircle, Clock, User } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";
import { ticketsService } from "../services/ticketsService";
import type { Ticket, Usuario } from "../types";

interface NotificationsWidgetProps {
  usuario: Usuario | null;
}

export function NotificationsWidget({ usuario }: NotificationsWidgetProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    cargarTicketsRecientes();
    // Recargar cada 30 segundos
    const interval = setInterval(cargarTicketsRecientes, 30000);
    return () => clearInterval(interval);
  }, [usuario]);

  const cargarTicketsRecientes = async () => {
    if (!usuario) return;
    try {
      setLoading(true);
      const data = await ticketsService.obtenerTicketsUsuario(usuario.id);
      // Mostrar solo los últimos 5 tickets
      setTickets(data.slice(0, 5));
    } catch (err) {
      console.error("Error cargando tickets:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case "Abierto":
        return <AlertCircle size={20} className="text-orange-500" />;
      case "En Progreso":
        return <Clock size={20} className="text-blue-500" />;
      case "Resuelto":
        return <CheckCircle size={20} className="text-green-500" />;
      case "Rechazado":
        return <AlertCircle size={20} className="text-red-500" />;
      default:
        return <Bell size={20} className="text-slate-500" />;
    }
  };

  const getStatusMessage = (ticket: Ticket) => {
    switch (ticket.estado) {
      case "Abierto":
        return "Tu ticket ha sido abierto exitosamente";
      case "En Progreso":
        return "Tu ticket está siendo gestionado";
      case "Resuelto":
        return "Tu ticket ha sido respondido/resuelto";
      case "Rechazado":
        return "Tu ticket ha sido rechazado";
      default:
        return "Tu ticket ha sido actualizado";
    }
  };

  const getStatusStyles = (estado: string) => {
    switch (estado) {
      case "Abierto":
        return {
          bg: "bg-white",
          border: "border-l-4 border-l-orange-500",
          badge: "bg-orange-100 text-orange-700",
        };
      case "En Progreso":
        return {
          bg: "bg-white",
          border: "border-l-4 border-l-blue-500",
          badge: "bg-blue-100 text-blue-700",
        };
      case "Resuelto":
        return {
          bg: "bg-white",
          border: "border-l-4 border-l-green-500",
          badge: "bg-green-100 text-green-700",
        };
      case "Rechazado":
        return {
          bg: "bg-white",
          border: "border-l-4 border-l-red-500",
          badge: "bg-red-100 text-red-700",
        };
      default:
        return {
          bg: "bg-white",
          border: "border-l-4 border-l-slate-500",
          badge: "bg-slate-100 text-slate-700",
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return `Hoy a las ${format(date, "HH:mm", { locale: es })}`;
    } else if (isYesterday(date)) {
      return `Ayer a las ${format(date, "HH:mm", { locale: es })}`;
    } else {
      return format(date, "dd MMM HH:mm", { locale: es });
    }
  };

  if (loading || tickets.length === 0) {
    return null;
  }

  const displayTickets = showAll ? tickets : tickets.slice(0, 3);

  return (
    <section style={{ marginBottom: "2.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <div style={{ 
          width: "40px", 
          height: "40px", 
          borderRadius: "50%", 
          background: "linear-gradient(135deg, #3b82f6 0%, #0ea5e9 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <Bell size={22} color="white" />
        </div>
        <div>
          <h2 style={{ margin: "0", fontSize: "1.5rem", fontWeight: "700", color: "#1e293b" }}>
            Notificaciones Recientes
          </h2>
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: "#64748b" }}>
            Estado actualizado de tus tickets
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {displayTickets.map((ticket) => {
          const styles = getStatusStyles(ticket.estado);
          return (
            <div
              key={ticket.id}
              style={{
                backgroundColor: "#ffffff",
                borderLeft: styles.border === "border-l-4 border-l-orange-500" ? "4px solid #f97316" :
                             styles.border === "border-l-4 border-l-blue-500" ? "4px solid #3b82f6" :
                             styles.border === "border-l-4 border-l-green-500" ? "4px solid #22c55e" :
                             styles.border === "border-l-4 border-l-red-500" ? "4px solid #ef4444" :
                             "4px solid #64748b",
                padding: "1rem",
                borderRadius: "0.75rem",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06)",
                transition: "all 0.3s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06)";
                (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
              }}
            >
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <div style={{ flexShrink: 0, marginTop: "0.25rem" }}>
                  {getStatusIcon(ticket.estado)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: "bold", color: "#1e293b", fontSize: "0.95rem", lineHeight: "1.4" }}>
                      Ticket #{ticket.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span 
                      className={styles.badge}
                      style={{ 
                        fontSize: "0.75rem", 
                        fontWeight: "600", 
                        padding: "0.25rem 0.75rem", 
                        borderRadius: "0.25rem",
                        display: "inline-block"
                      }}
                    >
                      {ticket.estado}
                    </span>
                  </div>

                  <p style={{ margin: "0.75rem 0", color: "#1e293b", lineHeight: "1.5", fontSize: "0.95rem", fontWeight: "500" }}>
                    {getStatusMessage(ticket)}
                  </p>

                  <p style={{ margin: "0.5rem 0 0.75rem 0", color: "#475569", fontSize: "0.9rem", lineHeight: "1.4" }}>
                    {ticket.asunto}
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {ticket.aprobado_por_nombre && (
                      <div style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "0.5rem", 
                        fontSize: "0.85rem", 
                        color: "#64748b",
                        padding: "0.5rem 0.75rem",
                        backgroundColor: "#f8fafc",
                        borderRadius: "0.375rem"
                      }}>
                        <User size={16} />
                        <span>
                          <strong style={{ color: "#1e293b" }}>Asignado a:</strong> {ticket.aprobado_por_nombre}
                        </span>
                      </div>
                    )}

                    {ticket.respuesta && (
                      <div style={{ 
                        fontSize: "0.85rem", 
                        color: "#475569",
                        padding: "0.75rem",
                        backgroundColor: "#f0fdf4",
                        borderRadius: "0.375rem",
                        borderLeft: "3px solid #22c55e",
                        lineHeight: "1.4"
                      }}>
                        <strong style={{ color: "#1e293b", display: "block", marginBottom: "0.25rem" }}>
                          Respuesta de {ticket.respondido_por_nombre || "Administrador"}:
                        </strong>
                        <p style={{ margin: "0", wordBreak: "break-word" }}>
                          {ticket.respuesta}
                        </p>
                      </div>
                    )}

                    <p style={{ margin: "0", color: "#94a3b8", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      📅 {formatDate(ticket.respondido_en || ticket.updated_at || ticket.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {tickets.length > 3 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          style={{
            marginTop: "1.25rem",
            padding: "0.75rem 1.25rem",
            backgroundColor: "#ffffff",
            border: "2px solid #e2e8f0",
            borderRadius: "0.5rem",
            cursor: "pointer",
            color: "#0ea5e9",
            fontSize: "0.9rem",
            fontWeight: "600",
            transition: "all 0.2s",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem"
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.backgroundColor = "#f8fafc";
            (e.target as HTMLElement).style.borderColor = "#0ea5e9";
            (e.target as HTMLElement).style.boxShadow = "0 2px 8px rgba(14, 165, 233, 0.1)";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.backgroundColor = "#ffffff";
            (e.target as HTMLElement).style.borderColor = "#e2e8f0";
            (e.target as HTMLElement).style.boxShadow = "none";
          }}
        >
          Ver todas las notificaciones
          <span style={{ fontWeight: "bold" }}>({tickets.length})</span>
        </button>
      )}

      {showAll && (
        <button
          onClick={() => setShowAll(false)}
          style={{
            marginTop: "1.25rem",
            padding: "0.75rem 1.25rem",
            backgroundColor: "#ffffff",
            border: "2px solid #e2e8f0",
            borderRadius: "0.5rem",
            cursor: "pointer",
            color: "#0ea5e9",
            fontSize: "0.9rem",
            fontWeight: "600",
            transition: "all 0.2s",
            width: "100%",
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLElement).style.backgroundColor = "#f8fafc";
            (e.target as HTMLElement).style.borderColor = "#0ea5e9";
            (e.target as HTMLElement).style.boxShadow = "0 2px 8px rgba(14, 165, 233, 0.1)";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLElement).style.backgroundColor = "#ffffff";
            (e.target as HTMLElement).style.borderColor = "#e2e8f0";
            (e.target as HTMLElement).style.boxShadow = "none";
          }}
        >
          Contraer
        </button>
      )}
    </section>
  );
}
