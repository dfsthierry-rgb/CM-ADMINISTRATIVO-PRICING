import React, { useState, useEffect } from 'react';
import { X, Calculator } from 'lucide-react';
import { motion } from 'motion/react';
import { CalcParams } from '../types';
import { calculatePrices } from '../utils/calculations';

interface SimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: CalcParams;
}

export const SimulatorModal: React.FC<SimulatorModalProps> = ({ isOpen, onClose, params }) => {
  const [price, setPrice] = useState<number>(100);
  const [results, setResults] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isOpen) {
      const res = calculatePrices(price, params);
      setResults(res);
    }
  }, [price, params, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            Simulador de Preços
          </h3>
          <button onClick={onClose}><X className="w-6 h-6 text-gray-400" /></button>
        </div>
        <div className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-500 uppercase mb-2">Preço $/m²</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">U$</span>
              <input 
                type="number" 
                autoFocus
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                placeholder="0,00"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-2xl font-bold outline-none focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {Object.entries(results).map(([key, val]) => (
              <div key={key} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-center">
                <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">{key}</div>
                <div className="text-lg font-bold text-blue-600">U$ {(val as number).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
