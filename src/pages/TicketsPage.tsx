import { useState, useEffect } from "react";
import { Plus, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ticketsService } from "../services/ticketsService";
import type { Ticket, Usuario, TicketCategoryType, TicketPriorityType, SalaType } from "../types";

interface TicketsPageProps {
  usuario: Usuario | null;
}

const CATEGORIAS: TicketCategoryType[] = [
  "Requerimientos Audiovisuales",
  "Requerimientos Mantención",
  "Requerimientos SSGG",
  "Requerimientos TI",
  "Requerimientos Administración y finanzas",
  "Eventos especiales",
  "Otros",
];

const PRIORIDADES: TicketPriorityType[] = ["Baja", "Media", "Alta", "Urgente"];

const SALAS: SalaType[] = [
  "Auditorio Grande",
  "Auditorio Chico",
  "Biblioteca (Cuenta Cuentos)",
  "Biblioteca (mesas trabajo)",
  "Sala VIP",
  "Sala 33",
  "Sala Computación",
  "Préstamo Notebooks",
  "Préstamo Tablets",
];

export function TicketsPage({ usuario }: TicketsPageProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    categoria: CATEGORIAS[0],
    asunto: "",
    descripcion: "",
    prioridad: "Media" as TicketPriorityType,
    sala: "",
    equipo: "",
  });

  useEffect(() => {
    cargarTickets();
  }, [usuario]);

  const cargarTickets = async () => {
    if (!usuario) return;
    try {
      setLoading(true);
      const data = await ticketsService.obtenerTicketsUsuario(usuario.id);
      setTickets(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;

    setError("");
    setLoading(true);

    try {
      await ticketsService.crearTicket(
        usuario.id,
        formData.categoria,
        formData.asunto,
        formData.descripcion,
        formData.prioridad,
        formData.sala ? (formData.sala as SalaType) : undefined,
        formData.equipo || undefined
      );

      setFormData({
        categoria: CATEGORIAS[0],
        asunto: "",
        descripcion: "",
        prioridad: "Media",
        sala: "",
        equipo: "",
      });
      setShowForm(false);
      await cargarTickets();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const priorityClass = (prioridad: string) => {
    switch (prioridad) {
      case "Urgente":
      case "Alta":
        return "priority-high";
      case "Media":
        return "priority-med";
      default:
        return "priority-low";
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case "Resuelto":
        return <CheckCircle className="text-green-500" size={20} />;
      case "En Progreso":
        return <Clock className="text-yellow-500" size={20} />;
      default:
        return <AlertCircle className="text-red-500" size={20} />;
    }
  };

  return (
    <main className="app-content hero" style={{ paddingTop: "2rem" }}>
      <div className="container-max">
        <div className="section-title-wrap">
          <div>
            <h1 className="section-title">Mis tickets</h1>
            <p className="section-subtitle">Solicitudes de soporte con una interfaz más limpia y tecnológica.</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="button">
            <Plus size={18} />
            Nuevo ticket
          </button>
        </div>

        {error && <div className="alert" style={{ marginBottom: "1rem" }}>{error}</div>}

        {showForm && (
          <section className="form-card" style={{ marginBottom: "1rem" }}>
            <h2 className="section-title" style={{ marginBottom: "0.25rem" }}>Crear nuevo ticket</h2>
            <p className="section-subtitle">Clasifica el problema y deja claro el contexto desde el principio.</p>

            <form onSubmit={handleSubmit} className="field-grid" style={{ marginTop: "1rem" }}>
              <div className="field-grid two">
                <div className="field">
                  <label>Categoría *</label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value as TicketCategoryType })}
                    className="select"
                  >
                    {CATEGORIAS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Prioridad *</label>
                  <select
                    value={formData.prioridad}
                    onChange={(e) => setFormData({ ...formData, prioridad: e.target.value as TicketPriorityType })}
                    className="select"
                  >
                    {PRIORIDADES.map((pri) => (
                      <option key={pri} value={pri}>
                        {pri}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label>Asunto *</label>
                  <input
                    type="text"
                    value={formData.asunto}
                    onChange={(e) => setFormData({ ...formData, asunto: e.target.value })}
                    required
                    placeholder="Resumen breve del problema..."
                    className="input"
                  />
                </div>

                <div className="field">
                  <label>Sala opcional</label>
                  <select
                    value={formData.sala}
                    onChange={(e) => setFormData({ ...formData, sala: e.target.value })}
                    className="select"
                  >
                    <option value="">Selecciona una sala...</option>
                    {SALAS.map((sala) => (
                      <option key={sala} value={sala}>
                        {sala}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field" style={{ gridColumn: "1 / -1" }}>
                  <label>Equipo opcional</label>
                  <input
                    type="text"
                    value={formData.equipo}
                    onChange={(e) => setFormData({ ...formData, equipo: e.target.value })}
                    placeholder="Especifica el equipo afectado..."
                    className="input"
                  />
                </div>
              </div>

              <div className="field">
                <label>Descripción *</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  required
                  placeholder="Describe el problema en detalle..."
                  rows={4}
                  className="textarea"
                />
              </div>

              <div className="actions">
                <button type="submit" disabled={loading} className="button">
                  {loading ? "Guardando..." : "Crear ticket"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="button-secondary">
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        )}

        {loading && <div className="empty-state">Cargando...</div>}

        {tickets.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-badge">Sin tickets</div>
            <h3 style={{ margin: "0.9rem 0 0.35rem" }}>No hay tickets todavía</h3>
            <p className="muted">Crea un ticket nuevo si detectas un problema o necesitas ayuda.</p>
          </div>
        )}

        <div className="card-grid">
          {tickets.map((ticket) => (
            <article key={ticket.id} className="stat-card">
              <div className="section-title-wrap" style={{ marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div className="stat-icon orange">{getStatusIcon(ticket.estado)}</div>
                  <div>
                    <h3 className="card-title">{ticket.asunto}</h3>
                    <p className="muted" style={{ margin: 0 }}>{ticket.categoria}</p>
                  </div>
                </div>
                <span className={`priority-pill ${priorityClass(ticket.prioridad)}`}>{ticket.prioridad}</span>
              </div>

              <p className="muted">{ticket.descripcion}</p>

              <div className="grid-4" style={{ marginTop: "1rem" }}>
                <div><span className="muted">Estado</span><br />{ticket.estado}</div>
                {ticket.sala && <div><span className="muted">Sala</span><br />{ticket.sala}</div>}
                {ticket.equipo && <div><span className="muted">Equipo</span><br />{ticket.equipo}</div>}
                <div><span className="muted">Creado</span><br />{format(new Date(ticket.created_at), "dd MMM yyyy", { locale: es })}</div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
