export interface VehiculoResponseDTO {
  id: number;
  matricula: string;
  marca: string;
  modelo: string;
  anio: number;
  kmActuales: number;
  usuarioId: number;
  fechaActualizacionKm?: string | null;
}
