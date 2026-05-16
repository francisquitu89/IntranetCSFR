import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Reserva, SalaCatalogItem } from "../types";

export const TIME_SLOTS = [
  { label: "08:15 - 09:00", start: "08:15", end: "09:00" },
  { label: "09:00 - 09:45", start: "09:00", end: "09:45" },
  { label: "09:45 - 10:30", start: "09:45", end: "10:30" },
  { label: "10:50 - 11:30", start: "10:50", end: "11:30" },
  { label: "11:30 - 12:15", start: "11:30", end: "12:15" },
  { label: "12:30 - 13:15", start: "12:30", end: "13:15" },
  { label: "13:15 - 14:00", start: "13:15", end: "14:00" },
  { label: "14:35 - 15:15", start: "14:35", end: "15:15" },
  { label: "15:15 - 16:00", start: "15:15", end: "16:00" },
  { label: "16:00 - 18:00", start: "16:00", end: "18:00" },
  { label: "19:30 - 21:00", start: "19:30", end: "21:00" },
];

const timeToDateTime = (date: string, time: string) => new Date(`${date}T${time}:00`);

const overlaps = (reservation: Reserva, slotStart: Date, slotEnd: Date) => {
  const reservationStart = new Date(reservation.fecha_inicio);
  const reservationEnd = new Date(reservation.fecha_fin);
  return reservationStart < slotEnd && reservationEnd > slotStart;
};

interface AvailabilityBoardProps {
  reservas: Reserva[];
  salas: SalaCatalogItem[];
  selectedDate: string;
  title?: string;
  subtitle?: string;
}

export function AvailabilityBoard({
  reservas,
  salas,
  selectedDate,
  title = "Disponibilidad del día",
  subtitle = "Verde = libre, rojo = reservado por...",
}: AvailabilityBoardProps) {
  const dayLabel = format(new Date(`${selectedDate}T12:00:00`), "EEEE dd MMMM yyyy", {
    locale: es,
  });

  return (
    <section className="availability-board">
      <div className="section-title-wrap">
        <div>
          <h2 className="section-title">{title}</h2>
          <p className="section-subtitle">{subtitle}</p>
        </div>
        <div className="availability-date">{dayLabel}</div>
      </div>

      <div className="availability-scroll">
        <table className="availability-table">
          <thead>
            <tr>
              <th className="availability-sticky">Periodo</th>
              {salas.map((sala) => (
                <th key={sala.value}>
                  <span className="availability-room-name">{sala.label}</span>
                  <span className="availability-room-meta">{sala.capacidad} pers. · {sala.tipo}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((slot) => {
              const slotStart = timeToDateTime(selectedDate, slot.start);
              const slotEnd = timeToDateTime(selectedDate, slot.end);

              return (
                <tr key={slot.label}>
                  <th className="availability-sticky">{slot.label}</th>
                  {salas.map((sala) => {
                    const reservasDeSala = reservas.filter((reserva) => reserva.sala === sala.value);
                    const reservaActiva = reservasDeSala.find((reserva) => overlaps(reserva, slotStart, slotEnd));
                    const isBusy = Boolean(reservaActiva);

                    return (
                      <td
                        key={`${slot.label}-${sala.value}`}
                        className={isBusy ? "slot-busy" : "slot-free"}
                        title={
                          isBusy
                            ? `${sala.label} reservado\n${format(new Date(reservaActiva!.fecha_inicio), "HH:mm")} - ${format(new Date(reservaActiva!.fecha_fin), "HH:mm")}\nPor: ${reservaActiva!.responsable_nombre || reservaActiva!.usuario_nombre || "Usuario"} (${reservaActiva!.responsable_nombre ? "Responsable" : reservaActiva!.usuario_rol || "?"})\nCorreo: ${reservaActiva!.responsable_email || reservaActiva!.usuario_email || "N/A"}`
                            : `${sala.label} libre`
                        }
                      >
                        <span>{isBusy ? (reservaActiva?.responsable_nombre || reservaActiva?.usuario_nombre || "Reservado") : "Libre"}</span>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
