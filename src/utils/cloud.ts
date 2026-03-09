import { TableItem, CloudConfig } from '../types';

export async function saveToCloud(
  url: string, 
  name: string, 
  userName: string, 
  data: TableItem[], 
  currentData: TableItem[], 
  newData: TableItem[]
) {
  if (!url) throw new Error('URL da nuvem não configurada!');
  
  const payload = {
    action: 'save',
    name,
    userName,
    data,
    currentData,
    newData,
    itemCount: data.length,
    timestamp: new Date().toISOString()
  };

  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  if (!result.success && result.status !== 'ok') {
    throw new Error(result.error || 'Erro desconhecido ao salvar na nuvem');
  }
  return result;
}

export async function listCloudAnalyses(url: string) {
  if (!url) return [];
  const response = await fetch(`${url}?action=list`);
  return await response.json();
}

export async function loadFromCloud(url: string, id: string) {
  if (!url) throw new Error('URL da nuvem não configurada!');
  const response = await fetch(`${url}?action=load&id=${id}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
}

export async function deleteFromCloud(url: string, id: string) {
  if (!url) throw new Error('URL da nuvem não configurada!');
  const response = await fetch(`${url}?action=delete&id=${id}`);
  const result = await response.json();
  if (!result.success) throw new Error(result.error || 'Erro ao excluir');
  return result;
}
