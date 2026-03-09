import React from 'react';
import { X, Code, Copy } from 'lucide-react';
import { motion } from 'motion/react';

interface AppsScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppsScriptModal: React.FC<AppsScriptModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const code = `function doGet(e) {
  return listAnalyses();
}

function doPost(e) {
  var action = e.parameter.action;
  var data = JSON.parse(e.postData.contents);
  
  if (action === 'save') return saveAnalysis(data);
  if (action === 'delete') return deleteAnalysis(data.id);
}

function saveAnalysis(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Dados') || ss.insertSheet('Dados');
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['ID', 'Nome', 'Data', 'Usuário', 'Dados']);
  }
  
  sheet.appendRow([
    data.id || Utilities.getUuid(),
    data.name,
    new Date(),
    data.user || 'Sistema',
    JSON.stringify(data.items)
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({status: 'ok'})).setMimeType(ContentService.MimeType.JSON);
}

function listAnalyses() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Dados');
  if (!sheet) return ContentService.createTextOutput('[]').setMimeType(ContentService.MimeType.JSON);
  
  var data = sheet.getDataRange().getValues();
  var results = [];
  for (var i = 1; i < data.length; i++) {
    results.push({
      id: data[i][0],
      name: data[i][1],
      date: data[i][2],
      user: data[i][3]
    });
  }
  return ContentService.createTextOutput(JSON.stringify(results)).setMimeType(ContentService.MimeType.JSON);
}`;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden"
      >
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Code className="w-5 h-5 text-purple-600" />
            Google Apps Script
          </h3>
          <button onClick={onClose}><X className="w-6 h-6 text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            Copie o código abaixo e cole no Editor de Scripts da sua Planilha Google (Extensões {'>'} Apps Script).
          </p>
          <div className="relative group">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl text-xs overflow-auto max-h-[400px] leading-relaxed">
              {code}
            </pre>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(code);
                alert("Código copiado!");
              }}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all opacity-0 group-hover:opacity-100"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
          <button onClick={onClose} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold">Fechar</button>
        </div>
      </motion.div>
    </div>
  );
};
