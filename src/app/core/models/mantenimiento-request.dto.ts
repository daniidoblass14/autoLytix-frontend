export interface MantenimientoRequestDTO {
  vehiculoId: number;
  tipo: string;
  fecha: string;
  km: number;
  precio: number;
  notas?: string | null;
  proximoKm?: number | null;
  proximaFecha?: string | null;
}
