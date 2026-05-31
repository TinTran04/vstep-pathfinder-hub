import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cleanDescription(desc: string | null | undefined, defaultVal = ""): string {
  if (!desc) return defaultVal;
  
  // 1. If it's a raw DOCX import string, return empty or defaultVal
  if (desc === "Imported from DOCX") {
    return defaultVal;
  }
  
  let cleaned = desc;
  
  // 2. Split by "|" and keep the first part if the rest contains metadata keys
  if (cleaned.includes("|")) {
    const parts = cleaned.split("|");
    const firstPart = parts[0].trim();
    const rest = parts.slice(1).join("|");
    if (/group:|mode:|groupTitle:|file:|import:/i.test(rest)) {
      cleaned = firstPart;
    }
  }
  
  // 3. Split by ";" and keep the first part if the rest contains metadata keys
  if (cleaned.includes(";")) {
    const parts = cleaned.split(";");
    const firstPart = parts[0].trim();
    const rest = parts.slice(1).join(";");
    if (/group:|mode:|groupTitle:|file:|import:/i.test(rest)) {
      cleaned = firstPart;
    }
  }
  
  // If the final cleaned string is "Imported from DOCX" or starts/matches only metadata, return defaultVal
  const isDocxImport = cleaned === "Imported from DOCX";
  const isOnlyMetadata = /^(group|mode|groupTitle|file|import):/i.test(cleaned);
  if (isDocxImport || isOnlyMetadata) {
    return defaultVal;
  }
  
  return cleaned.trim();
}
