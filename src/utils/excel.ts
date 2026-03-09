import * as XLSX from 'xlsx';
import { TableItem } from '../types';

export function detectColumns(headers: string[]) {
  const mapping: Record<string, string> = {};
  const normalize = (s: string) => s.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  headers.forEach(h => {
    const nh = normalize(h);
    if (nh.includes("CODIGO SILOGICA") || nh === "COD" || nh === "SKU" || nh === "ID") mapping.code = h;
    else if (nh === "MATERIAL" || nh === "MAT") mapping.material = h;
    else if (nh === "MALHA" || nh === "MESH") mapping.mesh = h;
    else if (nh.includes("FIO") || nh === "WIRE" || nh.includes("DIAMETRO")) mapping.wire = h;
    else if (nh === "LARGURA" || nh === "LARG" || nh === "WIDTH" || nh === "TAMANHO") mapping.width = h;
    else if (nh.includes("/M2") || nh.includes("PRECO") || nh.includes("VALOR") || nh === "USD") mapping.priceM2 = h;
  });

  return mapping;
}

export async function processFile(file: File): Promise<TableItem[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet) as any[];

        if (json.length === 0) {
          reject("Arquivo vazio");
          return;
        }

        const headers = Object.keys(json[0]);
        const mapping = detectColumns(headers);

        const codeCounts: Record<string, number> = {};
        const items: TableItem[] = json.map((row, idx) => {
          const code = String(row[mapping.code] || '');
          if (code) codeCounts[code] = (codeCounts[code] || 0) + 1;
          
          return {
            id: `${idx}-${Date.now()}`,
            code,
            material: String(row[mapping.material] || ''),
            mesh: String(row[mapping.mesh] || ''),
            wire: String(row[mapping.wire] || ''),
            width: String(row[mapping.width] || ''),
            priceM2: parseFloat(String(row[mapping.priceM2] || '0').replace(',', '.')) || 0,
            reasons: [],
            changeType: null,
            oldPrice: null,
            newPrice: null,
            variation: null
          };
        });

        // Mark duplicates immediately
        items.forEach(item => {
          if (item.code && codeCounts[item.code] > 1) {
            item.anomaly = true;
            item.reasons.push('Código duplicado no arquivo');
          }
        });

        resolve(items);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function compareData(oldData: TableItem[], newData: TableItem[]): TableItem[] {
  const result: TableItem[] = [];
  const oldMap = new Map<string, TableItem>();
  
  oldData.forEach(item => {
    if (item.code) oldMap.set(item.code, item);
  });
  
  newData.forEach(item => {
    const oldItem = item.code ? oldMap.get(item.code) : null;
    
    if (oldItem) {
      const newItem = { ...item };
      newItem.oldPrice = oldItem.priceM2;
      newItem.newPrice = item.priceM2;
      
      const specChanged = oldItem.material !== item.material || 
                          oldItem.mesh !== item.mesh || 
                          oldItem.wire !== item.wire || 
                          oldItem.width !== item.width;
      
      const priceChanged = Math.abs(item.priceM2 - oldItem.priceM2) > 0.01;

      if (oldItem.priceM2 > 0) {
        newItem.variation = ((item.priceM2 - oldItem.priceM2) / oldItem.priceM2) * 100;
      }

      if (specChanged || priceChanged) {
        newItem.changeType = 'changed';
        newItem.reasons = [];
        if (specChanged) newItem.reasons.push('Especificação alterada');
        if (priceChanged) newItem.reasons.push('Preço alterado');
      }
      
      oldMap.delete(item.code);
      result.push(newItem);
    } else {
      const newItem = { ...item };
      newItem.changeType = 'new';
      newItem.reasons = ['Item novo'];
      newItem.newPrice = item.priceM2;
      result.push(newItem);
    }
  });
  
  oldMap.forEach(item => {
    const newItem = { ...item };
    newItem.changeType = 'removed';
    newItem.reasons = ['Item removido'];
    newItem.oldPrice = item.priceM2;
    newItem.pendingRemoval = true;
    result.push(newItem);
  });
  
  return result;
}
