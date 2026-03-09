import React from 'react';
import { X, Settings, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { CalcParams } from '../types';
import { calculatePrices } from '../utils/calculations';

interface ParamsModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: CalcParams;
  onSave: (newParams: CalcParams) => void;
  onReset: () => void;
}

export const ParamsModal: React.FC<ParamsModalProps> = ({ isOpen, onClose, params, onSave, onReset }) => {
  const [localParams, setLocalParams] = React.useState<CalcParams>(params);

  React.useEffect(() => {
    setLocalParams(params);
  }, [params]);

  if (!isOpen) return null;

  const preview = calculatePrices(100, localParams);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Parâmetros de Cálculo
          </h3>
          <button onClick={onClose}><X className="w-6 h-6 text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {['f1', 'f2', 'f3'].map(f => (
              <div key={f}>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fator {f}</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={(localParams as any)[f]} 
                  onChange={e => setLocalParams({...localParams, [f]: parseFloat(e.target.value)})} 
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Markup Corte (CRT)</label>
              <input type="number" step="0.01" value={localParams.markupCrt} onChange={e => setLocalParams({...localParams, markupCrt: parseFloat(e.target.value)})} className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Markup Rolo (ROL)</label>
              <input type="number" step="0.01" value={localParams.markupRol} onChange={e => setLocalParams({...localParams, markupRol: parseFloat(e.target.value)})} className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {['div18', 'div12', 'div7', 'divCT'].map(d => (
              <div key={d}>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{d.replace('div', 'Divisor ')}</label>
                <input type="number" step="0.0001" value={(localParams as any)[d]} onChange={e => setLocalParams({...localParams, [d]: parseFloat(e.target.value)})} className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
          </div>

          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
            <h4 className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Preview (Base $/m² = 100,00)
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(preview).map(([key, val]) => (
                <div key={key} className="bg-white p-2 rounded border border-blue-100 text-center">
                  <div className="text-[10px] font-bold text-gray-400 uppercase">{key}</div>
                  <div className="text-xs font-bold text-blue-600">{val.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between">
          <button onClick={onReset} className="text-sm font-bold text-red-600 hover:underline">Restaurar Padrões</button>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-500">Cancelar</button>
            <button onClick={() => onSave(localParams)} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-blue-100">Salvar Alterações</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
