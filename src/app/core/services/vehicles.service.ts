import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { VehiculoResponseDTO } from '../models/vehiculo-response.dto';
import { ApiMessageResponse } from '../models/login-response.dto';

export interface VehiculoKmUpdateRequestDTO {
  kmActuales: number;
}

export interface VehiculoUpdateRequestDTO {
  matricula: string;
  marca: string;
  modelo: string;
  anio: number;
  kmActuales: number;
}

@Injectable({
  providedIn: 'root'
})
export class VehiclesService {
  private readonly API_URL = `${environment.apiUrl}/api/usuarios`;
  private readonly VEHICLES_API_URL = `${environment.apiUrl}/api/vehiculos`;

  constructor(private http: HttpClient) {}

  getVehicles(): Observable<VehiculoResponseDTO[]> {
    return this.http.get<VehiculoResponseDTO[]>(`${this.API_URL}/me/vehiculos`);
  }

  getVehicleById(id: number): Observable<VehiculoResponseDTO> {
    return this.http.get<VehiculoResponseDTO>(`${this.VEHICLES_API_URL}/${id}`);
  }

  updateVehicleKm(vehicleId: number, kmActuales: number): Observable<VehiculoResponseDTO> {
    const body: VehiculoKmUpdateRequestDTO = { kmActuales };
    return this.http.put<VehiculoResponseDTO>(`${this.VEHICLES_API_URL}/${vehicleId}/km`, body);
  }

  updateVehicle(vehicleId: number, body: VehiculoUpdateRequestDTO): Observable<VehiculoResponseDTO> {
    return this.http.put<VehiculoResponseDTO>(`${this.VEHICLES_API_URL}/${vehicleId}`, body);
  }

  createVehicle(body: VehiculoUpdateRequestDTO): Observable<VehiculoResponseDTO> {
    return this.http.post<VehiculoResponseDTO>(this.VEHICLES_API_URL, body);
  }

  deleteVehicle(vehicleId: number): Observable<void> {
    return this.http.delete<void>(`${this.VEHICLES_API_URL}/${vehicleId}`);
  }
}
