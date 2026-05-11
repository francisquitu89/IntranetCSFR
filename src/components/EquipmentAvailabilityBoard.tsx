import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Reserva, SalaCatalogItem } from "../types";
import { TIME_SLOTS } from "./AvailabilityBoard";

interface EquipmentAvailabilityBoardProps {
  reservas: Reserva[];
  equipos: SalaCatalogItem[];
  selectedDate: string;
  inventario: Record<string, number>;
  title?: string;
  subtitle?: string;
}

const timeToDateTime = (date: string, time: string) => new Date(`${date}T${time}:00`);

const overlaps = (reservation: Reserva, slotStart: Date, slotEnd: Date) => {
  const reservationStart = new Date(reservation.fecha_inicio);
  const reservationEnd = new Date(reservation.fecha_fin);
  return reservationStart < slotEnd && reservationEnd > slotStart;
};

export function EquipmentAvailabilityBoard({
  reservas,
  equipos,
  selectedDate,
  inventario,
  title = "Disponibilidad de equipos",
  subtitle = "Muestra la cantidad de equipos disponibles en cada horario",
}: EquipmentAvailabilityBoardProps) {
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
              {equipos.map((equipo) => {
                const cantidadTotal = inventario[equipo.value] ?? equipo.capacidad;
                return (
                  <th key={equipo.value}>
                    <span className="availability-room-name">{equipo.label}</span>
                    <span className="availability-room-meta">Total: {cantidadTotal} unidades</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((slot) => {
              const slotStart = timeToDateTime(selectedDate, slot.start);
              const slotEnd = timeToDateTime(selectedDate, slot.end);

              return (
                <tr key={slot.label}>
                  <th className="availability-sticky">{slot.label}</th>
                  {equipos.map((equipo) => {
                    const cantidadTotal = inventario[equipo.value] ?? equipo.capacidad;
                    const reservasDelEquipo = reservas.filter((reserva) => reserva.sala === equipo.value);
                    const reservasEnHorario = reservasDelEquipo.filter((reserva) =>
                      overlaps(reserva, slotStart, slotEnd)
                    );

                    const cantidadReservada = reservasEnHorario.reduce((acc, r) => acc + (r.cantidad || 1), 0);
                    const disponible = cantidadTotal - cantidadReservada;
                    const porcentajeOcupado = Math.round((cantidadReservada / cantidadTotal) * 100);

                    // Determinar clase CSS basada en disponibilidad
                    let className = "slot-free";
                    if (disponible === 0) {
                      className = "slot-busy";
                    } else if (disponible < cantidadTotal * 0.3) {
                      className = "slot-warning";
                    }

                    // Crear lista de quiénes tienen reserva en este horario
                    const usuariosReservando = reservasEnHorario
                      .map((r) => `${r.usuario_nombre || "Usuario"} (${r.usuario_rol || "?"}) - ${r.cantidad || 1} ${r.cantidad && r.cantidad > 1 ? "dispositivos" : "dispositivo"}`)
                      .join("\n");

                    return (
                      <td
                        key={`${slot.label}-${equipo.value}`}
                        className={className}
                        title={
                          disponible > 0
                            ? `${equipo.label}\nDisponibles: ${disponible}/${cantidadTotal}\nOcupados: ${reservasEnHorario.length} (${porcentajeOcupado}%)`
                            : `${equipo.label}\nSIN DISPONIBILIDAD\nReservados por:\n${usuariosReservando}`
                        }
                        style={{
                          fontWeight: "bold",
                          fontSize: "1rem",
                          minWidth: "70px",
                          textAlign: "center",
                        }}
                      >
                        <span style={{
                          display: "block",
                          fontSize: "1.1rem",
                          fontWeight: "900",
                          letterSpacing: "0.5px",
                        }}>
                          {disponible > 0 ? `${disponible}/${cantidadTotal}` : "❌"}
                        </span>
                        <span style={{
                          display: "block",
                          fontSize: "0.8rem",
                          opacity: 0.9,
                          marginTop: "2px",
                        }}>
                          {porcentajeOcupado}%
                        </span>
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
