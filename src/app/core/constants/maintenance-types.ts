/**
 * Constantes y utilidades para tipos de mantenimiento
 */

export interface MaintenanceTypeOption {
  value: string;
  label: string;
}

/**
 * Array de opciones de tipos de mantenimiento para selects
 */
export const MAINTENANCE_TYPES: MaintenanceTypeOption[] = [
  { value: 'ACEITE', label: 'Aceite' },
  { value: 'NEUMATICOS', label: 'Neumáticos' },
  { value: 'ITV', label: 'ITV' },
  { value: 'FRENOS', label: 'Frenos' },
  { value: 'SEGURO', label: 'Seguro' },
  { value: 'FILTROS', label: 'Filtros' },
  { value: 'BATERIA', label: 'Batería' },
  { value: 'REVISION', label: 'Revisión' },
  { value: 'OTROS', label: 'Otros' }
];

/**
 * Mapa de tipos de mantenimiento para búsqueda rápida
 */
const MAINTENANCE_TYPES_MAP: { [key: string]: string } = {
  'ACEITE': 'Aceite',
  'NEUMATICOS': 'Neumáticos',
  'ITV': 'ITV',
  'FRENOS': 'Frenos',
  'SEGURO': 'Seguro',
  'FILTROS': 'Filtros',
  'BATERIA': 'Batería',
  'REVISION': 'Revisión',
  'OTROS': 'Otros'
};

/**
 * Obtiene la etiqueta legible de un tipo de mantenimiento
 * @param tipo Tipo de mantenimiento (enum value)
 * @returns Etiqueta legible o el tipo original si no se encuentra
 */
export function getTipoLabel(tipo: string): string {
  return MAINTENANCE_TYPES_MAP[tipo] || tipo;
}

/**
 * Mapa de iconos para tipos de mantenimiento
 */
export const MAINTENANCE_TYPE_ICONS: { [key: string]: string } = {
  'ACEITE': 'water-outline',
  'NEUMATICOS': 'disc-outline',
  'ITV': 'document-text-outline',
  'FRENOS': 'stop-circle-outline',
  'SEGURO': 'shield-checkmark-outline',
  'FILTROS': 'funnel-outline',
  'BATERIA': 'battery-charging-outline',
  'REVISION': 'construct-outline',
  'OTROS': 'ellipse-outline'
};

/**
 * Obtiene el icono para un tipo de mantenimiento
 * @param tipo Tipo de mantenimiento (enum value)
 * @returns Nombre del icono o 'build-outline' por defecto
 */
export function getTipoIcon(tipo: string): string {
  return MAINTENANCE_TYPE_ICONS[tipo] || 'build-outline';
}
