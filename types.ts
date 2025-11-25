
export enum TicketPriority {
  BAJA = 'Baja',
  MEDIA = 'Media',
  ALTA = 'Alta',
  CRITICA = 'Crítica'
}

export enum TicketStatus {
  ABIERTO = 'Abierto',
  EN_PROGRESO = 'En Progreso',
  RESUELTO = 'Resuelto',
  CERRADO = 'Cerrado'
}

export enum TicketType {
  SOPORTE = 'Soporte',
  SOFTWARE = 'Software',
  REDES = 'Redes',
  HARDWARE = 'Hardware',
  OTROS = 'Otros'
}

export interface Ticket {
  id: number;
  descripcion: string;
  tipo: TicketType;
  prioridad: TicketPriority;
  estado: TicketStatus;
  departamento: string;
  solicitante: string;
  creado_en: string; // ISO Date string
  actualizado_en?: string; // ISO Date string
  asignado_a?: string;
  solucion?: string;
}

export enum InventoryCategory {
  EQUIPO = 'Equipo',
  COMPONENTE = 'Componente',
  CONSUMIBLE = 'Consumible',
  SOFTWARE = 'Software',
  OTROS = 'Otros'
}

export enum InventoryStatus {
  ACTIVO = 'Activo',
  INACTIVO = 'Inactivo',
  MANTENIMIENTO = 'Mantenimiento',
  BAJA = 'Baja'
}

export type MaintenanceFrequency = 'Trimestral' | 'Semestral' | 'Anual';

export interface InventoryItem {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: InventoryCategory;
  cantidad: number;
  ubicacion: string; // Maps to DEPARTMENTS
  estado: InventoryStatus;
  codigo_barras?: string;
  ultimo_mantenimiento?: string; // ISO Date string
  frecuencia_mantenimiento?: MaintenanceFrequency;
  tipo_mantenimiento?: 'Preventivo' | 'Correctivo'; // For tracking current plan status
}

export interface StatMetric {
  label: string;
  value: string | number;
  change?: string;
  color: 'blue' | 'red' | 'green' | 'yellow';
}

export enum AppView {
  DASHBOARD = 'dashboard',
  TICKETS = 'tickets',
  INVENTORY = 'inventory',
  AI_REPORT = 'ai_report',
  HISTORY = 'history'
}