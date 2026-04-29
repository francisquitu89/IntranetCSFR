import { useEffect, useMemo, useState } from "react";
import { Bell, CalendarDays, Ticket, Users, RefreshCw, Trash2, KeyRound } from "lucide-react";
import { supabase } from "../lib/supabase";
import { reservasService } from "../services/reservasService";
import { ticketsService } from "../services/ticketsService";
import { AvailabilityBoard } from "../components/AvailabilityBoard";
import { authService } from "../services/authService";
import { SALAS_CATALOGO } from "../data/salas";
import type { Reserva, Ticket as TicketType, Usuario } from "../types";

interface AdminPageProps {
  usuario: Usuario | null;
}

const formatLocalDate = () => new Date().toLocaleDateString("en-CA");

export function AdminPage({ usuario }: AdminPageProps) {
  const [selectedDate, setSelectedDate] = useState(formatLocalDate());
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [adminActionId, setAdminActionId] = useState<string | null>(null);

  const cargarDatos = async () => {
    try {
      setRefreshing(true);
      const [reservasDelDia, ticketsGlobales, usuariosGlobales] = await Promise.all([
        reservasService.obtenerReservasConfirmadasPorFecha(selectedDate),
        ticketsService.obtenerTodosTickets(),
        supabase.from("usuarios").select("*").order("nombre", { ascending: true }),
      ]);

      if (usuariosGlobales.error) throw usuariosGlobales.error;

      setReservas(reservasDelDia);
      setTickets(ticketsGlobales);
      setUsuarios((usuariosGlobales.data || []) as Usuario[]);
    } catch (err: any) {
      setError(err.message || "No se pudieron cargar los datos globales");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleEliminarReserva = async (reservaId: string) => {
    if (!confirm("¿Eliminar esta reserva definitivamente?")) return;

    try {
      setAdminActionId(reservaId);
      await reservasService.eliminarReserva(reservaId);
    } catch (err: any) {
      setError(err.message || "No se pudo eliminar la reserva");
    } finally {
      setAdminActionId(null);
    }
  };

  const handleResetPassword = async (usuarioId: string) => {
    if (!confirm("¿Restablecer la contraseña temporal a admin123?")) return;

    try {
      setAdminActionId(usuarioId);
      await authService.cambiarContrasenaTemporalAdmin(usuarioId, "admin123");
    } catch (err: any) {
      setError(err.message || "No se pudo cambiar la contraseña");
    } finally {
      setAdminActionId(null);
    }
  };

  useEffect(() => {
    void cargarDatos();

    const channel = supabase
      .channel("admin-global-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservas" },
        () => void cargarDatos()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tickets" },
        () => void cargarDatos()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "usuarios" },
        () => void cargarDatos()
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [selectedDate]);

  const metrics = useMemo(() => {
    const reservasActivas = reservas.filter((reserva) => reserva.estado === "confirmada").length;
    const ticketsAbiertos = tickets.filter((ticket) => ticket.estado === "Abierto" || ticket.estado === "En Progreso").length;
    const salasOcupadas = new Set(reservas.map((reserva) => reserva.sala)).size;
    return {
      reservasActivas,
      ticketsAbiertos,
      salasOcupadas,
      usuariosTotal: usuarios.length,
    };
  }, [reservas, tickets, usuarios]);

  const actividad = useMemo(() => {
    const reservasActividad = reservas.map((reserva) => ({
      tipo: "Reserva",
      titulo: `${reserva.sala} · ${reserva.estado}`,
      fecha: reserva.updated_at || reserva.created_at,
    }));

    const ticketsActividad = tickets.map((ticket) => ({
      tipo: "Ticket",
      titulo: ticket.asunto,
      fecha: ticket.updated_at || ticket.created_at,
    }));

    const usuariosActividad = usuarios.map((user) => ({
      tipo: "Usuario",
      titulo: user.nombre,
      fecha: user.created_at,
    }));

    return [...reservasActividad, ...ticketsActividad, ...usuariosActividad]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 8);
  }, [reservas, tickets, usuarios]);

  if (usuario && usuario.rol !== "admin" && usuario.rol !== "director") {
    return null;
  }

  if (loading) {
    return <main className="app-content hero"><div className="container-max"><div className="empty-state">Cargando panel admin...</div></div></main>;
  }

  return (
    <main className="app-content hero" style={{ paddingTop: "2rem" }}>
      <div className="container-max">
        <div className="section-title-wrap">
          <div>
            <h1 className="section-title">Panel global en tiempo real</h1>
            <p className="section-subtitle">Supervisa reservas, tickets y usuarios. Si algo cambia, este panel se actualiza automáticamente.</p>
          </div>
          <div className="actions">
            <button onClick={() => void cargarDatos()} className="button-secondary">
              <RefreshCw size={18} />
              {refreshing ? "Actualizando..." : "Refrescar"}
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input"
              style={{ width: "auto" }}
            />
          </div>
        </div>

        {error && <div className="alert" style={{ marginBottom: "1rem" }}>{error}</div>}

        <div className="metric-grid">
          <div className="metric-card">
            <div className="metric-head"><Bell size={18} /> Reservas activas</div>
            <div className="metric-value">{metrics.reservasActivas}</div>
          </div>
          <div className="metric-card">
            <div className="metric-head"><Ticket size={18} /> Tickets abiertos</div>
            <div className="metric-value">{metrics.ticketsAbiertos}</div>
          </div>
          <div className="metric-card">
            <div className="metric-head"><CalendarDays size={18} /> Salas ocupadas</div>
            <div className="metric-value">{metrics.salasOcupadas}</div>
          </div>
          <div className="metric-card">
            <div className="metric-head"><Users size={18} /> Usuarios</div>
            <div className="metric-value">{metrics.usuariosTotal}</div>
          </div>
        </div>

        <div style={{ marginTop: "1rem" }}>
          <AvailabilityBoard
            reservas={reservas}
            salas={SALAS_CATALOGO}
            selectedDate={selectedDate}
            title="Ocupación global del día"
            subtitle="Cada celda muestra si la sala u objeto está disponible o tomado en ese tramo horario"
          />
        </div>

        <div className="grid-2" style={{ marginTop: "1rem" }}>
          <section className="form-card">
            <div className="section-title-wrap">
              <div>
                <h2 className="section-title">Actividad reciente</h2>
                <p className="section-subtitle">Últimos movimientos detectados por el sistema.</p>
              </div>
            </div>
            <div className="live-feed">
              {actividad.map((item, index) => (
                <div key={`${item.tipo}-${index}`} className="live-item">
                  <span className="tag">{item.tipo}</span>
                  <div>
                    <strong>{item.titulo}</strong>
                    <div className="muted">{new Date(item.fecha).toLocaleString("es-CL")}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="form-card">
            <div className="section-title-wrap">
              <div>
                <h2 className="section-title">Usuarios registrados</h2>
                <p className="section-subtitle">Vista general del directorio cargado en la tabla `usuarios`.</p>
              </div>
            </div>
            <div className="admin-list">
              {usuarios.slice(0, 12).map((user) => (
                <div key={user.id} className="admin-row">
                  <div>
                    <strong>{user.nombre}</strong>
                    <div className="muted">{user.email}</div>
                  </div>
                  <div className="admin-row-actions">
                    <button
                      type="button"
                      className="button-ghost"
                      onClick={() => handleResetPassword(user.id)}
                      disabled={adminActionId === user.id}
                    >
                      <KeyRound size={16} />
                      Cambiar contraseña
                    </button>
                    <span className={`status-pill ${user.rol === "admin" ? "status-ok" : "status-warn"}`}>
                      {user.rol}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid-2" style={{ marginTop: "1rem" }}>
          <section className="form-card">
            <div className="section-title-wrap">
              <div>
                <h2 className="section-title">Reservas del día</h2>
                <p className="section-subtitle">Relación de ocupación actual.</p>
              </div>
            </div>
            <div className="admin-list">
              {reservas.map((reserva) => (
                <div key={reserva.id} className="admin-row">
                  <div>
                    <strong>{reserva.sala}</strong>
                    <div className="muted">
                      {new Date(reserva.fecha_inicio).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                      {" - "}
                      {new Date(reserva.fecha_fin).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <div className="admin-row-actions">
                    <span className={`status-pill ${reserva.estado === "confirmada" ? "status-ok" : "status-bad"}`}>
                      {reserva.estado}
                    </span>
                    <button
                      type="button"
                      className="button-danger"
                      onClick={() => handleEliminarReserva(reserva.id)}
                      disabled={adminActionId === reserva.id}
                    >
                      <Trash2 size={16} />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="form-card">
            <div className="section-title-wrap">
              <div>
                <h2 className="section-title">Tickets globales</h2>
                <p className="section-subtitle">Todos los tickets en la plataforma.</p>
              </div>
            </div>
            <div className="admin-list">
              {tickets.slice(0, 12).map((ticket) => (
                <div key={ticket.id} className="admin-row">
                  <div>
                    <strong>{ticket.asunto}</strong>
                    <div className="muted">{ticket.categoria} · {ticket.prioridad}</div>
                  </div>
                  <span className={`priority-pill ${ticket.prioridad === "Urgente" || ticket.prioridad === "Alta" ? "priority-high" : ticket.prioridad === "Media" ? "priority-med" : "priority-low"}`}>
                    {ticket.estado}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
