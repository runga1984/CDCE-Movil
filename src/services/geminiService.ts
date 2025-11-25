import { GoogleGenAI } from "@google/genai";
import { Ticket, InventoryItem } from '../types';

export const generateAIReport = async (
  tickets: Ticket[], 
  inventory: InventoryItem[], 
  periodDesc: string,
  isQuarterly: boolean
): Promise<string> => {
  // API key must be obtained exclusively from process.env.API_KEY
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error("API Key not found. Please ensure process.env.API_KEY is set.");
    return "⚠️ Error: API_KEY no configurada.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const openTickets = tickets.filter(t => t.estado === 'Abierto').length;
    const closedTickets = tickets.filter(t => t.estado === 'Resuelto' || t.estado === 'Cerrado').length;
    const criticalTickets = tickets.filter(t => t.prioridad === 'Crítica').length;
    
    const totalItems = inventory.reduce((acc, curr) => acc + curr.cantidad, 0);
    const lowStockItems = inventory.filter(i => i.cantidad < 3).map(i => `${i.nombre} (${i.cantidad})`).join(', ');
    const maintenanceItems = inventory.filter(i => i.estado === 'Mantenimiento').length;
    
    const reportTitle = isQuarterly ? "Informe de Gestión Trimestral" : "Informe de Gestión (Personalizado)";

    const prompt = `
      Actúa como el ING. José García, Encargado de Sala de Informática del CDCE Anzoátegui.
      Redacta EXCLUSIVAMENTE EL CUERPO de un "${reportTitle}" formal basado en los datos proporcionados.
      
      IMPORTANTE: NO INCLUYAS TÍTULOS DE DOCUMENTO, FECHAS, NI FIRMAS AL FINAL.
      Solo genera los párrafos de contenido.

      CONTEXTO DEL PERIODO: ${periodDesc}

      DATOS DEL PERIODO:
      - Soporte Técnico: ${tickets.length} tickets registrados en este periodo (${closedTickets} resueltos/cerrados, ${openTickets} pendientes).
      - Casos Críticos: ${criticalTickets}.
      - Parque Tecnológico (Estado Actual): ${totalItems} activos totales.
      - Equipos en Mantenimiento: ${maintenanceItems}.
      - Alertas de Stock: ${lowStockItems || 'Sin novedades'}.
      
      ESTRUCTURA DEL CONTENIDO (Usa estos subtítulos):
      1. Resumen Operativo (${periodDesc})
      2. Gestión de Soporte Técnico
      3. Estado del Parque Tecnológico
      4. Requerimientos y Planificación
      
      Tono: Estrictamente institucional, profesional y objetivo.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });

    return response.text || "No se pudo generar el análisis.";
  } catch (error) {
    console.error("Error generating AI report:", error);
    return "Ocurrió un error al comunicarse con el servicio de IA. Por favor intente más tarde.";
  }
};