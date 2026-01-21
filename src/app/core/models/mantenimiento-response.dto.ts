export interface MantenimientoResponseDTO {
  id: number;
  vehiculoId: number;
  tipo: string;
  fecha: string;
  km: number;
  precio: number;
  notas?: string | null;
  proximoKm?: number | null;
  proximaFecha?: string | null;
}
