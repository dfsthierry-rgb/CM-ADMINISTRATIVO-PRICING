import React, { useState } from 'react';
import { X, Copy, Eye, Code, Printer, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string;
}

export const PublishModal: React.FC<PublishModalProps> = ({ isOpen, onClose, code }) => {
  const [tab, setTab] = useState<'preview' | 'code'>('preview');

  if (!isOpen) return null;

  const handlePrint = () => {
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(code);
      win.document.close();
      win.focus();
      setTimeout(() => {
        win.print();
        win.close();
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h3 className="font-bold text-lg">Publicação de Preços</h3>
            <div className="flex bg-white p-1 rounded-lg border border-gray-200">
              <button 
                onClick={() => setTab('preview')}
                className={cn("px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all", tab === 'preview' ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50")}
              >
                <Eye className="w-3.5 h-3.5" /> Visualização
              </button>
              <button 
                onClick={() => setTab('code')}
                className={cn("px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all", tab === 'code' ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-50")}
              >
                <Code className="w-3.5 h-3.5" /> Código HTML
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrint}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              title="Imprimir / Gerar PDF"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-all"><X className="w-6 h-6 text-gray-400" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative bg-gray-100">
          <AnimatePresence mode="wait">
            {tab === 'preview' ? (
              <motion.div 
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full"
              >
                <iframe 
                  srcDoc={code} 
                  title="Preview" 
                  className="w-full h-full border-none bg-white"
                />
              </motion.div>
            ) : (
              <motion.div 
                key="code"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full p-6"
              >
                <textarea 
                  readOnly 
                  value={code} 
                  className="w-full h-full border rounded-xl p-6 font-mono text-xs bg-white shadow-inner outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <p className="text-xs text-gray-400 italic">Dica: Use o botão de impressora para gerar um PDF da tabela.</p>
          <div className="flex gap-3">
            {tab === 'code' && (
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(code);
                  alert("Código copiado!");
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-green-100 transition-all"
              >
                <Copy className="w-4 h-4" />
                Copiar Código
              </button>
            )}
            <button onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-2 rounded-lg font-bold transition-all">Fechar</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Helper for Tailwind classes
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
