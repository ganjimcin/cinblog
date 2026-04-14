// src/components/admin-cms/utils/formatter.js

/**
 * Formats a date string into YYYY-MM-DD.
 * @param {string} dateStr - The date string to format.
 * @returns {string} - The formatted date string.
 */
export function formatDate(dateStr) {
    if (!dateStr) return 'Sin fecha';
    const date = new Date(dateStr);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/**
 * Convierte un texto en un slug amigable para URL.
 * @param {string} text - El texto a convertir.
 * @returns {string} - El slug generado.
 */
export function slugify(text) {
    if (!text) return "";
    return text
      .toString()
      .toLowerCase()
      .trim()
      .normalize('NFD') // Normalizar para separar acentos
      .replace(/[\u0300-\u036f]/g, '') // Eliminar los acentos
      .replace(/\s+/g, '-') // Reemplazar espacios por guiones
      .replace(/[^\w-]+/g, '') // Eliminar caracteres no alfanuméricos (excepto guiones)
      .replace(/--+/g, '-') // Reemplazar múltiples guiones por uno solo
      .replace(/^-+/, '') // Eliminar guiones al principio
      .replace(/-+$/, ''); // Eliminar guiones al final
}
