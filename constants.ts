
import { Ticket, TicketPriority, TicketStatus, TicketType, InventoryItem, InventoryCategory, InventoryStatus } from './types';

export const APP_NAME = "CDCE Móvil";
export const INSTITUTION_NAME = "CDCE Anzoátegui";

export const DEPARTMENTS = [
  'Atencion al ciudadano',
  'Seguro social',
  'Supervision Educativa',
  'Consultoria Juridica',
  'Bienes Nacionales',
  'Planificacion y Presupuesto',
  'CNAE',
  'CRCA',
  'Comunidades Educativas',
  'Indigena',
  'Formacion e Investigacion Docente',
  'Despacho',
  'Gobernacion',
  'Sala Situacional',
  'Sige',
  'Gestion Humana',
  'Div. Media general y media tecnica',
  'Div. Primaria y Educacion especial',
  'Informatica',
  'Prensa',
  'Fundabit',
  'Unem',
  'Auditoria',
  'Barberia & Peluqueria',
  'Entes Externos'
];

export const MOCK_TICKETS: Ticket[] = [
  {
    id: 1001,
    descripcion: "Falla de conexión en laboratorio 3",
    tipo: TicketType.REDES,
    prioridad: TicketPriority.ALTA,
    estado: TicketStatus.ABIERTO,
    departamento: "Informatica",
    solicitante: "Prof. Rodriguez",
    creado_en: "2023-10-25T09:00:00Z"
  },
  {
    id: 1002,
    descripcion: "Actualización de antivirus en administración",
    tipo: TicketType.SOFTWARE,
    prioridad: TicketPriority.MEDIA,
    estado: TicketStatus.EN_PROGRESO,
    departamento: "Gestion Humana",
    solicitante: "Lic. Pérez",
    creado_en: "2023-10-24T14:30:00Z",
    asignado_a: "Téc. García"
  },
  {
    id: 1003,
    descripcion: "Pantalla azul en PC Dirección",
    tipo: TicketType.HARDWARE,
    prioridad: TicketPriority.CRITICA,
    estado: TicketStatus.ABIERTO,
    departamento: "Despacho",
    solicitante: "Dir. González",
    creado_en: "2023-10-26T08:15:00Z"
  },
  {
    id: 1004,
    descripcion: "Solicitud de tóner impresora laser",
    tipo: TicketType.OTROS,
    prioridad: TicketPriority.BAJA,
    estado: TicketStatus.RESUELTO,
    departamento: "Gestion Humana",
    solicitante: "Asist. Martinez",
    creado_en: "2023-10-20T10:00:00Z",
    asignado_a: "Téc. López"
  }
];

export const MOCK_INVENTORY: InventoryItem[] = [
  {
    id: 501,
    nombre: "Laptop Lenovo ThinkPad",
    descripcion: "Core i5, 8GB RAM, SSD 256GB",
    categoria: InventoryCategory.EQUIPO,
    cantidad: 12,
    ubicacion: "Informatica",
    estado: InventoryStatus.ACTIVO,
    ultimo_mantenimiento: "2023-08-15T00:00:00Z",
    frecuencia_mantenimiento: "Trimestral"
  },
  {
    id: 502,
    nombre: "Cable UTP Cat6",
    descripcion: "Bobina 305m",
    categoria: InventoryCategory.CONSUMIBLE,
    cantidad: 2,
    ubicacion: "Informatica",
    estado: InventoryStatus.ACTIVO,
    ultimo_mantenimiento: "2023-10-01T00:00:00Z",
    frecuencia_mantenimiento: "Semestral"
  },
  {
    id: 503,
    nombre: "Router MikroTik",
    descripcion: "Routerboard RB750",
    categoria: InventoryCategory.EQUIPO,
    cantidad: 1,
    ubicacion: "Sala Situacional",
    estado: InventoryStatus.MANTENIMIENTO,
    ultimo_mantenimiento: "2023-09-10T00:00:00Z",
    frecuencia_mantenimiento: "Trimestral",
    tipo_mantenimiento: "Correctivo"
  },
  {
    id: 504,
    nombre: "Mouse Óptico HP",
    descripcion: "USB Negro",
    categoria: InventoryCategory.COMPONENTE,
    cantidad: 5,
    ubicacion: "Despacho",
    estado: InventoryStatus.ACTIVO,
    ultimo_mantenimiento: "2023-07-20T00:00:00Z",
    frecuencia_mantenimiento: "Semestral"
  },
  {
    id: 505,
    nombre: "Impresora Epson L3150",
    descripcion: "Multifuncional Tinta Continua",
    categoria: InventoryCategory.EQUIPO,
    cantidad: 1,
    ubicacion: "Atencion al ciudadano",
    estado: InventoryStatus.BAJA,
    ultimo_mantenimiento: "2023-01-15T00:00:00Z",
    frecuencia_mantenimiento: "Trimestral"
  },
  {
    id: 506,
    nombre: "Monitor Dell 24",
    descripcion: "P2419H",
    categoria: InventoryCategory.EQUIPO,
    cantidad: 3,
    ubicacion: "Prensa",
    estado: InventoryStatus.ACTIVO,
    ultimo_mantenimiento: "2023-09-25T00:00:00Z",
    frecuencia_mantenimiento: "Semestral"
  },
  {
    id: 507,
    nombre: "Servidor HP ProLiant",
    descripcion: "Servidor de Archivos",
    categoria: InventoryCategory.EQUIPO,
    cantidad: 1,
    ubicacion: "Informatica",
    estado: InventoryStatus.ACTIVO,
    ultimo_mantenimiento: "2023-06-01T00:00:00Z",
    frecuencia_mantenimiento: "Trimestral"
  },
  {
    id: 508,
    nombre: "Licencia Microsoft Office",
    descripcion: "Licencia por volumen",
    categoria: InventoryCategory.SOFTWARE,
    cantidad: 50,
    ubicacion: "Informatica",
    estado: InventoryStatus.ACTIVO,
    ultimo_mantenimiento: "2023-01-01T00:00:00Z",
    frecuencia_mantenimiento: "Anual"
  }
];
