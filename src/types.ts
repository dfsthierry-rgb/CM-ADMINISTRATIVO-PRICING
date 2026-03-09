export interface CalcParams {
  f1: number;
  f2: number;
  f3: number;
  markupCrt: number;
  markupRol: number;
  div18: number;
  div12: number;
  div7: number;
  divCT: number;
}

export interface TableItem {
  id: string | number;
  code: string;
  material: string;
  mesh: string;
  wire: string;
  width: string;
  priceM2: number;
  
  // Análise Simples
  anomaly?: boolean;
  reasons: string[];
  suggestedPriceM2?: number;

  // Comparativo
  changeType: 'changed' | 'new' | 'removed' | null;
  oldPrice: number | null;
  newPrice: number | null;
  variation: number | null;
  pendingRemoval?: boolean;

  // Edição
  isEdited?: boolean;
  originalPriceM2?: number;
}

export interface CloudConfig {
  urlSimple: string;
  urlCompare: string;
  userName: string;
}
