import React from 'react';
import { X, Cloud } from 'lucide-react';
import { motion } from 'motion/react';
import { CloudConfig } from '../types';

interface CloudConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CloudConfig;
  onSave: (config: CloudConfig) => void;
}

export const CloudConfigModal: React.FC<CloudConfigModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [localConfig, setLocalConfig] = React.useState<CloudConfig>(config);

  React.useEffect(() => {
    setLocalConfig(config);
  }, [config]);

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
            <Cloud className="w-5 h-5 text-purple-600" />
            Configuração da Nuvem
          </h3>
          <button onClick={onClose}><X className="w-6 h-6 text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">URL - Análise Simples:</label>
            <input 
              type="text" 
              value={localConfig.urlSimple} 
              onChange={e => setLocalConfig({...localConfig, urlSimple: e.target.value})}
              className="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">URL - Comparativo:</label>
            <input 
              type="text" 
              value={localConfig.urlCompare} 
              onChange={e => setLocalConfig({...localConfig, urlCompare: e.target.value})}
              className="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Seu Nome:</label>
            <input 
              type="text" 
              value={localConfig.userName} 
              onChange={e => setLocalConfig({...localConfig, userName: e.target.value})}
              className="w-full border rounded p-2 text-sm outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-2">
          <button onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">Cancelar</button>
          <button onClick={() => onSave(localConfig)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">Salvar</button>
        </div>
      </motion.div>
    </div>
  );
};
