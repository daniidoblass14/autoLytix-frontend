import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MantenimientoResponseDTO } from '../models/mantenimiento-response.dto';
import { MantenimientoRequestDTO } from '../models/mantenimiento-request.dto';

@Injectable({
  providedIn: 'root'
})
export class MaintenanceService {
  private readonly API_URL = `${environment.apiUrl}/api/mantenimientos`;

  constructor(private http: HttpClient) {}

  getByVehicleId(vehicleId: number): Observable<MantenimientoResponseDTO[]> {
    return this.http.get<MantenimientoResponseDTO[]>(`${this.API_URL}/vehiculo/${vehicleId}`);
  }

  create(mantenimiento: MantenimientoRequestDTO): Observable<MantenimientoResponseDTO> {
    return this.http.post<MantenimientoResponseDTO>(this.API_URL, mantenimiento);
  }

  update(id: number, mantenimiento: MantenimientoRequestDTO): Observable<MantenimientoResponseDTO> {
    return this.http.put<MantenimientoResponseDTO>(`${this.API_URL}/${id}`, mantenimiento);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
