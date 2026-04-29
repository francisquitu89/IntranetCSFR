import { useEffect, useMemo, useState } from "react";
import { Plus, Calendar, MapPin, ShieldCheck, Ban } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "../lib/supabase";
import { AvailabilityBoard, TIME_SLOTS } from "../components/AvailabilityBoard";
import { reservasService } from "../services/reservasService";
import { SALAS_CATALOGO } from "../data/salas";
import type { Reserva, Usuario, SalaType } from "../types";

interface ReservasPageProps {
  usuario: Usuario | null;
}

const getLocalDateInput = () => new Date().toLocaleDateString("en-CA");
const overlaps = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) => aStart < bEnd && aEnd > bStart;
const timeToDateTime = (date: string, time: string) => new Date(`${date}T${time}:00`);

export function ReservasPage({ usuario }: ReservasPageProps) {
  const [reservasUsuario, setReservasUsuario] = useState<Reserva[]>([]);
  const [reservasDelDia, setReservasDelDia] = useState<Reserva[]>([]);
  const [selectedDate, setSelectedDate] = useState(getLocalDateInput());
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    sala: SALAS_CATALOGO[0].value,
    horarioInicio: "",
    horarioFin: "",
    descripcion: "",
  });

  useEffect(() => {
    const cargarDatos = async () => {
      if (!usuario) return;

      try {
        setLoading(true);
        const [reservasPersonales, reservasGlobales] = await Promise.all([
          reservasService.obtenerReservasUsuario(usuario.id),
          reservasService.obtenerReservasConfirmadasPorFecha(selectedDate),
        ]);

        setReservasUsuario(reservasPersonales);
        setReservasDelDia(reservasGlobales);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    void cargarDatos();

    const channel = supabase
      .channel("reservas-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservas" }, () => {
        void (async () => {
          if (!usuario) return;
          const [reservasPersonales, reservasGlobales] = await Promise.all([
            reservasService.obtenerReservasUsuario(usuario.id),
            reservasService.obtenerReservasConfirmadasPorFecha(selectedDate),
          ]);
          setReservasUsuario(reservasPersonales);
          setReservasDelDia(reservasGlobales);
        })();
      })
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
      SALAS_CATALOGO.map((sala) => ({
        ...sala,
        disponible: salaDisponible(sala.value),
      })),
    [reservasDelDia, formData.horarioFin, formData.horarioInicio]
  );

  const startIndex = formData.horarioInicio ? TIME_SLOTS.findIndex((slot) => slot.start === formData.horarioInicio) : -1;
  const availableEndSlots = startIndex >= 0 ? TIME_SLOTS.slice(startIndex) : TIME_SLOTS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;

    if (!formData.horarioInicio || !formData.horarioFin) {
      setError("Debes completar el horario de inicio y fin.");
      return;
    }

    const startSlot = TIME_SLOTS.find((slot) => slot.start === formData.horarioInicio);
    const endSlot = TIME_SLOTS.find((slot) => slot.end === formData.horarioFin);

    if (!startSlot || !endSlot) {
      setError("Debes seleccionar bloques horarios válidos.");
      return;
    }

    const fechaInicio = timeToDateTime(selectedDate, startSlot.start).toISOString();
    const fechaFin = timeToDateTime(selectedDate, endSlot.end).toISOString();

    if (!salaDisponible(formData.sala)) {
      setError("Esta sala ya está ocupada en ese horario.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await reservasService.crearReserva(
        usuario.id,
        formData.sala,
        fechaInicio,
        fechaFin,
        formData.descripcion
      );

      setFormData({
        sala: SALAS_CATALOGO[0].value,
        horarioInicio: "",
        horarioFin: "",
        descripcion: "",
      });
      setShowForm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (reservaId: string) => {
    if (!confirm("¿Deseas eliminar esta reserva definitivamente?")) return;

    try {
      await reservasService.eliminarReserva(reservaId);
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
            <div className="metric-value">{reservasUsuario.length}</div>
          </div>
          <div className="metric-card">
            <div className="metric-head"><ShieldCheck size={18} /> Habilitadas hoy</div>
            <div className="metric-value">{salaStatus.filter((item) => item.disponible).length}</div>
          </div>
          <div className="metric-card">
            <div className="metric-head"><Ban size={18} /> Ocupadas hoy</div>
            <div className="metric-value">{salaStatus.filter((item) => !item.disponible).length}</div>
          </div>
          <div className="metric-card">
            <div className="metric-head"><MapPin size={18} /> Reservas del día</div>
            <div className="metric-value">{reservasDelDia.length}</div>
          </div>
        </div>

        {error && <div className="alert" style={{ marginBottom: "1rem" }}>{error}</div>}

        {showForm && (
          <section className="form-card" style={{ marginTop: "1rem" }}>
            <h2 className="section-title" style={{ marginBottom: "0.25rem" }}>Crear nueva reserva</h2>
            <p className="section-subtitle">Selecciona sala, horario y una breve descripción.</p>

            <form onSubmit={handleSubmit} className="field-grid" style={{ marginTop: "1rem" }}>
              <div className="field-grid two">
                <div className="field">
                  <label>Sala</label>
                  <select
                    value={formData.sala}
                    onChange={(e) => setFormData({ ...formData, sala: e.target.value as SalaType })}
                    className="select"
                  >
                    {SALAS_CATALOGO.map((sala) => (
                      <option key={sala.value} value={sala.value} disabled={!salaDisponible(sala.value)}>
                        {salaDisponible(sala.value) ? `${sala.label} · ${sala.capacidad} pers.` : `${sala.label} (ocupada)`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Fecha y hora inicio</label>
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
                  <label>Fecha y hora fin</label>
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

                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label>Descripción opcional</label>
                  <input
                    type="text"
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Describe tu reserva..."
                    className="input"
                  />
                </div>
              </div>

              <div className="actions">
                <button type="submit" disabled={loading || !salaDisponible(formData.sala)} className="button">
                  {loading ? "Guardando..." : "Guardar reserva"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="button-secondary">
                  Cancelar
                </button>
              </div>

              {!salaDisponible(formData.sala) && formData.horarioInicio && formData.horarioFin && (
                <div className="alert">La sala seleccionada ya está ocupada para ese horario.</div>
              )}
            </form>
          </section>
        )}

        <AvailabilityBoard
          reservas={reservasDelDia}
          salas={SALAS_CATALOGO}
          selectedDate={selectedDate}
          title="Disponibilidad del día"
          subtitle="Si otro usuario ya tomó el horario, la sala queda marcada como ocupada"
        />

        {loading && <div className="empty-state" style={{ marginTop: "1rem" }}>Cargando...</div>}

        {reservasUsuario.length === 0 && !loading && (
          <div className="empty-state" style={{ marginTop: "1rem" }}>
            <div className="empty-badge">Sin reservas</div>
            <h3 style={{ margin: "0.9rem 0 0.35rem" }}>No hay reservas todavía</h3>
            <p className="muted">Crea la primera reserva para empezar a organizar salas y equipos.</p>
          </div>
        )}

        <div className="grid-2" style={{ marginTop: "1rem" }}>
          {reservasUsuario.map((reserva) => (
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
                    <button onClick={() => handleEliminar(reserva.id)} className="button-secondary" aria-label="Eliminar reserva">
                      Eliminar
                    </button>
                  </div>
                )}
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
                {reserva.descripcion && <p className="muted">{reserva.descripcion}</p>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
