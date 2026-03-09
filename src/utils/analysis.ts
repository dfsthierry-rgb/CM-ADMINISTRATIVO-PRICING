import { TableItem } from '../types';
import { normalizeMaterial } from './calculations';
import { MATERIAL_HIERARCHY } from '../constants';

export function getMaterialRank(mat: string): number {
  const m = normalizeMaterial(mat);
  if (m.includes('316')) return 5;
  if (m.includes('304')) return 4;
  if (m.includes('302')) return 3;
  if (m.includes('GALV')) return 2;
  if (m.includes('CARB')) return 1;
  return 0;
}

export function analyzeData(items: TableItem[]): TableItem[] {
  const result = items.map(item => ({ ...item, reasons: [...item.reasons], anomaly: false }));
  
  // 0. Duplicate Detection
  const codeCounts: Record<string, number> = {};
  result.forEach(item => {
    if (item.changeType === 'removed' || !item.code) return;
    codeCounts[item.code] = (codeCounts[item.code] || 0) + 1;
  });

  result.forEach(item => {
    if (item.changeType === 'removed' || !item.code) return;
    if (codeCounts[item.code] > 1) {
      item.anomaly = true;
      if (!item.reasons.includes('Código duplicado')) {
        item.reasons.push('Código duplicado');
      }
    }
  });

  // Group by Material + Mesh + Wire
  const groups: Record<string, number[]> = {};
  result.forEach(item => {
    if (item.changeType === 'removed') return;
    const key = `${normalizeMaterial(item.material)}|${item.mesh}|${item.wire}`;
    if (!groups[key]) groups[key] = [];
    const price = item.newPrice !== null ? item.newPrice : item.priceM2;
    if (price > 0) groups[key].push(price);
  });

  const groupMeans: Record<string, number> = {};
  Object.entries(groups).forEach(([key, prices]) => {
    if (prices.length > 0) {
      groupMeans[key] = prices.reduce((a, b) => a + b, 0) / prices.length;
    }
  });

  result.forEach(item => {
    if (item.changeType === 'removed') return;

    // 1. Zero Price
    const currentPrice = item.newPrice !== null ? item.newPrice : item.priceM2;
    if (currentPrice <= 0) {
      item.anomaly = true;
      if (!item.reasons.includes('Preço zerado')) {
        item.reasons.push('Preço zerado');
      }
      const key = `${normalizeMaterial(item.material)}|${item.mesh}|${item.wire}`;
      const mean = groupMeans[key];
      if (mean) item.suggestedPriceM2 = mean;
    }

    // 2. Deviation from Mean
    const key = `${normalizeMaterial(item.material)}|${item.mesh}|${item.wire}`;
    const mean = groupMeans[key];
    if (mean && currentPrice > 0) {
      const dev = Math.abs(currentPrice - mean) / mean;
      if (dev > 0.2) {
        item.anomaly = true;
        const devText = `Desvio de ${Math.round(dev * 100)}% da média do grupo (R$ ${mean.toFixed(2)})`;
        if (!item.reasons.includes(devText)) {
          item.reasons.push(devText);
        }
        item.suggestedPriceM2 = mean;
      }
    }

    // 3. Material Hierarchy
    const sameSpec = result.filter(other => 
      other.mesh === item.mesh && 
      other.wire === item.wire && 
      other.width === item.width &&
      other.id !== item.id &&
      other.changeType !== 'removed'
    );

    sameSpec.forEach(other => {
      const rankItem = getMaterialRank(item.material);
      const rankOther = getMaterialRank(other.material);
      const normItem = normalizeMaterial(item.material);
      const normOther = normalizeMaterial(other.material);

      if (normItem === normOther) return;
      if (rankItem === 0 || rankOther === 0) return;

      const priceOther = other.newPrice !== null ? other.newPrice : other.priceM2;

      if (rankItem > rankOther && currentPrice < priceOther && currentPrice > 0) {
        item.anomaly = true;
        const reason = `${item.material} mais barato que ${other.material} (R$ ${priceOther.toFixed(2)})`;
        if (!item.reasons.includes(reason)) {
          item.reasons.push(reason);
        }
      }
    });
  });

  return result;
}
