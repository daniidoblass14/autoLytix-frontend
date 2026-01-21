import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  /**
   * Obtiene un mensaje de error legible para el usuario basado en el error HTTP
   * @param error Error HTTP recibido
   * @param defaultMessage Mensaje por defecto si no se puede determinar el tipo de error
   * @returns Mensaje de error legible para el usuario
   */
  getUserMessage(error: HttpErrorResponse, defaultMessage: string = 'Ha ocurrido un error'): string {
    if (error.error?.mensaje) {
      return error.error.mensaje;
    }

    switch (error.status) {
      case 401:
        return 'Sesión expirada. Por favor, inicia sesión nuevamente';
      
      case 403:
        return 'No tienes permisos para realizar esta acción';
      
      case 404:
        return 'Recurso no encontrado';
      
      case 500:
        return 'Error del servidor. Por favor, intenta más tarde';
      
      case 0:
      default:
        if (!navigator.onLine) {
          return 'Sin conexión a internet. Verifica tu conexión';
        }
        return defaultMessage;
    }
  }

  /**
   * Obtiene un mensaje de error específico para carga de vehículos
   */
  getVehicleLoadErrorMessage(error: HttpErrorResponse): string {
    return this.getUserMessage(error, 'No se pudo cargar la lista de vehículos');
  }

  /**
   * Obtiene un mensaje de error específico para carga de historial de mantenimientos
   */
  getMaintenanceHistoryErrorMessage(error: HttpErrorResponse): string {
    return this.getUserMessage(error, 'No se pudo cargar el historial de servicios');
  }

  /**
   * Obtiene un mensaje de error específico para carga de dashboard
   */
  getDashboardErrorMessage(error: HttpErrorResponse): string {
    return this.getUserMessage(error, 'No se pudo cargar el dashboard. Por favor, intenta de nuevo.');
  }
}
