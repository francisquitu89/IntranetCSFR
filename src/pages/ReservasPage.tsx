import { useEffect, useMemo, useState } from "react";
import { Plus, Calendar, MapPin, ShieldCheck, Ban } from "lucide-react";
import { format, addDays, addWeeks, addMonths, addYears } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "../lib/supabase";
import { AvailabilityBoard, TIME_SLOTS } from "../components/AvailabilityBoard";
import { reservasService } from "../services/reservasService";
import { inventarioService } from "../services/inventarioService";
import { SALAS_CATALOGO } from "../data/salas";
import type { Reserva, Usuario, SalaType } from "../types";

interface ReservasPageProps {
  usuario: Usuario | null;
}

const getLocalDateInput = () => new Date().toLocaleDateString("en-CA");
const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) => aStart < bEnd && aEnd > bStart;
const timeToDateTime = (date: string, time: string) => new Date(`${date}T${time}:00`);

type ReservaType = "espacio" | "objeto";
type PeriodoType = "dia" | "semana" | "mes" | "ano";
type RecurrenceType = "none" | "weekly" | "monthly" | "yearly";

export function ReservasPage({ usuario }: ReservasPageProps) {
  const [reservasUsuario, setReservasUsuario] = useState<Reserva[]>([]);
  const [reservasDelDia, setReservasDelDia] = useState<Reserva[]>([]);
  const [selectedDate, setSelectedDate] = useState(getLocalDateInput());
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tipoReserva, setTipoReserva] = useState<ReservaType>("espacio");
  const [periodoReserva, setPeriodoReserva] = useState<PeriodoType>("dia");
  
  const salasEspacios = SALAS_CATALOGO.filter(s => s.tipo === "Espacio");
  const salasObjetos = SALAS_CATALOGO.filter(s => s.tipo === "Objeto");

  const [formData, setFormData] = useState({
    sala: salasEspacios[0].value,
    horarioInicio: "",
    horarioFin: "",
    descripcion: "",
    recurrenceType: "none" as RecurrenceType,
    recurrenceEndDate: "",
    recurrenceCount: 1,
  });
  const [inventario, setInventario] = useState<Record<string, number>>({});
  const [editingReservaId, setEditingReservaId] = useState<string | null>(null);
  const [editarFormData, setEditarFormData] = useState({ sala: "" as SalaType, horarioInicio: "", horarioFin: "", descripcion: "" });

  useEffect(() => {
    const cargarDatos = async () => {
      if (!usuario) return;

      try {
        setLoading(true);
        const [reservasPersonales, reservasGlobales, inventarioRows] = await Promise.all([
          reservasService.obtenerReservasUsuario(usuario.id),
          reservasService.obtenerReservasConfirmadasPorFecha(selectedDate),
          inventarioService.obtenerInventario(),
        ]);

        setReservasUsuario(reservasPersonales);
        setReservasDelDia(reservasGlobales);
        const map: Record<string, number> = {};
        (inventarioRows || []).forEach((it) => (map[it.sala] = it.cantidad));
        setInventario(map);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    void cargarDatos();

    // Suscripción mejorada a cambios en tiempo real
    const channel = supabase
      .channel(`reservas-live-${selectedDate}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reservas" },
        (payload) => {
          console.log("Nueva reserva insertada:", payload);
          // Refetch inmediato
          void cargarDatos();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reservas" },
        (payload) => {
          console.log("Reserva actualizada:", payload);
          void cargarDatos();
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "reservas" },
        (payload) => {
          console.log("Reserva eliminada:", payload);
          void cargarDatos();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [usuario, selectedDate]);

  const currentStart = formData.horarioInicio ? timeToDateTime(selectedDate, formData.horarioInicio) : null;
  const currentEnd = formData.horarioFin ? timeToDateTime(selectedDate, formData.horarioFin) : null;

  const salaDisponible = (sala: SalaType) => {
    if (!currentStart || !currentEnd) return true;

    return !reservasDelDia.some((reserva) => {
      if (reserva.sala !== sala) return false;
      const reservaStart = new Date(reserva.fecha_inicio);
      const reservaEnd = new Date(reserva.fecha_fin);
      return overlaps(currentStart, currentEnd, reservaStart, reservaEnd);
    });
  };

  const salaStatus = useMemo(
    () =>
      salasEspacios.map((sala) => ({
        ...sala,
        disponible: salaDisponible(sala.value),
      })),
    [reservasDelDia, formData.horarioFin, formData.horarioInicio]
  );

  const reservasUsuarioFiltradas = useMemo(() => {
    return reservasUsuario.filter(r => {
      const sala = SALAS_CATALOGO.find(s => s.value === r.sala);
      return tipoReserva === "espacio" ? sala?.tipo === "Espacio" : sala?.tipo === "Objeto";
    });
  }, [reservasUsuario, tipoReserva]);

  const startIndex = formData.horarioInicio ? TIME_SLOTS.findIndex((slot) => slot.start === formData.horarioInicio) : -1;
  const availableEndSlots = startIndex >= 0 ? TIME_SLOTS.slice(startIndex) : TIME_SLOTS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;

    // Solo validar horarios si es un espacio (no para préstamo/objeto)
    if (tipoReserva === "espacio") {
      if (!formData.horarioInicio || !formData.horarioFin) {
        setError("Debes completar el horario de inicio y fin.");
        return;
      }
    }

    let startSlot = null;
    let endSlot = null;
    if (tipoReserva === "espacio") {
      startSlot = TIME_SLOTS.find((slot) => slot.start === formData.horarioInicio);
      endSlot = TIME_SLOTS.find((slot) => slot.end === formData.horarioFin);

      if (!startSlot || !endSlot) {
        setError("Debes seleccionar bloques horarios válidos.");
        return;
      }

      if (!salaDisponible(formData.sala)) {
        setError("Esta sala ya está ocupada en ese horario.");
        return;
      }
    }

    setError("");
    setLoading(true);

    try {
      if (tipoReserva === "objeto") {
        // Para objetos, reservar sin horarios específicos
        const fechaInicio = new Date(selectedDate).toISOString();
        const fechaFin = new Date(selectedDate).toISOString();
        await reservasService.crearReserva(
          usuario.id,
          formData.sala,
          fechaInicio,
          fechaFin,
          formData.descripcion || `Préstamo desde el ${selectedDate}`
        );

        // Restar del inventario
        const cantidadActual = inventario[formData.sala] ?? SALAS_CATALOGO.find(s => s.value === formData.sala)?.capacidad ?? 0;
        if (cantidadActual > 0) {
          await inventarioService.actualizarCantidad(formData.sala, cantidadActual - 1);
          setInventario((s) => ({ ...s, [formData.sala]: cantidadActual - 1 }));
        }
      } else {
        // Para espacios, usar horarios específicos
        const fechaInicio = timeToDateTime(selectedDate, startSlot!.start).toISOString();
        const fechaFin = timeToDateTime(selectedDate, endSlot!.end).toISOString();
        await reservasService.crearReserva(
          usuario.id,
          formData.sala,
          fechaInicio,
          fechaFin,
          formData.descripcion,
          formData.recurrenceType !== "none" ? formData.recurrenceType : undefined,
          formData.recurrenceEndDate || undefined,
          formData.recurrenceCount > 1 ? formData.recurrenceCount : undefined
        );
      }

      setFormData({
        sala: tipoReserva === "objeto" ? salasObjetos[0].value : salasEspacios[0].value,
        horarioInicio: "",
        horarioFin: "",
        descripcion: "",
        recurrenceType: "none",
        recurrenceEndDate: "",
        recurrenceCount: 1,
      });
      setShowForm(false);

      // Refetch inmediato para ver la nueva reserva sin necesidad de refresh
      try {
        const [reservasPersonales, reservasGlobales] = await Promise.all([
          reservasService.obtenerReservasUsuario(usuario.id),
          reservasService.obtenerReservasConfirmadasPorFecha(selectedDate),
        ]);
        setReservasUsuario(reservasPersonales);
        setReservasDelDia(reservasGlobales);
      } catch (err: any) {
        console.error("Error al refetch después de crear reserva:", err);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (reservaId: string) => {
    if (!confirm("¿Deseas eliminar esta reserva definitivamente?")) return;

    try {
      // Buscar la reserva para saber si es objeto
      const reserva = reservasDelDia.find(r => r.id === reservaId) || reservasUsuario.find(r => r.id === reservaId);
      
      await reservasService.eliminarReserva(reservaId);

      // Si es un objeto/préstamo, devolver cantidad al inventario
      if (reserva) {
        const sala = SALAS_CATALOGO.find(s => s.value === reserva.sala);
        if (sala && sala.tipo === "Objeto") {
          const cantidadActual = inventario[reserva.sala] ?? sala.capacidad;
          await inventarioService.actualizarCantidad(reserva.sala, cantidadActual + 1);
          setInventario((s) => ({ ...s, [reserva.sala]: cantidadActual + 1 }));
        }
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!usuario) return null;

  return (
    <main className="app-content hero" style={{ paddingTop: "2rem" }}>
      <div className="container-max">
        <div className="section-title-wrap">
          <div>
            <h1 className="section-title">Mis reservas</h1>
            <p className="section-subtitle">
              El tablero indica qué salas están habilitadas u ocupadas. Si alguien más ya reservó un tramo, esa sala queda bloqueada.
            </p>
          </div>
          <div className="actions">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input"
              style={{ width: "auto" }}
            />
            <button onClick={() => setShowForm(!showForm)} className="button">
              <Plus size={18} />
              Nueva reserva
            </button>
          </div>
        </div>

        <div className="metric-grid" style={{ marginBottom: "1rem" }}>
          <div className="metric-card">
            <div className="metric-head"><Calendar size={18} /> Mis reservas</div>
            <div className="metric-value">
              {tipoReserva === "espacio" 
                ? reservasUsuario.filter(r => SALAS_CATALOGO.find(s => s.value === r.sala)?.tipo === "Espacio").length
                : reservasUsuario.filter(r => SALAS_CATALOGO.find(s => s.value === r.sala)?.tipo === "Objeto").length
              }
            </div>
          </div>
          {tipoReserva === "espacio" && (
            <>
              <div className="metric-card">
                <div className="metric-head"><ShieldCheck size={18} /> Habilitadas hoy</div>
                <div className="metric-value">{salaStatus.filter((item) => item.disponible).length}</div>
              </div>
              <div className="metric-card">
                <div className="metric-head"><Ban size={18} /> Ocupadas hoy</div>
                <div className="metric-value">{salaStatus.filter((item) => !item.disponible).length}</div>
              </div>
            </>
          )}
          <div className="metric-card">
            <div className="metric-head"><MapPin size={18} /> {tipoReserva === "espacio" ? "Reservas del día" : "Préstamos activos"}</div>
            <div className="metric-value">
              {tipoReserva === "espacio" 
                ? reservasDelDia.filter(r => SALAS_CATALOGO.find(s => s.value === r.sala)?.tipo === "Espacio").length
                : reservasDelDia.filter(r => SALAS_CATALOGO.find(s => s.value === r.sala)?.tipo === "Objeto").length
              }
            </div>
          </div>
        </div>

        {error && <div className="alert" style={{ marginBottom: "1rem" }}>{error}</div>}

        {showForm && (
          <section className="form-card" style={{ marginTop: "1rem" }}>
            <h2 className="section-title" style={{ marginBottom: "0.25rem" }}>Crear nueva reserva</h2>
            <p className="section-subtitle">
              {tipoReserva === "espacio" 
                ? "Reserva una sala para tus actividades" 
                : "Solicita el préstamo de tablets o notebooks"}
            </p>

            <form onSubmit={handleSubmit} className="field-grid" style={{ marginTop: "1rem" }}>
              {/* Selector de tipo de reserva */}
              <div className="field-grid two" style={{ marginBottom: "1rem" }}>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setTipoReserva("espacio");
                      setFormData({ ...formData, sala: salasEspacios[0].value });
                    }}
                    className={tipoReserva === "espacio" ? "button" : "button-secondary"}
                    style={{ flex: 1 }}
                  >
                    Reservar Espacio
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTipoReserva("objeto");
                      setFormData({ ...formData, sala: salasObjetos[0].value });
                    }}
                    className={tipoReserva === "objeto" ? "button" : "button-secondary"}
                    style={{ flex: 1 }}
                  >
                    Préstamo (Tablet/Notebook)
                  </button>
                </div>
              </div>

              <div className="field-grid two">
                <div className="field">
                  <label>{tipoReserva === "espacio" ? "Sala" : "Equipo"}</label>
                  <select
                    value={formData.sala}
                    onChange={(e) => setFormData({ ...formData, sala: e.target.value as SalaType })}
                    className="select"
                  >
                    {(tipoReserva === "espacio" ? salasEspacios : salasObjetos).map((sala) => {
                      if (tipoReserva === "espacio") {
                        return (
                          <option key={sala.value} value={sala.value} disabled={!salaDisponible(sala.value)}>
                            {salaDisponible(sala.value) ? sala.label : `${sala.label} (ocupada)`}
                          </option>
                        );
                      } else {
                        // Para objetos, mostrar inventario disponible
                        const disponible = inventario[sala.value] ?? sala.capacidad;
                        return (
                          <option key={sala.value} value={sala.value} disabled={disponible <= 0}>
                            {disponible > 0 ? `${sala.label} (${disponible} disponibles)` : `${sala.label} (sin stock)`}
                          </option>
                        );
                      }
                    })}
                  </select>
                </div>

                <div className="field">
                  <label>Fecha</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="input"
                  />
                </div>

                {tipoReserva === "espacio" && (
                  <>
                    <div className="field">
                      <label>Horario inicio</label>
                      <select
                        value={formData.horarioInicio}
                        onChange={(e) => setFormData({ ...formData, horarioInicio: e.target.value, horarioFin: "" })}
                        required
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
                        value={formData.horarioFin}
                        onChange={(e) => setFormData({ ...formData, horarioFin: e.target.value })}
                        required
                        className="select"
                        disabled={!formData.horarioInicio}
                      >
                        <option value="">Selecciona el bloque final...</option>
                        {availableEndSlots.map((slot) => (
                          <option key={slot.label} value={slot.end}>
                            {slot.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>

              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Descripción {tipoReserva === "objeto" ? "del uso" : "opcional"}</label>
                <input
                  type="text"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder={tipoReserva === "objeto" ? "Ej: Actividad en Sala 33" : "Describe tu reserva..."}
                  className="input"
                />
              </div>

              {/* Campos de recurrencia - solo para espacios */}
              {tipoReserva === "espacio" && (
                <>
                  <div className="field">
                    <label>Repetir reserva</label>
                    <select
                      value={formData.recurrenceType}
                      onChange={(e) => setFormData({ ...formData, recurrenceType: e.target.value as RecurrenceType })}
                      className="select"
                    >
                      <option value="none">No repetir</option>
                      <option value="weekly">Cada semana</option>
                      <option value="monthly">Cada mes</option>
                      <option value="yearly">Cada año</option>
                    </select>
                  </div>

                  {formData.recurrenceType !== "none" && (
                    <>
                      <div className="field">
                        <label>Hasta (fecha final)</label>
                        <input
                          type="date"
                          value={formData.recurrenceEndDate}
                          onChange={(e) => setFormData({ ...formData, recurrenceEndDate: e.target.value })}
                          min={selectedDate}
                          className="input"
                        />
                      </div>
                      <div className="field">
                        <label>O repetir (cantidad)</label>
                        <input
                          type="number"
                          min="1"
                          max="52"
                          value={formData.recurrenceCount}
                          onChange={(e) => setFormData({ ...formData, recurrenceCount: parseInt(e.target.value) || 1 })}
                          placeholder="Número de veces"
                          className="input"
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              <div className="actions">
                <button 
                  type="submit" 
                  disabled={loading || !salaDisponible(formData.sala) || (tipoReserva === "espacio" && !formData.horarioInicio)} 
                  className="button"
                >
                  {loading ? "Guardando..." : "Guardar reserva"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="button-secondary">
                  Cancelar
                </button>
              </div>

              {!salaDisponible(formData.sala) && formData.horarioInicio && formData.horarioFin && (
                <div className="alert">Esta opción ya está ocupada para ese horario.</div>
              )}
            </form>
          </section>
        )}

        {tipoReserva === "espacio" && (
          <AvailabilityBoard
            reservas={reservasDelDia}
            salas={salasEspacios}
            selectedDate={selectedDate}
            title="Disponibilidad de espacios"
            subtitle="Si otro usuario ya tomó el horario, la sala queda marcada como ocupada"
          />
        )}

        {tipoReserva === "objeto" && (
          <section className="section">
            <div className="section-title-wrap">
              <div>
                <h2 className="section-title">Equipos disponibles para préstamo</h2>
                <p className="section-subtitle">Verde = disponible, Rojo = en préstamo</p>
              </div>
            </div>
            <div className="grid-2">
              {salasObjetos.map((objeto) => {
                const prestamoActual = reservasDelDia.find(r => r.sala === objeto.value);
                const disponible = !prestamoActual;
                const cantidadActual = inventario[objeto.value] ?? objeto.capacidad;
                return (
                  <div key={objeto.value} className="stat-card">
                    <div className="section-title-wrap" style={{ marginBottom: "0.75rem" }}>
                      <div>
                        <h3 className="card-title">{objeto.label}</h3>
                        <span className={`status-pill ${disponible ? "status-ok" : "status-bad"}`}>
                          {disponible ? "Disponible" : "En préstamo"}
                        </span>
                      </div>
                    </div>
                    <div className="field-grid">
                      <div className="muted">Capacidad: {cantidadActual} unidades</div>
                      {prestamoActual && (
                        <div className="muted">
                          <Calendar size={16} style={{ display: "inline", marginRight: 8 }} />
                          Hasta {format(new Date(prestamoActual.fecha_fin), "dd MMM HH:mm", { locale: es })}
                        </div>
                      )}
                    </div>
                    {(usuario?.rol === "funcionario" || usuario?.rol === "admin") && (
                      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <button
                          className="button-secondary"
                          onClick={async () => {
                            try {
                              const nueva = Math.max(0, (cantidadActual || 0) - 1);
                              await inventarioService.actualizarCantidad(objeto.value, nueva);
                              setInventario((s) => ({ ...s, [objeto.value]: nueva }));
                            } catch (err: any) {
                              setError(err.message);
                            }
                          }}
                        >
                          -
                        </button>
                        <button
                          className="button"
                          onClick={async () => {
                            try {
                              const nueva = (cantidadActual || 0) + 1;
                              await inventarioService.actualizarCantidad(objeto.value, nueva);
                              setInventario((s) => ({ ...s, [objeto.value]: nueva }));
                            } catch (err: any) {
                              setError(err.message);
                            }
                          }}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {loading && <div className="empty-state" style={{ marginTop: "1rem" }}>Cargando...</div>}

        {reservasUsuarioFiltradas.length === 0 && !loading && (
          <div className="empty-state" style={{ marginTop: "1rem" }}>
            <div className="empty-badge">Sin {tipoReserva === "espacio" ? "reservas" : "préstamos"}</div>
            <h3 style={{ margin: "0.9rem 0 0.35rem" }}>No hay {tipoReserva === "espacio" ? "reservas" : "préstamos"} todavía</h3>
            <p className="muted">
              {tipoReserva === "espacio"
                ? "Crea la primera reserva para empezar a organizar salas."
                : "Solicita tu primer préstamo de equipo."}
            </p>
          </div>
        )}

        <div className="grid-2" style={{ marginTop: "1rem" }}>
          {reservasUsuarioFiltradas.map((reserva) => (
            <article key={reserva.id} className="stat-card">
              <div className="section-title-wrap" style={{ marginBottom: "0.75rem" }}>
                <div>
                  <h3 className="card-title">{reserva.sala}</h3>
                  <span className={`status-pill ${reserva.estado === "confirmada" ? "status-ok" : "status-bad"}`}>
                    {reserva.estado}
                  </span>
                </div>
                {reserva.estado === "confirmada" && (
                  <div className="admin-row-actions">
                    {(usuario?.rol === "admin" || usuario?.rol === "funcionario" || usuario?.id === reserva.usuario_id) && (
                      <button
                        onClick={() => {
                          setEditingReservaId(reserva.id);
                          setEditarFormData({
                            sala: reserva.sala,
                            horarioInicio: "",
                            horarioFin: "",
                            descripcion: reserva.descripcion || "",
                          });
                        }}
                        className="button-secondary"
                        aria-label="Editar reserva"
                      >
                        Editar
                      </button>
                    )}
                    <button onClick={() => handleEliminar(reserva.id)} className="button-secondary" aria-label="Eliminar reserva">
                      Eliminar
                    </button>
                  </div>
                )}
              </div>

              {editingReservaId === reserva.id ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const updates: any = { descripcion: editarFormData.descripcion };
                      if (editarFormData.sala) updates.sala = editarFormData.sala;
                      await reservasService.actualizarReserva(reserva.id, updates);
                      setEditingReservaId(null);
                      const [reservasPersonales, reservasGlobales] = await Promise.all([
                        reservasService.obtenerReservasUsuario(usuario.id),
                        reservasService.obtenerReservasConfirmadasPorFecha(selectedDate),
                      ]);
                      setReservasUsuario(reservasPersonales);
                      setReservasDelDia(reservasGlobales);
                    } catch (err: any) {
                      setError(err.message);
                    }
                  }}
                >
                  <div className="field-grid">
                    <div className="field">
                      <label>Sala / Equipo</label>
                      <select
                        value={editarFormData.sala}
                        onChange={(ev) => setEditarFormData({ ...editarFormData, sala: ev.target.value as SalaType })}
                        className="select"
                      >
                        {SALAS_CATALOGO.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field" style={{ gridColumn: "1 / -1" }}>
                      <label>Descripción</label>
                      <input
                        className="input"
                        value={editarFormData.descripcion}
                        onChange={(ev) => setEditarFormData({ ...editarFormData, descripcion: ev.target.value })}
                      />
                    </div>
                  </div>
                  <div className="actions">
                    <button type="submit" className="button">Guardar</button>
                    <button type="button" onClick={() => setEditingReservaId(null)} className="button-secondary">Cancelar</button>
                  </div>
                </form>
              ) : (
                <div className="field-grid">
                  <div className="muted">
                    <Calendar size={16} style={{ display: "inline", marginRight: 8 }} />
                    {format(new Date(reserva.fecha_inicio), "dd MMM yyyy HH:mm", { locale: es })}
                  </div>
                  <div className="muted">
                    <MapPin size={16} style={{ display: "inline", marginRight: 8 }} />
                    Hasta {format(new Date(reserva.fecha_fin), "HH:mm", { locale: es })}
                  </div>
                  {reserva.usuario_email && (
                    <div className="muted">
                      <strong>Correo:</strong> {reserva.usuario_email}
                    </div>
                  )}
                  {reserva.usuario_nombre && (
                    <div className="muted">
                      <strong>Usuario:</strong> {reserva.usuario_nombre}
                    </div>
                  )}
                  {reserva.usuario_rol && (
                    <div className="muted">
                      <strong>Rol:</strong> <span style={{ textTransform: "capitalize" }}>{reserva.usuario_rol}</span>
                    </div>
                  )}
                  {reserva.descripcion && <p className="muted">{reserva.descripcion}</p>}
                </div>
              )}
            </article>
          ))}
        </div>

        {/* Sección para funcionarios: ver todas las reservas globales */}
        {usuario.rol === "funcionario" && (
          <section style={{ marginTop: "2rem" }}>
            <div className="section-title-wrap">
              <div>
                <h2 className="section-title">Todas las reservas del día ({selectedDate})</h2>
                <p className="section-subtitle">Vista general de reservas de todos los usuarios</p>
              </div>
            </div>

            {reservasDelDia.length === 0 ? (
              <div className="empty-state">
                <p className="muted">No hay reservas para este día</p>
              </div>
            ) : (
              <div className="grid-2">
                {reservasDelDia.map((reserva) => (
                  <article key={reserva.id} className="stat-card">
                    <div className="section-title-wrap" style={{ marginBottom: "0.75rem" }}>
                      <div>
                        <h3 className="card-title">{reserva.sala}</h3>
                        <span className={`status-pill ${reserva.estado === "confirmada" ? "status-ok" : "status-bad"}`}>
                          {reserva.estado}
                        </span>
                      </div>
                    </div>

                    <div className="field-grid">
                      <div className="muted">
                        <Calendar size={16} style={{ display: "inline", marginRight: 8 }} />
                        {format(new Date(reserva.fecha_inicio), "dd MMM yyyy HH:mm", { locale: es })}
                      </div>
                      <div className="muted">
                        <MapPin size={16} style={{ display: "inline", marginRight: 8 }} />
                        Hasta {format(new Date(reserva.fecha_fin), "HH:mm", { locale: es })}
                      </div>
                      {reserva.usuario_nombre && (
                        <div className="muted">
                          <strong>Usuario:</strong> {reserva.usuario_nombre}
                        </div>
                      )}
                      {reserva.usuario_email && (
                        <div className="muted">
                          <strong>Correo:</strong> {reserva.usuario_email}
                        </div>
                      )}
                      {reserva.usuario_rol && (
                        <div className="muted">
                          <strong>Rol:</strong> <span style={{ textTransform: "capitalize" }}>{reserva.usuario_rol}</span>
                        </div>
                      )}
                      {reserva.descripcion && <p className="muted">{reserva.descripcion}</p>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
