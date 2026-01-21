import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FormatService {

  /**
   * Valida si una fecha es válida
   * @param date Objeto Date a validar
   * @returns true si la fecha es válida, false en caso contrario
   */
  private isValidDate(date: Date): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Convierte un input a Date válida o null
   * Maneja múltiples formatos: Date, string ISO, string YYYY-MM-DD, number (timestamp), null/undefined/""
   * @param input Input a convertir
   * @returns Date válida o null si no se puede convertir
   */
  private toDate(input: any): Date | null {
    // Si es null, undefined o string vacío
    if (input === null || input === undefined || input === '') {
      return null;
    }

    // Si ya es Date y es válida
    if (input instanceof Date) {
      return this.isValidDate(input) ? input : null;
    }

    // Si es número, asumir timestamp
    if (typeof input === 'number') {
      const date = new Date(input);
      return this.isValidDate(date) ? date : null;
    }

    // Si es string
    if (typeof input === 'string') {
      // Intentar parsear directamente
      let date = new Date(input);
      if (this.isValidDate(date)) {
        return date;
      }

      // Si falla, intentar parsear formato YYYY-MM-DD manualmente
      // Esto maneja casos como "2026-01-21" o "0000-00-00"
      const ymdMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (ymdMatch) {
        const year = parseInt(ymdMatch[1], 10);
        const month = parseInt(ymdMatch[2], 10) - 1; // Mes es 0-indexed
        const day = parseInt(ymdMatch[3], 10);

        // Validar rangos básicos
        if (year >= 1900 && year <= 2100 && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
          date = new Date(year, month, day);
          if (this.isValidDate(date)) {
            // Verificar que la fecha creada coincide con los valores esperados
            // (evita casos como 2026-02-30 que se convierte en 2026-03-02)
            if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
              return date;
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Formatea un número como kilometraje con separadores de miles
   * @param km Número a formatear
   * @returns String formateado (ej: "150.000")
   */
  formatKilometers(km: number | null | undefined): string {
    if (km === null || km === undefined) return '0';
    return new Intl.NumberFormat('es-ES').format(km);
  }

  /**
   * Formatea una fecha en formato corto en español (DD/MM/YYYY)
   * Maneja fechas inválidas, null, undefined y múltiples formatos de entrada
   * @param dateInput Fecha como string (ISO, YYYY-MM-DD), Date, number (timestamp) o null/undefined
   * @returns String formateado (ej: "15/01/2024") o "—" si la fecha es inválida
   */
  formatDate(dateInput: string | Date | number | null | undefined): string {
    const date = this.toDate(dateInput);
    
    if (!date) {
      return '—';
    }

    try {
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(date);
    } catch (error) {
      // Fallback si Intl.DateTimeFormat falla por alguna razón
      return '—';
    }
  }

  /**
   * Formatea un precio en euros
   * @param price Precio numérico
   * @returns String formateado (ej: "150,50 €")
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  }

  /**
   * Calcula el tiempo transcurrido desde una fecha (time ago)
   * Maneja fechas inválidas, null, undefined y múltiples formatos de entrada
   * @param lastDate Fecha como Date, string (ISO, YYYY-MM-DD), number (timestamp) o null/undefined
   * @returns String descriptivo (ej: "Hace 2 días", "Hace 1 mes") o "—" si la fecha es inválida
   */
  timeAgo(lastDate: Date | string | number | null | undefined): string {
    const date = this.toDate(lastDate);
    
    if (!date) {
      return '—';
    }

    const now = new Date();
    
    // Calcular diferencia en milisegundos
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Si es menos de 1 día, mostrar horas/minutos
    if (diffDays < 1) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return diffMinutes <= 1 ? 'Hace menos de un minuto' : `Hace ${diffMinutes} minutos`;
      }
      return diffHours === 1 ? 'Hace 1 hora' : `Hace ${diffHours} horas`;
    }
    
    // Si es menos de 30 días, mostrar días
    if (diffDays < 30) {
      return diffDays === 1 ? 'Hace 1 día' : `Hace ${diffDays} días`;
    }
    
    // Calcular meses
    const diffMonths = Math.floor(diffDays / 30);
    
    // Si es menos de 12 meses, mostrar meses
    if (diffMonths < 12) {
      return diffMonths === 1 ? 'Hace 1 mes' : `Hace ${diffMonths} meses`;
    }
    
    // Calcular años
    const diffYears = Math.floor(diffMonths / 12);
    return diffYears === 1 ? 'Hace 1 año' : `Hace ${diffYears} años`;
  }
}
