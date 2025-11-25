
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Ticket as TicketIcon, 
  Package, 
  BrainCircuit, 
  Plus, 
  Search, 
  Bell, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  X,
  Save,
  Trash2,
  Mail,
  Archive,
  Settings,
  Download,
  Upload,
  RefreshCw,
  Database,
  Timer,
  FileText,
  File,
  Moon,
  Sun,
  User,
  BellRing,
  CalendarClock,
  Wrench,
  CalendarCheck,
  AlertTriangle,
  Building,
  FileOutput,
  Sheet,
  Eraser,
  MessageCircle,
  Share2,
  Calendar,
  MoreVertical,
  Trophy,
  ArrowLeft,
  History
} from 'lucide-react';
import { 
  PieChart,
  Pie,
  Cell,
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { jsPDF } from "jspdf";

import { MOCK_TICKETS, MOCK_INVENTORY, DEPARTMENTS } from './constants';
import { 
  AppView, 
  Ticket, 
  InventoryItem, 
  TicketPriority, 
  TicketStatus, 
  InventoryStatus, 
  TicketType, 
  InventoryCategory,
  MaintenanceFrequency
} from './types';
import { StatCard } from './components/StatCard';
import { generateAIReport } from './services/geminiService';

// --- Helper Components ---

function TicketBadge({ priority }: { priority: TicketPriority }) {
  let colorClass = "";
  switch (priority) {
    case TicketPriority.CRITICA: colorClass = "bg-red-50 text-red-700 border-red-100 ring-1 ring-red-100"; break;
    case TicketPriority.ALTA: colorClass = "bg-orange-50 text-orange-700 border-orange-100 ring-1 ring-orange-100"; break;
    case TicketPriority.MEDIA: colorClass = "bg-blue-50 text-blue-700 border-blue-100 ring-1 ring-blue-100"; break;
    case TicketPriority.BAJA: colorClass = "bg-green-50 text-green-700 border-green-100 ring-1 ring-green-100"; break;
  }
  return <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${colorClass}`}>{priority}</span>;
}

function StatusBadge({ status }: { status: TicketStatus }) {
  let icon = <Clock size={12} />;
  let colorClass = "bg-gray-50 text-gray-600 border-gray-200";
  
  if (status === TicketStatus.RESUELTO) {
    icon = <CheckCircle2 size={12} />;
    colorClass = "bg-emerald-50 text-emerald-700 border-emerald-100";
  } else if (status === TicketStatus.EN_PROGRESO) {
    icon = <Clock size={12} />;
    colorClass = "bg-blue-50 text-blue-700 border-blue-100";
  } else if (status === TicketStatus.ABIERTO) {
    icon = <AlertCircle size={12} />;
    colorClass = "bg-amber-50 text-amber-700 border-amber-100";
  } else if (status === TicketStatus.CERRADO) {
    icon = <Archive size={12} />;
    colorClass = "bg-slate-100 text-slate-600 border-slate-200";
  }

  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${colorClass}`}>
      {icon} {status}
    </span>
  );
}

function StockBadge({ quantity }: { quantity: number }) {
  const isLow = quantity < 5;
  const isCritical = quantity === 0;
  
  return (
    <div className={`flex flex-col items-end`}>
      <span className={`text-lg font-bold leading-none ${isCritical ? 'text-red-600' : isLow ? 'text-orange-500' : 'text-slate-700'}`}>
        {quantity}
      </span>
      <span className="text-[9px] text-gray-400 uppercase font-medium tracking-wide">Stock</span>
    </div>
  );
}

function InventoryStatusBadge({ status }: { status: InventoryStatus }) {
  let color = 'bg-gray-100 text-gray-600';
  switch (status) {
    case InventoryStatus.ACTIVO: color = 'bg-emerald-100 text-emerald-700'; break;
    case InventoryStatus.INACTIVO: color = 'bg-gray-200 text-gray-600'; break;
    case InventoryStatus.MANTENIMIENTO: color = 'bg-amber-100 text-amber-700'; break;
    case InventoryStatus.BAJA: color = 'bg-red-100 text-red-700'; break;
  }
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${color} uppercase tracking-wide`}>
      {status}
    </span>
  );
}

interface NavItemProps {
  view: AppView;
  currentView: AppView;
  onSelect: (view: AppView) => void;
  icon: React.ReactNode;
  label: string;
}

function NavItem({ view, currentView, onSelect, icon, label }: NavItemProps) {
  const isActive = currentView === view;
  // History view keeps the Tickets tab active for UX
  const isEffectiveActive = isActive || (view === AppView.TICKETS && currentView === AppView.HISTORY);
  
  return (
    <button 
      onClick={() => onSelect(view)}
      className={`relative flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${isEffectiveActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
    >
      {isEffectiveActive && (
        <div className="absolute -top-0.5 w-8 h-1 bg-blue-600 rounded-b-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
      )}
      <div className={`mb-1 transition-transform duration-200 ${isEffectiveActive ? 'scale-110 -translate-y-0.5' : ''}`}>
        {icon}
      </div>
      <span className={`text-[10px] font-medium transition-opacity duration-200 ${isEffectiveActive ? 'opacity-100' : 'opacity-70'}`}>{label}</span>
    </button>
  );
}

function formatDuration(ticket: Ticket): string {
  const start = new Date(ticket.creado_en).getTime();
  const end = (ticket.estado === TicketStatus.RESUELTO || ticket.estado === TicketStatus.CERRADO) && ticket.actualizado_en
    ? new Date(ticket.actualizado_en).getTime()
    : Date.now();
  
  const diffMins = Math.floor((end - start) / 60000);
  
  if (diffMins < 1) return "Hace un momento";
  
  const days = Math.floor(diffMins / 1440);
  const hours = Math.floor((diffMins % 1440) / 60);
  const mins = diffMins % 60;
  
  if (days > 0) return `Hace ${days}d`;
  if (hours > 0) return `Hace ${hours}h`;
  return `Hace ${mins}m`;
}

function Toast({ message, type, visible }: { message: string, type: 'success' | 'info', visible: boolean }) {
  if (!visible) return null;
  return (
    <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-xl z-[70] text-sm font-medium flex items-center gap-3 animate-fade-in-down ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white'}`}>
      {type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      {message}
    </div>
  );
}

// --- Export Functions General ---

const exportToPDF = (title: string, headers: string[], data: any[]) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  doc.setFontSize(10);
  doc.text(`Generado: ${new Date().toLocaleString()}`, 14, 30);
  
  let y = 40;
  const pageHeight = doc.internal.pageSize.height;
  
  data.forEach((row, i) => {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 20;
    }
    const text = Object.values(row).join(' | ');
    const lines = doc.splitTextToSize(`${i + 1}. ${text}`, 180);
    doc.text(lines, 14, y);
    y += (lines.length * 7); 
  });
  
  doc.save(`${title.toLowerCase().replace(/\s/g, '_')}.pdf`);
};

const exportToWord = (title: string, data: any[]) => {
  const tableRows = data.map(row => {
    return `<tr>${Object.values(row).map(val => `<td style="border:1px solid #000; padding: 5px;">${val}</td>`).join('')}</tr>`;
  }).join('');

  const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>${title}</title></head>
    <body>
      <h1>${title}</h1>
      <p>Generado: ${new Date().toLocaleString()}</p>
      <table style="width:100%; border-collapse: collapse; font-family: Arial, sans-serif;">
        <thead style="background-color: #f0f0f0; font-weight: bold;">
          <tr>${Object.keys(data[0] || {}).map(k => `<th style="border:1px solid #000; padding: 5px;">${k}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </body>
    </html>
  `;
  
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.toLowerCase().replace(/\s/g, '_')}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const exportToEmail = (title: string, data: any[]) => {
  const subject = encodeURIComponent(`Reporte CDCE: ${title}`);
  const body = encodeURIComponent(`Adjunto reporte de ${title}.\n\nResumen:\nTotal registros: ${data.length}\n\nGenerado: ${new Date().toLocaleString()}`);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
};

// --- Special Report Export Functions (AI Report) ---

const getQuarterlyPeriodString = () => {
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const d = new Date();
  const currentMonth = d.getMonth();
  const year = d.getFullYear();
  
  let startMonthIndex = currentMonth - 2;
  let startYear = year;
  
  if (startMonthIndex < 0) {
    startMonthIndex += 12;
    startYear -= 1;
  }
  
  const startMonth = monthNames[startMonthIndex];
  const endMonth = monthNames[currentMonth];
  
  if (startYear === year) {
    return `${startMonth} / ${endMonth} ${year}`;
  } else {
    return `${startMonth} ${startYear} / ${endMonth} ${year}`;
  }
};

const exportReportPDFWithFormat = (content: string, periodString: string, title: string) => {
  const doc = new jsPDF();
  
  // 1. Logo Placeholder (CDCE Box)
  doc.setFillColor(37, 99, 235); // Blue 600
  doc.roundedRect(20, 15, 20, 20, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("CDCE", 30, 26, { align: "center" });
  doc.setFontSize(6);
  doc.text("ANZ", 30, 32, { align: "center" });

  // 2. Headers
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Centro de Desarrollo de la Calidad Educativa", 105, 22, { align: "center" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Estado Anzoategui, Venezuela", 105, 30, { align: "center" });
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, 105, 45, { align: "center" });
  
  doc.setFont("helvetica", "italic");
  doc.setFontSize(11);
  doc.text(`Periodo: ${periodString}`, 105, 52, { align: "center" });

  // Line separator
  doc.setDrawColor(200);
  doc.setLineWidth(0.5);
  doc.line(20, 60, 190, 60);

  // 3. Content
  doc.setFont("times", "normal");
  doc.setFontSize(11);
  doc.setTextColor(20);
  
  const splitText = doc.splitTextToSize(content, 170);
  doc.text(splitText, 20, 70);

  // 4. Footer
  const footerY = doc.internal.pageSize.height - 30;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text("Responsable: ING. José García", 105, footerY, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.text("(Encargado de Sala de Informática)", 105, footerY + 5, { align: "center" });

  doc.save("Informe_Gestion_CDCE.pdf");
};

const exportReportWordWithFormat = (content: string, periodString: string, title: string) => {
  const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Informe de Gestión</title></head>
    <body>
      <div style="text-align: center; font-family: Arial, sans-serif;">
        <div style="margin: 0 auto; width: 60px; height: 60px; background-color: #2563eb; color: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: bold;">CDCE</div>
        <br/>
        <h1 style="font-size: 18pt; margin-bottom: 5px; color: #000;">Centro de Desarrollo de la Calidad Educativa</h1>
        <h2 style="font-size: 14pt; font-weight: normal; margin: 5px 0; color: #333;">Estado Anzoategui, Venezuela</h2>
        <br/>
        <h2 style="font-size: 16pt; font-weight: bold; text-decoration: underline; color: #000;">${title}</h2>
        <p style="font-size: 12pt; font-style: italic;">Periodo: ${periodString}</p>
        <hr style="border: 1px solid #ccc;"/>
      </div>
      
      <div style="font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; margin: 40px 20px; white-space: pre-wrap; text-align: justify;">
        ${content}
      </div>

      <br/><br/><br/>
      <div style="text-align: center; font-family: Arial, sans-serif; margin-top: 50px;">
        <p style="font-weight: bold; margin: 0;">Responsable: ING. José García</p>
        <p style="margin: 0;">(Encargado de Sala de Informática)</p>
      </div>
    </body>
    </html>
  `;
  
  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = "Informe_Gestion_CDCE.doc";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const shareReportWhatsApp = (content: string, periodString: string, title: string) => {
  const header = `*CDCE Anzoátegui - ${title}*\nPeriodo: ${periodString}\n\n`;
  const footer = `\n\n*Responsable:* ING. José García`;
  const fullText = header + content + footer;
  
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(fullText)}`;
  window.open(whatsappUrl, '_blank');
};

const shareReportEmail = (content: string, periodString: string, title: string) => {
  const subject = encodeURIComponent(`${title} CDCE - ${periodString}`);
  const body = encodeURIComponent(
    `Centro de Desarrollo de la Calidad Educativa\nEstado Anzoategui, Venezuela\n${title}\nPeriodo: ${periodString}\n\n--------------------------------\n\n${content}\n\n--------------------------------\nResponsable: ING. José García\n(Encargado de Sala de Informática)`
  );
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
};

// --- Modals ---

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ticket: Ticket) => void;
  onDelete?: (id: number) => void;
  ticket?: Ticket | null;
  isDarkMode: boolean;
}

function TicketModal({ isOpen, onClose, onSave, onDelete, ticket, isDarkMode }: TicketModalProps) {
  const [formData, setFormData] = useState<Partial<Ticket>>({
    tipo: TicketType.SOPORTE,
    prioridad: TicketPriority.MEDIA,
    estado: TicketStatus.ABIERTO,
    departamento: DEPARTMENTS[0],
    descripcion: '',
    solicitante: '',
    solucion: ''
  });

  useEffect(() => {
    if (ticket) {
      setFormData(ticket);
    } else {
      setFormData({
        tipo: TicketType.SOPORTE,
        prioridad: TicketPriority.MEDIA,
        estado: TicketStatus.ABIERTO,
        departamento: DEPARTMENTS[0],
        descripcion: '',
        solicitante: '',
        solucion: ''
      });
    }
  }, [ticket, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.descripcion || !formData.solicitante) return;

    const now = new Date().toISOString();
    const newTicket: Ticket = {
      id: ticket?.id || Date.now(),
      creado_en: ticket?.creado_en || now,
      actualizado_en: now,
      ...formData as any
    };
    onSave(newTicket);
    onClose();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (ticket && onDelete) {
      // Removal of window.confirm for mobile compatibility as requested by user for better UX
      onDelete(ticket.id);
      onClose();
    }
  };

  const isResolved = formData.estado === TicketStatus.RESUELTO;
  const inputClass = `w-full p-2.5 border rounded-lg text-sm transition-all outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${isDarkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-200 text-slate-900'}`;
  const bgClass = isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900';

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-fade-in p-0 sm:p-4">
      <div className={`${bgClass} w-full max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up-mobile sm:animate-scale-in`}>
        <div className={`p-5 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
          <h2 className="font-bold text-lg flex items-center gap-2">
            {ticket ? <Wrench size={20} className="text-blue-500"/> : <Plus size={20} className="text-blue-500"/>}
            {ticket ? 'Gestionar Ticket' : 'Nuevo Ticket'}
          </h2>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}>
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Estado</label>
              <select 
                className={inputClass}
                value={formData.estado}
                onChange={e => setFormData({...formData, estado: e.target.value as TicketStatus})}
              >
                {Object.values(TicketStatus).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Prioridad</label>
              <select 
                className={inputClass}
                value={formData.prioridad}
                onChange={e => setFormData({...formData, prioridad: e.target.value as TicketPriority})}
              >
                {Object.values(TicketPriority).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Departamento</label>
            <select 
              className={inputClass}
              value={formData.departamento}
              onChange={e => setFormData({...formData, departamento: e.target.value})}
            >
              {DEPARTMENTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Tipo de Incidencia</label>
            <select 
              className={inputClass}
              value={formData.tipo}
              onChange={e => setFormData({...formData, tipo: e.target.value as TicketType})}
            >
              {Object.values(TicketType).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Solicitante</label>
            <input 
              type="text" 
              className={inputClass}
              placeholder="Nombre y Apellido"
              value={formData.solicitante}
              onChange={e => setFormData({...formData, solicitante: e.target.value})}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Descripción del Problema</label>
            <textarea 
              className={`${inputClass} h-24 resize-none`}
              placeholder="Detalle la falla o requerimiento..."
              value={formData.descripcion}
              onChange={e => setFormData({...formData, descripcion: e.target.value})}
              required
            />
          </div>

          {isResolved && (
            <div className={`animate-fade-in-up p-4 rounded-xl border ${isDarkMode ? 'bg-green-900/10 border-green-800' : 'bg-emerald-50 border-emerald-100'}`}>
              <label className="block text-xs font-bold text-emerald-600 mb-1.5 flex items-center gap-1">
                <CheckCircle2 size={14}/> Solución Aplicada (Requerido)
              </label>
              <textarea 
                className={`w-full p-2.5 border rounded-lg text-sm h-24 resize-none outline-none focus:ring-2 focus:ring-emerald-500/30 ${isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-emerald-200'}`}
                placeholder="Describa el procedimiento técnico realizado..."
                value={formData.solucion}
                onChange={e => setFormData({...formData, solucion: e.target.value})}
                required
              />
            </div>
          )}

          <div className="pt-4 flex gap-3">
            {ticket && onDelete && (
              <button 
                type="button"
                onClick={handleDelete}
                className="px-4 py-3 rounded-xl bg-red-50 text-red-600 font-bold border border-red-100 hover:bg-red-100 transition-colors"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button type="submit" className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-200 active:scale-[0.98] transition-all hover:shadow-blue-300">
              {ticket ? 'Actualizar Ticket' : 'Crear Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
  onDelete?: (id: number) => void;
  item?: InventoryItem | null;
  isDarkMode: boolean;
}

function InventoryModal({ isOpen, onClose, onSave, onDelete, item, isDarkMode }: InventoryModalProps) {
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    categoria: InventoryCategory.EQUIPO,
    cantidad: 1,
    ubicacion: DEPARTMENTS[0],
    estado: InventoryStatus.ACTIVO,
    nombre: '',
    descripcion: '',
    frecuencia_mantenimiento: 'Semestral'
  });

  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        categoria: InventoryCategory.EQUIPO,
        cantidad: 1,
        ubicacion: DEPARTMENTS[0],
        estado: InventoryStatus.ACTIVO,
        nombre: '',
        descripcion: '',
        frecuencia_mantenimiento: 'Semestral'
      });
    }
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre) return;

    const newItem: InventoryItem = {
      id: item?.id || Date.now(),
      ...formData as any
    };
    onSave(newItem);
    onClose();
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (item && onDelete) {
      // Direct delete for mobile usability
      onDelete(item.id);
      onClose();
    }
  };

  const inputClass = `w-full p-2.5 border rounded-lg text-sm transition-all outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${isDarkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-200 text-slate-900'}`;
  const bgClass = isDarkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900';

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-fade-in p-0 sm:p-4">
      <div className={`${bgClass} w-full max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up-mobile sm:animate-scale-in`}>
        <div className={`p-5 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
          <h2 className="font-bold text-lg flex items-center gap-2">
            {item ? <Package size={20} className="text-blue-500"/> : <Plus size={20} className="text-blue-500"/>}
            {item ? 'Editar Inventario' : 'Registrar Item'}
          </h2>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}>
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Nombre del Equipo/Item</label>
            <input 
              type="text" 
              className={inputClass}
              placeholder="Ej: Laptop HP ProBook"
              value={formData.nombre}
              onChange={e => setFormData({...formData, nombre: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Categoría</label>
              <select 
                className={inputClass}
                value={formData.categoria}
                onChange={e => setFormData({...formData, categoria: e.target.value as InventoryCategory})}
              >
                {Object.values(InventoryCategory).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Cantidad</label>
              <input 
                type="number" 
                className={inputClass}
                min="0"
                value={formData.cantidad}
                onChange={e => setFormData({...formData, cantidad: parseInt(e.target.value)})}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Ubicación</label>
            <select 
              className={inputClass}
              value={formData.ubicacion}
              onChange={e => setFormData({...formData, ubicacion: e.target.value})}
            >
              {DEPARTMENTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Estado</label>
              <select 
                className={inputClass}
                value={formData.estado}
                onChange={e => setFormData({...formData, estado: e.target.value as InventoryStatus})}
              >
                {Object.values(InventoryStatus).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
             <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Frec. Mantenimiento</label>
              <select 
                className={inputClass}
                value={formData.frecuencia_mantenimiento}
                onChange={e => setFormData({...formData, frecuencia_mantenimiento: e.target.value as MaintenanceFrequency})}
              >
                <option value="Trimestral">Trimestral</option>
                <option value="Semestral">Semestral</option>
                <option value="Anual">Anual</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Descripción / Seriales</label>
            <textarea 
              className={`${inputClass} h-20 resize-none`}
              placeholder="Especificaciones técnicas, seriales, observaciones..."
              value={formData.descripcion}
              onChange={e => setFormData({...formData, descripcion: e.target.value})}
            />
          </div>

          <div className="pt-4 flex gap-3">
            {item && onDelete && (
              <button 
                type="button"
                onClick={handleDelete}
                className="px-4 py-3 rounded-xl bg-red-50 text-red-600 font-bold border border-red-100 hover:bg-red-100 transition-colors"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button type="submit" className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-200 active:scale-[0.98] transition-all hover:shadow-blue-300">
              {item ? 'Actualizar Item' : 'Guardar Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackup: () => void;
  onRestore: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isDarkMode: boolean;
}

function SettingsModal({ isOpen, onClose, onBackup, onRestore, isDarkMode }: SettingsModalProps) {
  if (!isOpen) return null;

  const bgClass = isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-slate-900';

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
      <div className={`${bgClass} w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-scale-in`}>
        <div className={`p-5 border-b flex justify-between items-center ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}>
          <h3 className="font-bold text-lg flex items-center gap-2"><Settings size={20}/> Configuración</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100/10"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className={`p-4 rounded-xl border space-y-3 ${isDarkMode ? 'border-slate-700 bg-slate-900/50' : 'border-gray-100 bg-gray-50'}`}>
            <h4 className="font-bold text-sm flex items-center gap-2 text-blue-500 uppercase tracking-wide"><Database size={14}/> Gestión de Datos</h4>
            
            <button onClick={onBackup} className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Download size={18} /></div>
              <div className="text-left">
                <div className="text-sm font-bold text-slate-800">Respaldo de Datos</div>
                <div className="text-[10px] text-slate-500">Descargar archivo JSON</div>
              </div>
            </button>

            <label className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer">
              <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Upload size={18} /></div>
              <div className="text-left">
                <div className="text-sm font-bold text-slate-800">Restaurar Datos</div>
                <div className="text-[10px] text-slate-500">Importar archivo JSON</div>
              </div>
              <input type="file" accept=".json" className="hidden" onChange={onRestore}/>
            </label>

          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main App Component ---

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  
  // Initialize state from LocalStorage with strict checking
  // Only fall back to MOCK data if localStorage is null (first time load)
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    try {
      const saved = localStorage.getItem('cdce_tickets');
      if (saved !== null) {
        return JSON.parse(saved);
      }
      return MOCK_TICKETS;
    } catch (e) {
      console.error("Error parsing tickets from localStorage", e);
      return MOCK_TICKETS;
    }
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('cdce_inventory');
      if (saved !== null) {
        return JSON.parse(saved);
      }
      return MOCK_INVENTORY;
    } catch (e) {
      console.error("Error parsing inventory from localStorage", e);
      return MOCK_INVENTORY;
    }
  });
  
  // Save to LocalStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('cdce_tickets', JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem('cdce_inventory', JSON.stringify(inventory));
  }, [inventory]);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Todos");
  const [deptFilter, setDeptFilter] = useState<string>("Todos");
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState<string>("Todos");
  
  // AI Report Config States
  const [reportMode, setReportMode] = useState<'auto' | 'manual'>('auto');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  const [toast, setToast] = useState<{msg: string, type: 'success'|'info', visible: boolean}>({msg: '', type: 'info', visible: false});
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Theme
  const [isDarkMode, setIsDarkMode] = useState(false);

  const showToast = (msg: string, type: 'success' | 'info' = 'success') => {
    setToast({msg, type, visible: true});
    setTimeout(() => setToast({...toast, visible: false}), 3000);
  };

  const handleSaveTicket = (ticket: Ticket) => {
    if (editingTicket) {
      setTickets(tickets.map(t => t.id === ticket.id ? ticket : t));
      showToast('Ticket actualizado correctamente');
    } else {
      setTickets([ticket, ...tickets]);
      showToast('Ticket creado exitosamente');
    }
    setEditingTicket(null);
  };

  const handleDeleteTicket = (id: number) => {
    // Convert to String comparison to be safe against type mismatches from localStorage
    setTickets(prevTickets => prevTickets.filter(t => String(t.id) !== String(id)));
    showToast('Ticket eliminado', 'info');
  };

  const handleSaveInventory = (item: InventoryItem) => {
    if (editingItem) {
      setInventory(inventory.map(i => i.id === item.id ? item : i));
      showToast('Inventario actualizado');
    } else {
      setInventory([item, ...inventory]);
      showToast('Item agregado al inventario');
    }
    setEditingItem(null);
  };

  const handleDeleteInventory = (id: number) => {
    // Convert to String comparison to be safe
    setInventory(prevInventory => prevInventory.filter(i => String(i.id) !== String(id)));
    showToast('Item eliminado del inventario', 'info');
  };

  const getFilteredDataForReport = () => {
    if (reportMode === 'auto') {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      return {
        filteredTickets: tickets.filter(t => new Date(t.creado_en) >= ninetyDaysAgo),
        periodLabel: getQuarterlyPeriodString(),
        isQuarterly: true
      };
    } else {
      if (!reportStartDate || !reportEndDate) return { filteredTickets: tickets, periodLabel: 'Periodo Personalizado', isQuarterly: false };
      
      const start = new Date(reportStartDate);
      const end = new Date(reportEndDate);
      end.setHours(23, 59, 59);

      const filtered = tickets.filter(t => {
        const d = new Date(t.creado_en);
        return d >= start && d <= end;
      });
      
      return {
        filteredTickets: filtered,
        periodLabel: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
        isQuarterly: false
      };
    }
  };

  const generateReport = async () => {
    setIsGeneratingReport(true);
    const { filteredTickets, periodLabel, isQuarterly } = getFilteredDataForReport();
    
    const report = await generateAIReport(filteredTickets, inventory, periodLabel, isQuarterly);
    setAiReport(report);
    setIsGeneratingReport(false);
  };

  // Data Management
  const handleBackup = () => {
    const data = {
      tickets,
      inventory,
      exported_at: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cdce_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Respaldo descargado exitosamente');
    setIsSettingsOpen(false);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.tickets && json.inventory) {
          setTickets(json.tickets);
          setInventory(json.inventory);
          showToast('Base de datos restaurada');
        } else {
          showToast('Formato de archivo inválido', 'info');
        }
      } catch (err) {
        showToast('Error al leer el archivo', 'info');
      }
      setIsSettingsOpen(false);
    };
    reader.readAsText(file);
  };

  // Calculate Top 3 Departments
  const getTopDepartments = () => {
    const counts: Record<string, number> = {};
    tickets.forEach(t => {
      counts[t.departamento] = (counts[t.departamento] || 0) + 1;
    });
    
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
  };

  // --- Views ---

  const DashboardView = () => {
    const openTickets = tickets.filter(t => t.estado === TicketStatus.ABIERTO).length;
    const inProgress = tickets.filter(t => t.estado === TicketStatus.EN_PROGRESO).length;
    const resolved = tickets.filter(t => t.estado === TicketStatus.RESUELTO).length;
    const lowStock = inventory.filter(i => i.cantidad < 5).length;
    const topDepts = getTopDepartments();
    const maxCount = topDepts.length > 0 ? topDepts[0][1] : 1;

    const pieData = [
      { name: 'Abiertos', value: openTickets, color: '#fbbf24' },
      { name: 'En Progreso', value: inProgress, color: '#3b82f6' },
      { name: 'Resueltos', value: resolved, color: '#10b981' },
    ];

    return (
      <div className="space-y-4 pb-24 animate-fade-in">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-4 shadow-xl shadow-blue-900/10 relative overflow-hidden text-white">
           <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-10 -mt-10 blur-3xl"></div>
           <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/20 rounded-full -ml-5 -mb-5 blur-xl"></div>
           
           <div className="relative z-10">
             <div className="flex items-start justify-between mb-2">
               <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                 <Building size={24} className="text-blue-100"/>
               </div>
               <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border border-white/10">
                 v2.6 Pro
               </span>
             </div>
             <h1 className="text-xl font-bold mb-1 tracking-tight">Gestión Integral</h1>
             <h2 className="text-base font-medium text-blue-100 mb-2">CDCE Anzoátegui</h2>
             
             <div className="flex items-center gap-3 mt-2 pt-2 border-t border-white/10">
               <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold shadow-lg text-xs">JG</div>
               <div>
                 <p className="text-xs text-blue-200 font-medium uppercase tracking-wide">Bienvenido</p>
                 <p className="font-semibold text-sm">ING José Garcia</p>
               </div>
             </div>
           </div>
        </div>

        {/* Stats Grid */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 mb-2 px-1 uppercase tracking-wide">Métricas Clave</h3>
          <div className="grid grid-cols-2 gap-2">
            <StatCard 
              metric={{label: "Tickets Abiertos", value: openTickets, change: "+2 hoy", color: "yellow"}} 
              icon={<AlertCircle size={20}/>} 
            />
            <StatCard 
              metric={{label: "En Proceso", value: inProgress, color: "blue"}} 
              icon={<Timer size={20}/>} 
            />
            <StatCard 
              metric={{label: "Resueltos", value: resolved, change: "+12%", color: "green"}} 
              icon={<CheckCircle2 size={20}/>} 
            />
            <StatCard 
              metric={{label: "Stock Bajo", value: lowStock, color: "red"}} 
              icon={<AlertTriangle size={20}/>} 
            />
          </div>
        </div>

        {/* Top Departments Card */}
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
            <div className="p-1.5 bg-orange-50 rounded-lg text-orange-600"><Trophy size={16}/></div>
            Oficinas con Mayor Demanda
          </h3>
          <div className="space-y-2">
            {topDepts.length === 0 ? (
               <p className="text-sm text-gray-400 text-center py-2">Sin datos registrados</p>
            ) : (
              topDepts.map(([dept, count], index) => (
                <div key={dept} className="relative">
                  <div className="flex justify-between text-xs font-bold mb-1 text-slate-700">
                    <span className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-100 text-gray-700' : 'bg-orange-50 text-orange-700'}`}>
                        {index + 1}
                      </span>
                      {dept}
                    </span>
                    <span>{count} tickets</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'}`} 
                      style={{width: `${(count / maxCount) * 100}%`}}
                    ></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
            <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600"><PieChart size={16}/></div>
            Distribución de Casos
          </h3>
          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-xs text-gray-500 mt-2 border-t border-gray-50 pt-2">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: d.color}}></div>
                <span className="font-medium">{d.name}</span>
                <span className="text-gray-400">({d.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const TicketsView = () => {
    const filteredTickets = tickets.filter(t => {
      // Hide resolved/closed tickets from main view
      if (t.estado === TicketStatus.RESUELTO || t.estado === TicketStatus.CERRADO) return false;

      const matchesSearch = t.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.solicitante.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "Todos" || t.estado === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return (
      <div className="space-y-4 pb-24 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Soporte Técnico</h2>
          <div className="flex gap-2">
             <button 
               onClick={() => setCurrentView(AppView.HISTORY)} 
               className="bg-white text-slate-600 border border-gray-200 p-2.5 rounded-xl shadow-sm active:scale-95 transition-all hover:bg-gray-50"
               title="Historial"
             >
               <Archive size={20} />
             </button>
             <button 
                onClick={() => { setEditingTicket(null); setIsTicketModalOpen(true); }}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-all hover:shadow-blue-300"
              >
                <Plus size={20} />
              </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <div className="bg-white p-2.5 rounded-xl border border-gray-200 flex items-center gap-2 min-w-[200px] shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <Search size={18} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar tickets activos..." 
              className="bg-transparent outline-none text-sm w-full placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="bg-white border border-gray-200 text-sm font-medium rounded-xl px-4 py-2.5 outline-none shadow-sm text-slate-600"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Todos">Todos</option>
            <option value={TicketStatus.ABIERTO}>Abiertos</option>
            <option value={TicketStatus.EN_PROGRESO}>En Progreso</option>
          </select>
        </div>

        {/* List */}
        <div className="space-y-3">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                <Search size={32} className="text-gray-300" />
              </div>
              <h3 className="font-bold text-gray-400 text-lg">Sin tickets activos</h3>
              <p className="text-gray-400 text-sm">No se encontraron tickets pendientes con ese filtro</p>
            </div>
          ) : (
            filteredTickets.map(ticket => (
              <div 
                key={ticket.id}
                className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                 <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                   ticket.prioridad === TicketPriority.CRITICA ? 'bg-red-500' :
                   ticket.prioridad === TicketPriority.ALTA ? 'bg-orange-500' :
                   ticket.prioridad === TicketPriority.MEDIA ? 'bg-blue-500' : 'bg-green-500'
                }`}></div>

                {/* Botón de eliminar directo */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    // Use onMouseDown to prevent event propagation early on touch devices 
                  }}
                  onMouseDown={(e) => {
                     e.stopPropagation();
                     handleDeleteTicket(ticket.id);
                  }}
                  className="absolute top-2 right-2 z-[60] h-10 w-10 flex items-center justify-center bg-white text-red-500 rounded-xl border border-red-100 shadow-md active:bg-red-50 active:scale-95"
                  title="Eliminar Ticket"
                >
                  <Trash2 size={20} />
                </button>
                
                <div 
                  onClick={() => { setEditingTicket(ticket); setIsTicketModalOpen(true); }} 
                  className="p-4 pl-5 pr-14 cursor-pointer active:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">#{ticket.id}</span>
                      <TicketBadge priority={ticket.prioridad} />
                    </div>
                    <div className="mr-2"><StatusBadge status={ticket.estado} /></div>
                  </div>
                  <h3 className="font-bold text-slate-800 mb-1.5 text-sm leading-snug line-clamp-2">{ticket.descripcion}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3 flex-wrap">
                     <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg"><User size={10}/> {ticket.solicitante}</span>
                     <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-lg"><Building size={10}/> {ticket.departamento}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-400 border-t border-gray-50 pt-2 mt-2">
                    <span className="flex items-center gap-1"><Calendar size={10}/> {new Date(ticket.creado_en).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1 font-medium text-gray-500">{formatDuration(ticket)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const HistoryView = () => {
    const closedTickets = tickets.filter(t => {
      // Only show closed tickets
      if (t.estado !== TicketStatus.RESUELTO && t.estado !== TicketStatus.CERRADO) return false;
      
      const matchesSearch = t.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.solicitante.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });

    const handleExport = (type: 'pdf' | 'word' | 'email') => {
      const data = closedTickets.map(t => ({
        ID: t.id,
        Descripcion: t.descripcion,
        Solicitante: t.solicitante,
        Depto: t.departamento,
        Estado: t.estado,
        Solucion: t.solucion || 'N/A'
      }));
      
      if (type === 'pdf') exportToPDF('Historial de Tickets Resueltos', ['ID', 'Descripcion', 'Solicitante', 'Depto', 'Estado', 'Solucion'], data);
      if (type === 'word') exportToWord('Historial de Tickets Resueltos', data);
      if (type === 'email') exportToEmail('Historial Tickets Resueltos', data);
    };

    return (
      <div className="space-y-4 pb-24 animate-fade-in">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentView(AppView.TICKETS)} className="p-1 hover:bg-gray-100 rounded-full">
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Historial</h2>
          </div>
          <div className="flex bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
             <button onClick={() => handleExport('pdf')} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="PDF"><FileText size={18}/></button>
             <button onClick={() => handleExport('word')} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Word"><File size={18}/></button>
             <button onClick={() => handleExport('email')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="Correo"><Mail size={18}/></button>
          </div>
        </div>

        {/* Search History */}
        <div className="bg-white p-2.5 rounded-xl border border-gray-200 flex items-center gap-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
          <Search size={18} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar en historial..." 
            className="bg-transparent outline-none text-sm w-full placeholder-gray-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          {closedTickets.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                <History size={32} className="text-gray-300" />
              </div>
              <h3 className="font-bold text-gray-400 text-lg">Historial vacío</h3>
              <p className="text-gray-400 text-sm">No hay tickets resueltos o cerrados para mostrar</p>
            </div>
          ) : (
             closedTickets.map(ticket => (
              <div 
                key={ticket.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden opacity-90"
              >
                <div 
                  onClick={() => { setEditingTicket(ticket); setIsTicketModalOpen(true); }} 
                  className="p-4 cursor-pointer active:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">#{ticket.id}</span>
                      <TicketBadge priority={ticket.prioridad} />
                    </div>
                    <StatusBadge status={ticket.estado} />
                  </div>
                  <h3 className="font-bold text-slate-600 mb-1.5 text-sm line-clamp-2">{ticket.descripcion}</h3>
                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg mb-2">
                    <span className="font-bold text-emerald-600">Solución:</span> {ticket.solucion || 'Sin detalle'}
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-400">
                    <span className="flex items-center gap-1"><Calendar size={10}/> {new Date(ticket.actualizado_en || ticket.creado_en).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><User size={10}/> {ticket.solicitante}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const InventoryView = () => {
    const filteredInventory = inventory.filter(item => {
      const matchesSearch = item.nombre.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = deptFilter === "Todos" || item.ubicacion === deptFilter;
      const matchesStatus = inventoryStatusFilter === "Todos" || item.estado === inventoryStatusFilter;
      return matchesSearch && matchesDept && matchesStatus;
    });

    const handleExport = (type: 'pdf' | 'word' | 'email') => {
      const data = filteredInventory.map(i => ({
        Nombre: i.nombre,
        Categoria: i.categoria,
        Cantidad: i.cantidad,
        Ubicacion: i.ubicacion,
        Estado: i.estado
      }));
      
      if (type === 'pdf') exportToPDF('Inventario CDCE', ['Nombre', 'Categoria', 'Cantidad', 'Ubicacion', 'Estado'], data);
      if (type === 'word') exportToWord('Inventario CDCE', data);
      if (type === 'email') exportToEmail('Inventario Institucional', data);
    };

    return (
      <div className="space-y-4 pb-24 animate-fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Inventario</h2>
          <div className="flex gap-2">
             <div className="flex bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
                <button onClick={() => handleExport('pdf')} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="PDF"><FileText size={18}/></button>
                <button onClick={() => handleExport('word')} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Word"><File size={18}/></button>
                <button onClick={() => handleExport('email')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="Correo"><Mail size={18}/></button>
             </div>
             <button 
              onClick={() => { setEditingItem(null); setIsInventoryModalOpen(true); }}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-2.5 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-all hover:shadow-blue-300"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3">
          <div className="bg-white p-2.5 rounded-xl border border-gray-200 flex items-center gap-2 w-full shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <Search size={18} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar equipos, software..." 
              className="bg-transparent outline-none text-sm w-full placeholder-gray-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <select 
              className="bg-white border border-gray-200 text-xs font-medium rounded-xl px-3 py-2 outline-none shadow-sm min-w-[140px] text-slate-600"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="Todos">Todos los Departamentos</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            <select 
              className="bg-white border border-gray-200 text-xs font-medium rounded-xl px-3 py-2 outline-none shadow-sm min-w-[120px] text-slate-600"
              value={inventoryStatusFilter}
              onChange={(e) => setInventoryStatusFilter(e.target.value)}
            >
              <option value="Todos">Estado: Todos</option>
              {Object.values(InventoryStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* List */}
        <div className="space-y-3">
          {filteredInventory.map(item => (
            <div 
              key={item.id}
              className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
            >
               {/* Botón de eliminar directo */}
               <button 
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleDeleteInventory(item.id);
                  }}
                  className="absolute top-2 right-2 z-[60] h-10 w-10 flex items-center justify-center bg-white text-red-500 rounded-xl border border-red-100 shadow-md active:bg-red-50 active:scale-95"
                  title="Eliminar Item"
                >
                  <Trash2 size={20} />
                </button>

              <div 
                className="flex items-center p-4 pr-14 cursor-pointer active:bg-gray-50" 
                onClick={() => { setEditingItem(item); setIsInventoryModalOpen(true); }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-bold text-slate-800 text-sm">{item.nombre}</h3>
                    <InventoryStatusBadge status={item.estado} />
                  </div>
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><Building size={10}/> {item.ubicacion}</p>
                  <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded text-slate-600 uppercase tracking-wide font-medium border border-slate-200">{item.categoria}</span>
                </div>
                <div className="pl-4 border-l border-gray-50 flex flex-col items-center justify-center min-w-[60px]">
                  <StockBadge quantity={item.cantidad} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const AIReportView = () => {
    const { periodLabel, isQuarterly } = getFilteredDataForReport();
    const reportTitle = isQuarterly ? "Informe de Gestión Trimestral" : "Informe de Gestión";

    return (
      <div className="space-y-6 pb-24 animate-fade-in">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-2xl text-white shadow-lg shadow-purple-200">
            <BrainCircuit size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Asistente IA</h2>
            <p className="text-xs text-gray-500 font-medium">Generación inteligente de informes</p>
          </div>
        </div>

        {!aiReport && !isGeneratingReport && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-10 -mt-10 blur-2xl"></div>
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 relative z-10">
              <Settings size={16} className="text-purple-500"/> Configuración del Periodo
            </h3>
            
            {/* Selection Toggle */}
            <div className="flex gap-2 mb-6 p-1.5 bg-gray-50 rounded-xl border border-gray-100 relative z-10">
               <button 
                 onClick={() => setReportMode('auto')}
                 className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all shadow-sm ${reportMode === 'auto' ? 'bg-white text-purple-700 ring-1 ring-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
               >
                 Automático (Trimestral)
               </button>
               <button 
                 onClick={() => setReportMode('manual')}
                 className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all shadow-sm ${reportMode === 'manual' ? 'bg-white text-purple-700 ring-1 ring-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
               >
                 Personalizado
               </button>
            </div>

            {reportMode === 'manual' && (
              <div className="grid grid-cols-2 gap-4 mb-8 animate-fade-in relative z-10">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Desde</label>
                  <input 
                    type="date" 
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-50 transition-all"
                    value={reportStartDate}
                    onChange={e => setReportStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5 tracking-wider">Hasta</label>
                  <input 
                    type="date" 
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-50 transition-all"
                    value={reportEndDate}
                    onChange={e => setReportEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="text-center pt-2 relative z-10">
              <button 
                onClick={generateReport}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-purple-200 active:scale-[0.98] transition-all hover:shadow-purple-300 flex items-center gap-3 mx-auto w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={reportMode === 'manual' && (!reportStartDate || !reportEndDate)}
              >
                <BrainCircuit size={20} />
                Generar Informe de Gestión
              </button>
            </div>
          </div>
        )}

        {isGeneratingReport && (
          <div className="bg-white p-12 rounded-3xl text-center shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[300px]">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin mb-6"></div>
              <BrainCircuit className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-[80%] text-purple-600" size={24} />
            </div>
            <p className="font-bold text-lg text-slate-800">Redactando informe...</p>
            <p className="text-sm text-gray-400 mt-2 max-w-[200px]">Analizando métricas de tickets e inventario para el periodo seleccionado.</p>
          </div>
        )}

        {aiReport && (
          <div className="animate-fade-in-up">
             <div className="bg-white rounded-t-2xl shadow-lg border border-gray-200 overflow-hidden relative">
                {/* Paper texture effect */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"></div>
                
                <div className="p-8 sm:p-12 bg-white">
                   <div className="text-center mb-8 pb-6 border-b border-gray-100">
                       <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold mx-auto mb-4 text-sm shadow-lg shadow-blue-200">CDCE</div>
                     <h2 className="font-bold text-slate-900 text-xl leading-tight tracking-tight">Centro de Desarrollo de la Calidad Educativa</h2>
                     <p className="text-slate-500 text-sm mt-1">Estado Anzoátegui, Venezuela</p>
                     <div className="mt-6 inline-block bg-purple-50 px-4 py-1.5 rounded-full border border-purple-100">
                       <h3 className="font-bold text-purple-800 uppercase text-xs tracking-wider">{reportTitle}</h3>
                     </div>
                     <p className="text-xs text-gray-400 mt-2 font-medium">Periodo: {periodLabel}</p>
                   </div>

                   <div className="prose prose-sm max-w-none text-justify text-slate-700 font-serif leading-relaxed">
                     {aiReport.split('\n').map((line, i) => (
                       <p key={i} className="mb-4">{line}</p>
                     ))}
                   </div>

                   <div className="mt-12 text-center pt-8 border-t border-gray-100">
                     <p className="font-bold text-slate-900 text-sm">ING. José García</p>
                     <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Encargado de Sala de Informática</p>
                   </div>
                </div>
             </div>

             {/* Floating Action Bar for Export */}
             <div className="bg-slate-900 text-white p-4 rounded-b-2xl shadow-2xl grid grid-cols-2 gap-3 backdrop-blur-md bg-opacity-95 border-t border-slate-700">
                <button 
                  onClick={() => shareReportWhatsApp(aiReport, periodLabel, reportTitle)}
                  className="flex items-center justify-center gap-2 bg-emerald-600 py-3 px-4 rounded-xl text-xs font-bold hover:bg-emerald-500 transition-colors"
                >
                  <MessageCircle size={18}/> WhatsApp
                </button>
                <button 
                  onClick={() => exportReportPDFWithFormat(aiReport, periodLabel, reportTitle)}
                  className="flex items-center justify-center gap-2 bg-red-600 py-3 px-4 rounded-xl text-xs font-bold hover:bg-red-500 transition-colors"
                >
                  <FileText size={18}/> PDF
                </button>
                <button 
                  onClick={() => exportReportWordWithFormat(aiReport, periodLabel, reportTitle)}
                  className="flex items-center justify-center gap-2 bg-blue-600 py-3 px-4 rounded-xl text-xs font-bold hover:bg-blue-500 transition-colors"
                >
                  <File size={18}/> Word
                </button>
                <button 
                  onClick={() => shareReportEmail(aiReport, periodLabel, reportTitle)}
                  className="flex items-center justify-center gap-2 bg-slate-700 py-3 px-4 rounded-xl text-xs font-bold hover:bg-slate-600 transition-colors"
                >
                  <Mail size={18}/> Correo
                </button>
                <button 
                   onClick={() => setAiReport(null)}
                   className="col-span-2 flex items-center justify-center gap-2 bg-transparent border border-slate-600 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:border-slate-400 transition-colors mt-2"
                >
                  <X size={16}/> Cerrar Vista Previa
                </button>
             </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`h-screen w-screen overflow-hidden flex flex-col transition-colors duration-300 selection:bg-blue-200 selection:text-blue-900 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-gray-50 text-slate-800'}`}>
      {/* Top Bar (Sticky & Blurry) */}
      <div className={`h-16 px-4 flex items-center justify-between shrink-0 z-40 backdrop-blur-md sticky top-0 ${isDarkMode ? 'bg-slate-900/80 border-b border-slate-800' : 'bg-white/80 border-b border-gray-200/60'}`}>
        <div className="flex items-center gap-2.5">
           <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-200 text-sm">
             CDCE
           </div>
           <div>
             <h1 className="font-bold text-sm leading-none tracking-tight">Gestión Móvil</h1>
             <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Anzoátegui</span>
           </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsSettingsOpen(true)} className={`p-2.5 rounded-full transition-all active:scale-90 ${isDarkMode ? 'hover:bg-slate-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <Settings size={20} />
          </button>
          <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2.5 rounded-full transition-all active:scale-90 ${isDarkMode ? 'hover:bg-slate-800 text-yellow-400' : 'hover:bg-gray-100 text-slate-600'}`}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 scroll-smooth no-scrollbar">
        {currentView === AppView.DASHBOARD && <DashboardView />}
        {currentView === AppView.TICKETS && <TicketsView />}
        {currentView === AppView.HISTORY && <HistoryView />}
        {currentView === AppView.INVENTORY && <InventoryView />}
        {currentView === AppView.AI_REPORT && <AIReportView />}
      </div>

      {/* Bottom Navigation (Blurry) */}
      <div className={`h-20 flex items-center justify-around px-2 shrink-0 pb-safe z-50 backdrop-blur-lg transition-all duration-300 ${isDarkMode ? 'bg-slate-900/90 border-t border-slate-800' : 'bg-white/90 border-t border-gray-200/60 shadow-[0_-5px_20px_rgba(0,0,0,0.03)]'}`}>
        <NavItem 
          view={AppView.DASHBOARD} 
          currentView={currentView} 
          onSelect={setCurrentView} 
          icon={<LayoutDashboard size={22} />} 
          label="Inicio"
        />
        <NavItem 
          view={AppView.TICKETS} 
          currentView={currentView} 
          onSelect={setCurrentView} 
          icon={<TicketIcon size={22} />} 
          label="Soporte"
        />
        
        {/* Floating Action Button */}
        <div className="relative -top-6 group">
          <div className="absolute inset-0 bg-blue-500 rounded-full blur opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
          <button 
            onClick={() => {
              if(currentView === AppView.INVENTORY) { setEditingItem(null); setIsInventoryModalOpen(true); }
              else { setEditingTicket(null); setIsTicketModalOpen(true); }
            }}
            className="relative w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl active:scale-90 transition-all duration-300 hover:-translate-y-1 border-2 border-white dark:border-slate-800"
          >
            <Plus size={28} />
          </button>
        </div>

        <NavItem 
          view={AppView.INVENTORY} 
          currentView={currentView} 
          onSelect={setCurrentView} 
          icon={<Package size={22} />} 
          label="Inventario"
        />
        <NavItem 
          view={AppView.AI_REPORT} 
          currentView={currentView} 
          onSelect={setCurrentView} 
          icon={<BrainCircuit size={22} />} 
          label="IA"
        />
      </div>

      {/* Modals & Toast */}
      <TicketModal 
        isOpen={isTicketModalOpen} 
        onClose={() => setIsTicketModalOpen(false)} 
        onSave={handleSaveTicket}
        onDelete={handleDeleteTicket}
        ticket={editingTicket}
        isDarkMode={isDarkMode}
      />
      
      <InventoryModal
        isOpen={isInventoryModalOpen}
        onClose={() => setIsInventoryModalOpen(false)}
        onSave={handleSaveInventory}
        onDelete={handleDeleteInventory}
        item={editingItem}
        isDarkMode={isDarkMode}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onBackup={handleBackup}
        onRestore={handleRestore}
        isDarkMode={isDarkMode}
      />

      <Toast message={toast.msg} type={toast.type} visible={toast.visible} />
    </div>
  );
}
