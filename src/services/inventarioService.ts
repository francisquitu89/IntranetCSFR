import { supabase } from "../lib/supabase";
import type { SalaType } from "../types";

export interface InventarioItem {
  sala: SalaType;
  cantidad: number;
}

export const inventarioService = {
  async obtenerInventario(): Promise<InventarioItem[]> {
    const { data, error } = await supabase.from("inventario").select("sala, cantidad");
    if (error) throw error;
    return (data as InventarioItem[]) || [];
  },

  async actualizarCantidad(sala: SalaType, cantidad: number): Promise<InventarioItem | null> {
    const { data, error } = await supabase
      .from("inventario")
      .upsert({ sala, cantidad }, { onConflict: "sala" })
      .select()
      .single();

    if (error) throw error;
    return (data as InventarioItem) || null;
  },
};
