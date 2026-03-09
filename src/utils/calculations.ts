import { CalcParams } from '../types';

export function calculatePrices(priceM2: number, params: CalcParams) {
  const base = params.f1 * params.f2 * params.f3;
  const numCrt = base * params.markupCrt * priceM2;
  const numRol = base * params.markupRol * priceM2;
  
  return {
    crt18: numCrt / params.div18,
    rol18: numRol / params.div18,
    crt12: numCrt / params.div12,
    rol12: numRol / params.div12,
    crt7: numCrt / params.div7,
    rol7: numRol / params.div7,
    crtCT: numCrt / params.divCT,
    rolCT: numRol / params.divCT,
  };
}

export function normalizeMaterial(mat: string): string {
  if (!mat) return '';
  return mat.toUpperCase()
    .replace("AÇO INOX", "INOX")
    .replace("ACO INOX", "INOX")
    .replace("INOX", "")
    .trim();
}

export function getMaterialRank(mat: string): number {
  const m = normalizeMaterial(mat);
  if (m.includes('316')) return 5;
  if (m.includes('304')) return 4;
  if (m.includes('302')) return 3;
  if (m.includes('GALV')) return 2;
  if (m.includes('CARB')) return 1;
  return 0;
}

export function smartSort(a: any, b: any) {
  const parse = (val: any) => {
    const s = String(val).replace(',', '.');
    const num = parseFloat(s);
    return isNaN(num) ? String(val).toLowerCase() : num;
  };
  const valA = parse(a);
  const valB = parse(b);
  if (typeof valA === 'number' && typeof valB === 'number') return valA - valB;
  return String(valA).localeCompare(String(valB));
}
