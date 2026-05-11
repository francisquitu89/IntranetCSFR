import { useEffect, useMemo, useState } from "react";
import { Bell, CalendarDays, Ticket, Users, RefreshCw, Trash2, KeyRound, Plus } from "lucide-react";
import { supabase } from "../lib/supabase";
import { reservasService } from "../services/reservasService";
import { ticketsService } from "../services/ticketsService";
import { inventarioService } from "../services/inventarioService";
import { AvailabilityBoard, TIME_SLOTS } from "../components/AvailabilityBoard";
import { EquipmentAvailabilityBoard } from "../components/EquipmentAvailabilityBoard";
import { authService } from "../services/authService";
import { SALAS_CATALOGO } from "../data/salas";
import type { Reserva, Ticket as TicketType, Usuario } from "../types";

interface AdminPageProps {
  usuario: Usuario | null;
}

const formatLocalDate = () => new Date().toLocaleDateString("en-CA");
const timeToDateTime = (date: string, time: string) => new Date(`${date}T${time}:00`).toISOString();

export function AdminPage({ usuario }: AdminPageProps) {
  const [selectedDate, setSelectedDate] = useState(formatLocalDate());
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [inventario, setInventario] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [adminActionId, setAdminActionId] = useState<string | null>(null);
  const [respondingTicketId, setRespondingTicketId] = useState<string | null>(null);
  const [ticketResponse, setTicketResponse] = useState("");
  const [editingReservaId, setEditingReservaId] = useState<string | null>(null);
  const [editingReserva, setEditingReserva] = useState<Partial<Reserva> & { horarioInicio?: string; horarioFin?: string; fecha?: string }>({});
  
  // User creation form state
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [newUserData, setNewUserData] = useState({
    nombre: "",
    email: "",
    password: "",
    rol: "profesor" as "profesor" | "funcionario",
    departamento: "",
    telefono: "",
  });

  const cargarDatos = async () => {
    try {
      setRefreshing(true);
      const [reservasDelDia, ticketsGlobales, usuariosGlobales, inventarioRows] = await Promise.all([
        reservasService.obtenerReservasConfirmadasPorFecha(selectedDate),
        ticketsService.obtenerTodosTickets(),
        supabase.from("usuarios").select("*").order("nombre", { ascending: true }),
        inventarioService.obtenerInventario(),
      ]);

      if (usuariosGlobales.error) throw usuariosGlobales.error;

      setReservas(reservasDelDia);
      setTickets(ticketsGlobales);
      setUsuarios((usuariosGlobales.data || []) as Usuario[]);
      
      const map: Record<string, number> = {};
      (inventarioRows || []).forEach((it) => (map[it.sala] = it.cantidad));
      setInventario(map);
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

  const handleEditarReserva = (reserva: Reserva) => {
    const fechaReserva = new Date(reserva.fecha_inicio).toLocaleDateString("en-CA");
    
    // Extraer el horario de inicio
    const horaInicio = new Date(reserva.fecha_inicio).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false });
    const slotInicio = TIME_SLOTS.find(slot => slot.start === horaInicio);
    
    // Extraer el horario de fin
    const horaFin = new Date(reserva.fecha_fin).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false });
    const slotFin = TIME_SLOTS.find(slot => slot.end === horaFin);
    
    setEditingReservaId(reserva.id);
    setEditingReserva({
      fecha: fechaReserva,
      horarioInicio: slotInicio?.start || "",
      horarioFin: slotFin?.end || "",
    });
  };

  const handleGuardarReserva = async (reservaId: string) => {
    if (!editingReserva.horarioInicio || !editingReserva.horarioFin || !editingReserva.fecha) {
      setError("Debes seleccionar fecha, horario inicio y fin");
      return;
    }

    try {
      setAdminActionId(reservaId);
      
      await reservasService.actualizarReservaAdmin(reservaId, {
        fecha_inicio: timeToDateTime(editingReserva.fecha, editingReserva.horarioInicio),
        fecha_fin: timeToDateTime(editingReserva.fecha, editingReserva.horarioFin),
      });
      
      await cargarDatos();
      setEditingReservaId(null);
    } catch (err: any) {
      setError(err.message || "No se pudo actualizar la reserva");
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

  const handleResponderTicket = async (ticketId: string) => {
    if (!usuario || !ticketResponse.trim()) {
      setError("Debe escribir una respuesta");
      return;
    }

    try {
      setAdminActionId(ticketId);
      await ticketsService.responderTicket(ticketId, ticketResponse, usuario.id);
      setRespondingTicketId(null);
      setTicketResponse("");
      await cargarDatos();
    } catch (err: any) {
      setError(err.message || "No se pudo responder el ticket");
    } finally {
      setAdminActionId(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUserData.nombre || !newUserData.email || !newUserData.password) {
      setError("Debe completar los campos requeridos (nombre, email, contraseña)");
      return;
    }

    try {
      setCreatingUser(true);
      await authService.registroUsuario(
        newUserData.email,
        newUserData.password,
        newUserData.nombre,
        newUserData.rol,
        newUserData.departamento,
        newUserData.telefono
      );
      
      setNewUserData({
        nombre: "",
        email: "",
        password: "",
        rol: "profesor",
        departamento: "",
        telefono: "",
      });
      setShowCreateUserForm(false);
      setError("");
      
      // Reload data
      await cargarDatos();
    } catch (err: any) {
      const errorMsg = err.message || "No se pudo crear el usuario";
      if (errorMsg.includes("duplicate") || errorMsg.includes("email")) {
        setError(`El email ${newUserData.email} ya está registrado en el sistema`);
      } else {
        setError(errorMsg);
      }
    } finally {
      setCreatingUser(false);
    }
  };

  const handleEliminarUsuario = async (usuarioId: string, usuarioNombre: string) => {
    if (!confirm(`¿Eliminar a ${usuarioNombre} definitivamente del sistema?`)) return;

    try {
      setAdminActionId(usuarioId);
      const { error } = await supabase
        .from("usuarios")
        .delete()
        .eq("id", usuarioId);
      
      if (error) throw error;
      
      // Reload data
      await cargarDatos();
    } catch (err: any) {
      setError(err.message || "No se pudo eliminar el usuario");
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
      responsable: reserva.usuario_nombre || "Usuario",
      fecha: reserva.updated_at || reserva.created_at,
    }));

    const ticketsActividad = tickets.map((ticket) => ({
      tipo: "Ticket",
      titulo: ticket.asunto,
      responsable: ticket.usuario_nombre || "Usuario",
      fecha: ticket.updated_at || ticket.created_at,
    }));

    const usuariosActividad = usuarios.map((user) => ({
      tipo: "Usuario",
      titulo: user.nombre,
      responsable: user.nombre,
      fecha: user.created_at,
    }));

    return [...reservasActividad, ...ticketsActividad, ...usuariosActividad]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 8);
  }, [reservas, tickets, usuarios]);

  if (usuario && usuario.rol !== "admin" && usuario.rol !== "director" && usuario.rol !== "funcionario") {
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

        <section className="form-card" style={{ marginBottom: "1rem" }}>
          <div className="section-title-wrap">
            <div>
              <h2 className="section-title">Crear nuevo usuario</h2>
              <p className="section-subtitle">Añade un profesor o funcionario al sistema.</p>
            </div>
            <button
              onClick={() => setShowCreateUserForm(!showCreateUserForm)}
              className="button-secondary"
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <Plus size={18} />
              {showCreateUserForm ? "Cancelar" : "Nuevo usuario"}
            </button>
          </div>

          {showCreateUserForm && (
            <form onSubmit={handleCreateUser} className="field-grid" style={{ marginTop: "1rem" }}>
              <div className="field">
                <label>Nombre *</label>
                <input
                  type="text"
                  value={newUserData.nombre}
                  onChange={(e) => setNewUserData({ ...newUserData, nombre: e.target.value })}
                  required
                  className="input"
                  placeholder="Nombre completo"
                />
              </div>

              <div className="field">
                <label>Correo electrónico *</label>
                <input
                  type="email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  required
                  className="input"
                  placeholder="correo@ejemplo.com"
                />
              </div>

              <div className="field-grid two">
                <div className="field">
                  <label>Rol *</label>
                  <select
                    value={newUserData.rol}
                    onChange={(e) => setNewUserData({ ...newUserData, rol: e.target.value as "profesor" | "funcionario" })}
                    className="select"
                  >
                    <option value="profesor">Profesor</option>
                    <option value="funcionario">Funcionario</option>
                  </select>
                </div>

                <div className="field">
                  <label>Teléfono</label>
                  <input
                    type="tel"
                    value={newUserData.telefono}
                    onChange={(e) => setNewUserData({ ...newUserData, telefono: e.target.value })}
                    className="input"
                    placeholder="+56 9 1234 5678"
                  />
                </div>
              </div>

              <div className="field">
                <label>Departamento</label>
                <input
                  type="text"
                  value={newUserData.departamento}
                  onChange={(e) => setNewUserData({ ...newUserData, departamento: e.target.value })}
                  className="input"
                  placeholder="Ej: Inglés, Computación"
                />
              </div>

              <div className="field">
                <label>Contraseña *</label>
                <input
                  type="password"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  required
                  className="input"
                  placeholder="••••••••"
                />
              </div>

              {error && <div className="alert">{error}</div>}

              <button
                type="submit"
                disabled={creatingUser}
                className="button"
                style={{ width: "100%" }}
              >
                {creatingUser ? "Creando..." : "Crear usuario"}
              </button>
            </form>
          )}
        </section>

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

        <div style={{ marginTop: "1rem" }}>
          <EquipmentAvailabilityBoard
            reservas={reservas}
            equipos={SALAS_CATALOGO.filter(s => s.tipo === "Objeto")}
            selectedDate={selectedDate}
            inventario={inventario}
            title="Disponibilidad de notebooks y tablets"
            subtitle="Muestra cuántos equipos están disponibles en cada horario del día"
          />
        </div>

        <div style={{ marginTop: "1rem" }}>
          <section className="form-card">
            <div className="section-title-wrap">
              <div>
                <h2 className="section-title">⚙️ Gestión de inventario</h2>
                <p className="section-subtitle">Ajusta dinámicamente la cantidad de equipos disponibles. Los números se actualizan según las reservas del día.</p>
              </div>
            </div>
            <div className="grid-2" style={{ gap: "1rem" }}>
              {SALAS_CATALOGO.filter(s => s.tipo === "Objeto").map((equipo) => {
                const cantidadActual = inventario[equipo.value] || 0;
                
                // Calcular dinámicamente cuántos están reservados hoy
                const reservasDelEquipoHoy = reservas.filter(r => r.sala === equipo.value);
                const cantidadReservada = reservasDelEquipoHoy.reduce((acc, r) => acc + (r.cantidad || 1), 0);
                const disponibleAhora = Math.max(0, cantidadActual - cantidadReservada);
                
                return (
                  <div key={equipo.value} style={{ padding: "1rem", border: "1px solid #e0e0e0", borderRadius: "0.5rem" }}>
                    <div style={{ marginBottom: "1rem" }}>
                      <h4 style={{ margin: "0 0 0.5rem" }}>{equipo.label}</h4>
                      <p style={{ margin: "0.25rem 0", fontSize: "0.9rem", color: "#666" }}>
                        Inventario total: <strong style={{ fontSize: "1.2rem", color: "#333" }}>{cantidadActual}</strong> unidades
                      </p>
                      <p style={{ margin: "0.25rem 0", fontSize: "0.9rem", color: "#666" }}>
                        Reservadas hoy: <strong style={{ fontSize: "1.2rem", color: cantidadReservada > 0 ? "#ff9800" : "#666" }}>{cantidadReservada}</strong>
                      </p>
                      <p style={{ margin: "0.25rem 0", fontSize: "0.9rem", color: "#666" }}>
                        Disponibles ahora: <strong style={{ fontSize: "1.2rem", color: disponibleAhora > 0 ? "#28a745" : "#dc3545" }}>{disponibleAhora}</strong>
                      </p>
                    </div>
                    <div className="actions" style={{ gap: "0.5rem" }}>
                      <button
                        onClick={() => {
                          const nuevaCantidad = Math.max(0, cantidadActual - 1);
                          inventarioService.actualizarCantidad(equipo.value, nuevaCantidad).then(() => cargarDatos());
                        }}
                        className="button-secondary"
                        style={{ padding: "0.5rem 1rem", fontSize: "0.9rem", flex: 1 }}
                        disabled={refreshing || cantidadActual <= 0}
                      >
                        ➖ Usar
                      </button>
                      <button
                        onClick={() => {
                          const nuevaCantidad = Math.min(equipo.capacidad, cantidadActual + 1);
                          inventarioService.actualizarCantidad(equipo.value, nuevaCantidad).then(() => cargarDatos());
                        }}
                        className="button-secondary"
                        style={{ padding: "0.5rem 1rem", fontSize: "0.9rem", flex: 1 }}
                        disabled={refreshing || cantidadActual >= equipo.capacidad}
                      >
                        ➕ Devuelto
                      </button>
                      <input
                        type="number"
                        min="0"
                        max={equipo.capacidad}
                        value={cantidadActual}
                        onChange={(e) => {
                          const val = Math.min(equipo.capacidad, Math.max(0, parseInt(e.target.value) || 0));
                          inventarioService.actualizarCantidad(equipo.value, val).then(() => cargarDatos());
                        }}
                        style={{ width: "60px", padding: "0.5rem", textAlign: "center", borderRadius: "0.25rem", border: "1px solid #ccc" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
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
                    <div className="muted">
                      <small>{item.responsable}</small> • {new Date(item.fecha).toLocaleString("es-CL")}
                    </div>
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
                      className="button"
                      onClick={() => handleResetPassword(user.id)}
                      disabled={adminActionId === user.id}
                      style={{ fontSize: "0.875rem", padding: "0.5rem 0.75rem" }}
                    >
                      <KeyRound size={16} />
                      Cambiar contraseña
                    </button>
                    <button
                      type="button"
                      className="button-danger"
                      onClick={() => handleEliminarUsuario(user.id, user.nombre)}
                      disabled={adminActionId === user.id}
                      style={{ fontSize: "0.875rem", padding: "0.5rem 0.75rem" }}
                    >
                      Eliminar
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
                <div key={reserva.id} className="admin-row" style={{ flexDirection: "column", gap: "1rem" }}>
                  <div style={{ width: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "0.5rem" }}>
                      <div>
                        <strong>{reserva.sala}</strong>
                        {reserva.usuario_nombre && (
                          <div className="muted" style={{ marginTop: "0.25rem" }}>
                            👤 <strong>{reserva.usuario_nombre}</strong>
                            {reserva.usuario_email && ` (${reserva.usuario_email})`}
                          </div>
                        )}
                        <div className="muted">
                          {new Date(reserva.fecha_inicio).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                          {" - "}
                          {new Date(reserva.fecha_fin).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                      <span className={`status-pill ${reserva.estado === "confirmada" ? "status-ok" : "status-bad"}`}>
                        {reserva.estado}
                      </span>
                    </div>
                  </div>

                  {editingReservaId === reserva.id ? (
                    <div style={{ width: "100%", padding: "1rem", backgroundColor: "#f9f9f9", borderRadius: "0.5rem", gap: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
                      <div className="field">
                        <label>Fecha</label>
                        <input
                          type="date"
                          value={editingReserva.fecha || ""}
                          onChange={(e) => setEditingReserva({ ...editingReserva, fecha: e.target.value })}
                          className="input"
                        />
                      </div>
                      <div className="field">
                        <label>Horario inicio</label>
                        <select
                          value={editingReserva.horarioInicio || ""}
                          onChange={(e) => setEditingReserva({ ...editingReserva, horarioInicio: e.target.value, horarioFin: "" })}
                          className="select"
                        >
                          <option value="">Selecciona un bloque...</option>
                          {TIME_SLOTS.map((slot) => (
                            <option key={slot.label} value={slot.start}>
                              {slot.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="field">
                        <label>Horario fin</label>
                        <select
                          value={editingReserva.horarioFin || ""}
                          onChange={(e) => setEditingReserva({ ...editingReserva, horarioFin: e.target.value })}
                          disabled={!editingReserva.horarioInicio}
                          className="select"
                        >
                          <option value="">Selecciona el bloque final...</option>
                          {editingReserva.horarioInicio
                            ? TIME_SLOTS.slice(TIME_SLOTS.findIndex((s) => s.start === editingReserva.horarioInicio)).map((slot) => (
                                <option key={slot.label} value={slot.end}>
                                  {slot.label}
                                </option>
                              ))
                            : TIME_SLOTS.map((slot) => (
                                <option key={slot.label} value={slot.end}>
                                  {slot.label}
                                </option>
                              ))}
                        </select>
                      </div>
                      <div style={{ gridColumn: "1 / -1", display: "flex", gap: "0.5rem" }}>
                        <button
                          onClick={() => handleGuardarReserva(reserva.id)}
                          disabled={adminActionId === reserva.id}
                          className="button"
                          style={{ flex: 1 }}
                        >
                          {adminActionId === reserva.id ? "Guardando..." : "Guardar cambios"}
                        </button>
                        <button
                          onClick={() => setEditingReservaId(null)}
                          className="button-secondary"
                          style={{ flex: 1 }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="admin-row-actions">
                      <button
                        type="button"
                        className="button"
                        onClick={() => handleEditarReserva(reserva)}
                        disabled={adminActionId === reserva.id}
                      >
                        ✏️ Editar
                      </button>
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
                  )}
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
                <div key={ticket.id} className="admin-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "1rem", paddingBottom: "1rem", borderBottom: "1px solid #e0e0e0" }}>
                  <div style={{ width: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "0.5rem" }}>
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: "1.05rem" }}>{ticket.asunto}</strong>
                        <div className="muted">{ticket.categoria} · {ticket.prioridad}</div>
                        {ticket.usuario_nombre && (
                          <div className="muted" style={{ marginTop: "0.25rem" }}>
                            <strong>Usuario:</strong> {ticket.usuario_nombre}
                            {ticket.usuario_email && ` (${ticket.usuario_email})`}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <span className={`priority-pill ${ticket.prioridad === "Urgente" || ticket.prioridad === "Alta" ? "priority-high" : ticket.prioridad === "Media" ? "priority-med" : "priority-low"}`}>
                          {ticket.estado}
                        </span>
                        <select
                          value={ticket.estado}
                          onChange={(e) => {
                            setAdminActionId(ticket.id);
                            ticketsService.actualizarTicket(ticket.id, { estado: e.target.value as any })
                              .then(() => cargarDatos())
                              .finally(() => setAdminActionId(null));
                          }}
                          disabled={adminActionId === ticket.id}
                          style={{ fontSize: "0.875rem", padding: "0.25rem", borderRadius: "0.25rem" }}
                          className="select"
                        >
                          <option value="Abierto">Abierto</option>
                          <option value="En Progreso">En Progreso</option>
                          <option value="Resuelto">Resuelto</option>
                          <option value="Cerrado">Cerrado</option>
                        </select>
                      </div>
                    </div>
                    <div className="muted" style={{ marginTop: "0.5rem", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {ticket.descripcion}
                    </div>
                  </div>

                  {respondingTicketId === ticket.id ? (
                    <div style={{ width: "100%", marginTop: "0.5rem", paddingTop: "1rem", borderTop: "1px solid #e0e0e0" }}>
                      <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Responder ticket:</label>
                      <textarea
                        value={ticketResponse}
                        onChange={(e) => setTicketResponse(e.target.value)}
                        placeholder="Escribe tu respuesta aquí..."
                        rows={4}
                        className="textarea"
                        style={{ marginBottom: "0.5rem" }}
                      />
                      <div className="actions" style={{ gap: "0.5rem" }}>
                        <button
                          onClick={() => handleResponderTicket(ticket.id)}
                          disabled={adminActionId === ticket.id || !ticketResponse.trim()}
                          className="button"
                          style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
                        >
                          {adminActionId === ticket.id ? "Guardando..." : "Guardar respuesta"}
                        </button>
                        <button
                          onClick={() => {
                            setRespondingTicketId(null);
                            setTicketResponse("");
                          }}
                          className="button-secondary"
                          style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ width: "100%", display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                      {ticket.respuesta && (
                        <div style={{ width: "100%", marginBottom: "0.5rem", padding: "0.75rem", backgroundColor: "#f5f5f5", borderRadius: "0.25rem", fontSize: "0.9rem" }}>
                          <strong>Respuesta del admin:</strong>
                          <div style={{ marginTop: "0.5rem", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                            {ticket.respuesta}
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setRespondingTicketId(ticket.id);
                          setTicketResponse(ticket.respuesta || "");
                        }}
                        className="button-secondary"
                        style={{ padding: "0.5rem 0.75rem", fontSize: "0.85rem", whiteSpace: "nowrap" }}
                      >
                        {ticket.respuesta ? "Editar respuesta" : "Responder"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
