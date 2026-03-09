import React from 'react';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CalcParams } from '../types';

interface ConfirmParamsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  params: CalcParams;
}

export const ConfirmParamsModal: React.FC<ConfirmParamsModalProps> = ({ isOpen, onClose, onConfirm, params }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="bg-orange-50 px-6 py-4 border-b border-orange-100 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-orange-600" />
          <h3 className="font-bold text-lg text-orange-900">Confirmar Parâmetros</h3>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Deseja gerar a tabela utilizando os parâmetros cadastrados abaixo?
          </p>
          
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Fator f1:</span>
              <span className="font-bold">{params.f1}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Fator f2:</span>
              <span className="font-bold">{params.f2}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Fator f3:</span>
              <span className="font-bold">{params.f3}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Markup CRT:</span>
              <span className="font-bold">{params.markupCrt}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Markup ROL:</span>
              <span className="font-bold">{params.markupRol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Divisor 18%:</span>
              <span className="font-bold">{params.div18}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Revisar
          </button>
          <button 
            onClick={onConfirm} 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-blue-100 flex items-center gap-2 hover:bg-blue-700 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            Confirmar e Gerar
          </button>
        </div>
      </motion.div>
    </div>
  );
};
