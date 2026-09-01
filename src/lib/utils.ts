import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Institutional Fuzzy Search (Sub-sequence matching)
 * Allows for partial matches, typos, and shorthand (e.g. "Krtk" matches "Karthik")
 */
export function fuzzySearch(query: string, text: string | null | undefined): boolean {
  if (!query) return true;
  if (!text) return false;
  
  const q = query.toLowerCase().replace(/\s/g, '');
  const t = text.toLowerCase().replace(/\s/g, '');
  
  // High-priority: Literal inclusion
  if (t.includes(q)) return true;
  
  // Heuristic: Sub-sequence matching
  let qIdx = 0;
  let tIdx = 0;
  
  while (qIdx < q.length && tIdx < t.length) {
    if (q[qIdx] === t[tIdx]) {
      qIdx++;
    }
    tIdx++;
  }
  
  return qIdx === q.length;
}

/**
 * Institutional standard DD/MM/YYYY date formatter
 * Converts "2026-09-15" or ISO strings to "15/09/2026"
 */
export function formatDateDDMMYYYY(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const cleanStr = dateStr.split("T")[0];
  const parts = cleanStr.split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

