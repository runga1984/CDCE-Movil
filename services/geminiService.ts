import { GoogleGenerativeAI } from "@google/generative-ai";
import { Ticket, InventoryItem } from '../types';

// Safe access to environment variable
const getApiKey = () => {
  // ATENCION: PARA QUE LA APK FUNCIONE CON IA, PON TU CLAVE AQUI:
  const key = ""; // <-- PEGA TU API KEY AQUI
  if (key) return key;

  try {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    console.warn("Error accessing process.env:", e);
  }
  return null;
};

export const generateAIReport = async (
  tickets: Ticket[], 
  inventory: InventoryItem[], 
  periodDesc: string,
  isQuarterly: boolean
): Promise<string> => {
  const apiKey = getApiKey();

  if (!apiKey) {
    return "⚠️ Error: API_KEY no configurada. Edita services/geminiService.ts y coloca tu clave.";
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Prepare data summary for the prompt
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
    
    IMPORTANTE: NO INCLUYAS TÍTULOS DE DOCUMENTO, FECHAS, NI FIRMAS AL FINAL. Estos elementos se agregan automáticamente en el formato de impresión.
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

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "No se pudo generar el análisis.";
  } catch (error) {
    console.error("Error generating AI report:", error);
    return "Ocurrió un error al comunicarse con el servicio de IA. Por favor intente más tarde.";
  }
};