// src/services/data-source.ts
// ============================================================
// Data source configuration.
//
// Set VITE_DATA_SOURCE in your .env:
//   VITE_DATA_SOURCE=mock   → use localStorage mock data (default)
//   VITE_DATA_SOURCE=api    → use real backend API
// ============================================================

const DATA_SOURCE = import.meta.env.VITE_DATA_SOURCE ?? "mock";

export const isMockDataSource = DATA_SOURCE !== "api";
export const isApiDataSource = DATA_SOURCE === "api";
