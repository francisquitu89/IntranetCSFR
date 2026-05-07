import type { SalaCatalogItem } from "../types";

export const SALAS_CATALOGO: SalaCatalogItem[] = [
  { value: "Auditorio Chico", label: "Auditorio Chico", capacidad: 40, tipo: "Espacio", habilitada: true },
  { value: "Auditorio Grande", label: "Auditorio Grande", capacidad: 52, tipo: "Espacio", habilitada: true },
  { value: "Biblioteca (Cuenta Cuentos)", label: "Biblioteca (Cuenta Cuentos)", capacidad: 40, tipo: "Espacio", habilitada: true },
  { value: "Biblioteca (mesas de trabajo)", label: "Biblioteca (mesas de trabajo)", capacidad: 50, tipo: "Espacio", habilitada: true },
  { value: "Capilla", label: "Capilla", capacidad: 34, tipo: "Espacio", habilitada: true },
  { value: "Sala VIP", label: "Sala VIP", capacidad: 12, tipo: "Espacio", habilitada: true },
  { value: "Préstamo Notebooks", label: "Préstamo de Notebooks", capacidad: 30, tipo: "Objeto", habilitada: true },
  { value: "Sala 33", label: "Sala 33 (Llave P Loosli)", capacidad: 10, tipo: "Espacio", habilitada: true },
  { value: "Sala Computación", label: "Sala Computación", capacidad: 27, tipo: "Espacio", habilitada: true },
  { value: "Préstamo Tablets", label: "Préstamo de Tablets", capacidad: 59, tipo: "Objeto", habilitada: true },
];

export const SALAS_TODAS = SALAS_CATALOGO.map((sala) => sala.value);
