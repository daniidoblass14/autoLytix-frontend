import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Interfaces que reflejan el DTO real del backend
export interface NextMaintenance {
  kmRemaining: number | null;
  daysRemaining: number | null;
  vehicleId: number;
  vehicleLabel: string;
  maintenanceType: string | null;
  message: string | null;
  status: 'ok' | 'warning' | 'overdue';
  dueDate: string | null;
}

export interface LastKmUpdate {
  daysAgo: number;
  vehicleId: number;
  vehicleLabel: string;
  currentKm: number;
  updatedAt: string;
}

export interface DashboardStats {
  totalVehicles: number;
  activeAlerts: number;
  nextMaintenance: NextMaintenance | null;
  lastKmUpdate: LastKmUpdate | null;
}

export interface DashboardAlert {
  id: number;
  vehicleId: number;
  vehicleLabel: string;
  maintenanceId: number | null;
  maintenanceType: string | null;
  message: string;
  type: 'warning' | 'danger' | 'info';
  priority: 'high' | 'medium' | 'low';
  overdueKm: number | null;
  overdueDays: number | null;
  dueKm: number | null;
  currentKm: number | null;
  dueDate: string | null;
}

export interface DashboardActivity {
  id: string;
  type: 'mileage' | 'maintenance' | 'vehicle';
  title: string;
  vehicleId: number;
  vehicleLabel: string;
  description: string;
  timestamp: string;
  timeAgo: string | null;
  // Campos adicionales según el tipo
  value?: number; // Para tipo 'mileage'
  maintenanceType?: string; // Para tipo 'maintenance'
}

export interface DashboardResponse {
  stats: DashboardStats;
  alerts: DashboardAlert[];
  activity: DashboardActivity[];
}

export interface DashboardQueryParams {
  limitAlerts?: string;
  limitActivity?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly API_URL = `${environment.apiUrl}/api/usuarios`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los datos del dashboard en una sola llamada
   * @param limitAlerts Límite de alertas a retornar (default: 5)
   * @param limitActivity Límite de actividades a retornar (default: 5)
   * @returns Observable con la respuesta completa del dashboard
   */
  getDashboard(
    limitAlerts: number = 5, 
    limitActivity: number = 5
  ): Observable<DashboardResponse> {
    let params = new HttpParams();
    if (limitAlerts !== 5) {
      params = params.set('limitAlerts', limitAlerts.toString());
    }
    if (limitActivity !== 5) {
      params = params.set('limitActivity', limitActivity.toString());
    }

    return this.http.get<DashboardResponse>(
      `${this.API_URL}/me/dashboard`,
      { params }
    );
  }
}
