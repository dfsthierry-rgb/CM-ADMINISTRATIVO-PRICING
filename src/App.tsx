import React, { useState, useEffect, useMemo } from 'react';
import { 
  Upload, FileText, Settings, Search, AlertTriangle, CheckCircle, 
  Trash2, Plus, ArrowRight, Calculator, Code, Cloud, Share2, 
  Download, RefreshCw, X, Info, Home, LayoutDashboard, History, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { TableItem, CalcParams, CloudConfig } from './types';
import { VERSION, DEFAULT_PARAMS, MATERIAL_COLORS } from './constants';
import { smartSort, calculatePrices } from './utils/calculations';
import { processFile, compareData } from './utils/excel';
import { analyzeData } from './utils/analysis';
import { saveToCloud, listCloudAnalyses, loadFromCloud, deleteFromCloud } from './utils/cloud';
import { generatePublishHtml } from './utils/publish';

import { SimulatorModal } from './components/SimulatorModal';
import { ParamsModal } from './components/ParamsModal';
import { AppsScriptModal } from './components/AppsScriptModal';
import { CloudConfigModal } from './components/CloudConfigModal';
import { PublishModal } from './components/PublishModal';
import { ConfirmParamsModal } from './components/ConfirmParamsModal';

// --- Utility Functions ---

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [view, setView] = useState<'home' | 'simple' | 'compare'>('home');
  const [mode, setMode] = useState<'simple' | 'compare'>('simple');
  const [params, setParams] = useState<CalcParams>(() => {
    const saved = localStorage.getItem('centralMeshParams');
    return saved ? JSON.parse(saved) : DEFAULT_PARAMS;
  });
  const [cloudConfig, setCloudConfig] = useState<CloudConfig>(() => {
    const saved = localStorage.getItem('centralMeshConfig');
    return saved ? JSON.parse(saved) : { urlSimple: '', urlCompare: '', userName: 'Usuário' };
  });

  const [data, setData] = useState<TableItem[]>([]);
  const [oldTable, setOldTable] = useState<TableItem[]>([]);
  const [newTable, setNewTable] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [modals, setModals] = useState({
    params: false,
    simulator: false,
    appsScript: false,
    cloud: false,
    publish: false,
    confirmParams: false
  });
  const [publishCode, setPublishCode] = useState('');
  const [pendingPublishType, setPendingPublishType] = useState<'complete' | 'sellers' | null>(null);

  const [lastPubs, setLastPubs] = useState<{ complete: string | null, sellers: string | null }>(() => {
    const saved = localStorage.getItem('centralMeshLastPubs');
    return saved ? JSON.parse(saved) : { complete: null, sellers: null };
  });

  const [filters, setFilters] = useState({
    code: '', material: 'Todos', mesh: 'Todos', wire: 'Todos', status: 'Todos'
  });

  // Cache handling
  useEffect(() => {
    const key = mode === 'simple' ? 'centralMeshSimple' : 'centralMeshCompare';
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.data) setData(parsed.data);
        else setData([]);
      } catch (e) { 
        console.error(e); 
        setData([]);
      }
    } else {
      setData([]);
    }
  }, [mode]);

  useEffect(() => {
    if (data.length > 0) {
      const key = mode === 'simple' ? 'centralMeshSimple' : 'centralMeshCompare';
      localStorage.setItem(key, JSON.stringify({ data, timestamp: new Date().toISOString(), itemCount: data.length }));
    }
  }, [data, mode]);

  const startComparison = () => {
    const savedSimple = localStorage.getItem('centralMeshSimple');
    if (savedSimple) {
      try {
        const parsed = JSON.parse(savedSimple);
        if (parsed.data) setNewTable(parsed.data); // Cache is the "Current/New" work
      } catch (e) { console.error("Erro ao carregar base para comparativo:", e); }
    }
    setMode('compare');
    setView('compare');
    setData([]); 
    setOldTable([]); // Reset old table so user can upload it
    localStorage.removeItem('centralMeshCompare'); // Clear previous comparison cache to allow fresh upload
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const items = await processFile(file);
      setData(analyzeData(items));
    } catch (err) { alert(err); }
    finally { setLoading(false); }
  };

  const runComparison = () => {
    if (oldTable.length === 0 || newTable.length === 0) return;
    setLoading(true);
    try {
      const compared = compareData(oldTable, newTable);
      setData(analyzeData(compared));
    } catch (err) {
      alert("Erro ao comparar tabelas: " + err);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter(item => {
      const matchCode = (item.code || '').toLowerCase().includes(filters.code.toLowerCase());
      const matchMaterial = filters.material === 'Todos' || item.material === filters.material;
      const matchMesh = filters.mesh === 'Todos' || item.mesh === filters.mesh;
      const matchWire = filters.wire === 'Todos' || item.wire === filters.wire;
      let matchStatus = true;
      if (filters.status === 'Apenas p/ Revisar') matchStatus = !!item.anomaly;
      else if (filters.status === 'Apenas OK') matchStatus = !item.anomaly;
      else if (filters.status === 'Apenas Alterados') matchStatus = item.changeType === 'changed';
      else if (filters.status === 'Apenas Novos') matchStatus = item.changeType === 'new';
      else if (filters.status === 'Apenas Removidos') matchStatus = item.changeType === 'removed';
      return matchCode && matchMaterial && matchMesh && matchWire && matchStatus;
    }).sort((a, b) => {
      const s1 = smartSort(a.mesh, b.mesh);
      if (s1 !== 0) return s1;
      const s2 = smartSort(a.wire, b.wire);
      if (s2 !== 0) return s2;
      const s3 = smartSort(a.width, b.width);
      if (s3 !== 0) return s3;
      return (a.material || '').localeCompare(b.material || '');
    });
  }, [data, filters]);

  const filterOptions = useMemo(() => ({
    materials: Array.from(new Set(data.map(d => d.material))).sort(),
    meshes: Array.from(new Set(data.map(d => d.mesh))).sort(smartSort),
    wires: Array.from(new Set(data.map(d => d.wire))).sort(smartSort)
  }), [data]);

  const variationGeral = useMemo(() => {
    const changed = data.filter(d => d.variation !== null && d.changeType !== 'new' && d.changeType !== 'removed');
    return changed.length ? changed.reduce((a, b) => a + (b.variation || 0), 0) / changed.length : 0;
  }, [data]);

  const updatePrice = (id: string | number, val: number) => {
    setData(prev => {
      const newData = prev.map(item => {
        if (item.id === id) {
          const newItem = { ...item, priceM2: val, newPrice: val, isEdited: true, anomaly: false, reasons: [] };
          if (item.oldPrice !== null && item.oldPrice > 0) newItem.variation = ((val - item.oldPrice) / item.oldPrice) * 100;
          return newItem;
        }
        return item;
      });
      return analyzeData(newData);
    });
  };

  const initiatePublish = (type: 'complete' | 'sellers') => {
    setPendingPublishType(type);
    setModals(m => ({ ...m, confirmParams: true }));
  };

  const handleConfirmAndPublish = () => {
    if (!pendingPublishType) return;
    const code = generatePublishHtml(pendingPublishType, data, params, mode);
    setPublishCode(code);
    
    const updatedPubs = { ...lastPubs, [pendingPublishType]: code };
    setLastPubs(updatedPubs);
    localStorage.setItem('centralMeshLastPubs', JSON.stringify(updatedPubs));

    setModals(m => ({ ...m, confirmParams: false, publish: true }));
    setPendingPublishType(null);
  };

  const exportExcel = (type: 'complete' | 'sellers') => {
    const base = params.f1 * params.f2 * params.f3;
    const exportData = filteredData.map(item => {
      const price = item.newPrice !== null ? item.newPrice : item.priceM2;
      const p = calculatePrices(price, params);
      const row: any = { "Código": item.code, "Material": item.material, "Malha": item.mesh, "Fio": item.wire, "Largura": item.width };
      if (type === 'complete') row["$/m²"] = price;
      row["18% CRT"] = p.crt18; row["18% ROL"] = p.rol18;
      row["12% CRT"] = p.crt12; row["12% ROL"] = p.rol12;
      row["7% CRT"] = p.crt7; row["7% ROL"] = p.rol7;
      if (type === 'complete') { row["CT CRT"] = p.crtCT; row["CT ROL"] = p.rolCT; }
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Preços");
    XLSX.writeFile(wb, `Tabela_${type}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <div className="bg-green-500 text-white text-center py-2 text-sm font-bold shadow-sm">✅ VERSÃO {VERSION} ATUALIZADA!</div>
      <nav className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('home')}>
            <FileText className="w-6 h-6" />
            <div><h1 className="text-xl font-bold">Central Mesh</h1><p className="text-xs opacity-80">Gestão de Preços</p></div>
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={() => setView('home')} className={cn("p-2 hover:bg-white/10 rounded-lg transition-colors", view === 'home' && "bg-white/20")}><Home className="w-5 h-5" /></button>
            <button onClick={() => setModals(m => ({...m, params: true}))} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><Settings className="w-5 h-5" /></button>
            <button onClick={() => setModals(m => ({...m, cloud: true}))} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><Cloud className="w-5 h-5" /></button>
            <button onClick={() => setModals(m => ({...m, appsScript: true}))} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><Code className="w-5 h-5" /></button>
            <span className="bg-orange-500 text-white px-2 py-1 rounded text-[10px] font-bold ml-2">v{VERSION}</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <AnimatePresence mode="wait">
          {view === 'home' ? (
            <motion.div 
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button 
                  onClick={() => setModals(m => ({ ...m, simulator: true }))}
                  className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all text-left group"
                >
                  <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Calculator className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Simulador de Preços</h3>
                  <p className="text-sm text-gray-500">Calcule instantaneamente os markups e divisores para qualquer $/m².</p>
                </button>

                <button 
                  onClick={() => { setMode('simple'); setView('simple'); }}
                  className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all text-left group"
                >
                  <div className="bg-purple-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Search className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Análise Simples</h3>
                  <p className="text-sm text-gray-500">Analise inconsistências e desvios de preços em uma única tabela.</p>
                  {data.length > 0 && mode === 'simple' && (
                    <div className="mt-4 flex items-center gap-2 text-xs font-bold text-green-600">
                      <History className="w-3 h-3" /> Última análise carregada ({data.length} itens)
                    </div>
                  )}
                </button>

                <button 
                  onClick={startComparison}
                  className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all text-left group"
                >
                  <div className="bg-orange-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <RefreshCw className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Comparativo Atual x Anterior</h3>
                  <p className="text-sm text-gray-500">Compare a tabela anterior com a nova e veja variações e novos itens.</p>
                  {data.length > 0 && mode === 'compare' && (
                    <div className="mt-4 flex items-center gap-2 text-xs font-bold text-blue-600">
                      <History className="w-3 h-3" /> Último comparativo ativo ({data.length} itens)
                    </div>
                  )}
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-3">
                  <LayoutDashboard className="w-5 h-5 text-gray-400" />
                  <h3 className="font-bold">Últimas Publicações</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-lg mb-2">Publicação Vendedores</h4>
                      <p className="text-xs text-gray-500 mb-4">Versão simplificada sem $/m² e CT.</p>
                    </div>
                    {lastPubs.sellers ? (
                      <button 
                        onClick={() => { setPublishCode(lastPubs.sellers!); setModals(m => ({ ...m, publish: true })); }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" /> Visualizar Última
                      </button>
                    ) : (
                      <div className="text-xs text-gray-400 italic text-center py-2">Nenhuma publicação gerada ainda.</div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-lg mb-2">Publicação Completa</h4>
                      <p className="text-xs text-gray-500 mb-4">Análise da Diretoria com todos os parâmetros.</p>
                    </div>
                    {lastPubs.complete ? (
                      <button 
                        onClick={() => { setPublishCode(lastPubs.complete!); setModals(m => ({ ...m, publish: true })); }}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" /> Visualizar Última
                      </button>
                    ) : (
                      <div className="text-xs text-gray-400 italic text-center py-2">Nenhuma publicação gerada ainda.</div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="analysis"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <button onClick={() => setView('home')} className="text-gray-500 hover:text-blue-600 flex items-center gap-2 font-bold text-sm transition-colors">
                  <ArrowRight className="w-4 h-4 rotate-180" /> Voltar ao Início
                </button>
                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
                  <button onClick={() => { setMode('simple'); setView('simple'); }} className={cn("px-6 py-2 rounded-lg text-sm font-medium transition-all", mode === 'simple' ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-100")}>Análise Simples</button>
                  <button onClick={startComparison} className={cn("px-6 py-2 rounded-lg text-sm font-medium transition-all", mode === 'compare' ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-100")}>Comparativo</button>
                </div>
              </div>

              {data.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center space-y-4">
                  <Upload className="w-12 h-12 text-blue-600 mx-auto" />
                  <h3 className="text-lg font-semibold">{mode === 'simple' ? 'Upload da Tabela' : 'Upload das Tabelas'}</h3>
                  <div className="flex gap-4 justify-center pt-4">
                    {mode === 'simple' ? (
                      <label className="cursor-pointer bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 hover:scale-105 transition-transform"><Plus className="w-5 h-5" />Selecionar Arquivo<input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleFileUpload} /></label>
                    ) : (
                      <>
                        <label className={cn("cursor-pointer px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all", oldTable.length ? "bg-green-100 text-green-700 border-green-200" : "bg-blue-600 text-white hover:bg-blue-700")}>
                          {oldTable.length ? <CheckCircle className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                          {oldTable.length ? "Tabela Anterior Carregada" : "Selecionar Tabela ANTERIOR (Excel)"}
                          <input type="file" className="hidden" accept=".xlsx,.xls" onChange={async e => {
                            const items = await processFile(e.target.files![0]);
                            setOldTable(items);
                          }} />
                        </label>
                        <div className={cn("px-6 py-3 rounded-xl font-bold border flex items-center gap-2 transition-all", newTable.length ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-400 border-gray-200")}>
                          {newTable.length ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                          {newTable.length ? "Tabela Atual Carregada (da Análise)" : "Nenhuma Análise Recente Encontrada"}
                        </div>
                        {oldTable.length > 0 && newTable.length > 0 && (
                          <button onClick={runComparison} className="bg-orange-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 hover:scale-105 transition-transform">
                            Comparar Agora <ArrowRight className="w-5 h-5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {mode === 'compare' && (
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
                      <div className="flex items-center gap-4"><RefreshCw className="w-8 h-8 text-blue-600" /><div><h4 className="text-xs font-bold text-gray-400 uppercase">Variação Geral</h4><p className={cn("text-2xl font-black", variationGeral > 0 ? "text-red-600" : "text-blue-600")}>{(variationGeral > 0 ? '▲ +' : '▼ ') + variationGeral.toFixed(2)}%</p></div></div>
                      <div className="flex gap-6 text-right">
                        {['changed', 'new', 'removed'].map(s => (
                          <div key={s}><div className="text-[10px] font-bold text-gray-400 uppercase">{s === 'changed' ? 'Alt' : s === 'new' ? 'Novos' : 'Rem'}</div><div className={cn("text-lg font-bold", s === 'new' ? "text-green-600" : s === 'removed' ? "text-red-600" : "text-blue-600")}>{data.filter(d => d.changeType === s).length}</div></div>
                        ))}
                        {data.some(d => d.reasons.includes('Código duplicado no arquivo')) && (
                          <div className="bg-red-50 px-3 py-1 rounded-lg border border-red-100">
                            <div className="text-[10px] font-bold text-red-400 uppercase">Duplicados</div>
                            <div className="text-lg font-bold text-red-600">{data.filter(d => d.reasons.includes('Código duplicado no arquivo')).length}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 sticky top-[88px] z-40 grid grid-cols-1 md:grid-cols-5 gap-4 shadow-md">
                    <input type="text" placeholder="Código..." className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" value={filters.code} onChange={e => setFilters(f => ({...f, code: e.target.value}))} />
                    <select className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" value={filters.material} onChange={e => setFilters(f => ({...f, material: e.target.value}))}><option>Todos Materiais</option>{filterOptions.materials.map(m => <option key={m}>{m}</option>)}</select>
                    <select className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" value={filters.mesh} onChange={e => setFilters(f => ({...f, mesh: e.target.value}))}><option>Todas Malhas</option>{filterOptions.meshes.map(m => <option key={m}>{m}</option>)}</select>
                    <select className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" value={filters.wire} onChange={e => setFilters(f => ({...f, wire: e.target.value}))}><option>Todos Fios</option>{filterOptions.wires.map(w => <option key={w}>{w}</option>)}</select>
                    <select className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" value={filters.status} onChange={e => setFilters(f => ({...f, status: e.target.value}))}><option>Todos Status</option><option>Apenas p/ Revisar</option><option>Apenas OK</option>{mode === 'compare' && <><option>Apenas Alterados</option><option>Apenas Novos</option><option>Apenas Removidos</option></>}</select>
                    <div className="md:col-span-5 flex justify-between items-center pt-2 border-t border-gray-100">
                      <span className="text-xs font-bold text-gray-400 uppercase">Exibindo {filteredData.length} itens ({filteredData.filter(d => d.anomaly).length} p/ revisar)</span>
                      <button onClick={() => setFilters({code: '', material: 'Todos', mesh: 'Todos', wire: 'Todos', status: 'Todos'})} className="text-xs font-bold text-red-600 hover:underline">Limpar Filtros</button>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="max-h-[500px] overflow-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                          <tr className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                            <th className="px-4 py-3">Status</th><th className="px-4 py-3">Código</th><th className="px-4 py-3">Material</th><th className="px-4 py-3">Malha</th><th className="px-4 py-3">Fio</th><th className="px-4 py-3">Larg.</th><th className="px-4 py-3">$/m²</th>{mode === 'compare' && <th className="px-4 py-3">Var.</th>}<th className="px-4 py-3 min-w-[280px]">Análise</th><th className="px-4 py-3">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredData.map(item => (
                            <tr key={item.id} className={cn("hover:bg-gray-50 transition-colors", MATERIAL_COLORS[item.material] || "bg-white", item.anomaly && "bg-orange-50/50")}>
                              <td className="px-4 py-4">
                                {item.changeType === 'new' && <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mr-1">NOVO</span>}
                                {item.changeType === 'changed' && <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mr-1">ALT</span>}
                                {item.changeType === 'removed' && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mr-1">REM</span>}
                                {item.reasons.includes('Código duplicado no arquivo') && <span className="bg-orange-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded mr-1">DUP</span>}
                                {item.anomaly && <AlertTriangle className="w-4 h-4 text-orange-500 inline" />}
                                {!item.anomaly && !item.changeType && <CheckCircle className="w-4 h-4 text-green-500 inline" />}
                              </td>
                              <td className="px-4 py-4 font-medium">{item.code}</td>
                              <td className="px-4 py-4">{item.material}</td>
                              <td className="px-4 py-4">{item.mesh}</td>
                              <td className="px-4 py-4">{item.wire}</td>
                              <td className="px-4 py-4">{item.width}</td>
                              <td className="px-4 py-4 font-bold"><input type="number" value={item.newPrice !== null ? item.newPrice : item.priceM2} onChange={e => updatePrice(item.id, parseFloat(e.target.value))} className="w-20 bg-transparent border-b border-transparent focus:border-blue-500 outline-none" /></td>
                              {mode === 'compare' && <td className={cn("px-4 py-4 font-bold", (item.variation || 0) > 0 ? "text-red-600" : "text-blue-600")}>{item.variation !== null ? (item.variation > 0 ? '+' : '') + item.variation.toFixed(1) + '%' : '-'}</td>}
                              <td className="px-4 py-4 text-[11px] text-gray-500 leading-relaxed" style={{ whiteSpace: 'normal' }}>{item.reasons.map((r, i) => <div key={i}>• {r}</div>)}{item.suggestedPriceM2 && <button onClick={() => updatePrice(item.id, item.suggestedPriceM2!)} className="text-blue-600 font-bold hover:underline mt-1">Corrigir para R$ {item.suggestedPriceM2.toFixed(2)}</button>}</td>
                              <td className="px-4 py-4"><button onClick={() => setData(prev => prev.filter(p => p.id !== item.id))} className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4">
                    <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
                      <button onClick={() => exportExcel('sellers')} className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-lg">Excel Vendedores</button>
                      <button onClick={() => exportExcel('complete')} className="px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-lg">Excel Completo</button>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => initiatePublish('sellers')} className="bg-gray-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg flex items-center gap-2 hover:scale-105 transition-transform"><Share2 className="w-5 h-5" />Pub. Vendedores</button>
                      <button onClick={() => initiatePublish('complete')} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg flex items-center gap-2 hover:scale-105 transition-transform"><Share2 className="w-5 h-5" />Pub. Completa</button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <SimulatorModal isOpen={modals.simulator} onClose={() => setModals(m => ({...m, simulator: false}))} params={params} />
      <ParamsModal isOpen={modals.params} onClose={() => setModals(m => ({...m, params: false}))} params={params} onSave={p => { setParams(p); localStorage.setItem('centralMeshParams', JSON.stringify(p)); setModals(m => ({...m, params: false})); }} onReset={() => { setParams(DEFAULT_PARAMS); localStorage.setItem('centralMeshParams', JSON.stringify(DEFAULT_PARAMS)); }} />
      <AppsScriptModal isOpen={modals.appsScript} onClose={() => setModals(m => ({...m, appsScript: false}))} />
      <CloudConfigModal isOpen={modals.cloud} onClose={() => setModals(m => ({...m, cloud: false}))} config={cloudConfig} onSave={c => { setCloudConfig(c); localStorage.setItem('centralMeshConfig', JSON.stringify(c)); setModals(m => ({...m, cloud: false})); }} />
      <PublishModal isOpen={modals.publish} onClose={() => setModals(m => ({...m, publish: false}))} code={publishCode} />
      <ConfirmParamsModal isOpen={modals.confirmParams} onClose={() => setModals(m => ({...m, confirmParams: false}))} onConfirm={handleConfirmAndPublish} params={params} />
    </div>
  );
}
