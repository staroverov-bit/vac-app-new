import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "Удалить", isDanger = true }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 border border-gray-200 animate-fadeIn">
        <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">{isDanger && <AlertTriangle className="w-5 h-5 text-red-500" />}{title}</h3>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed whitespace-pre-line">{message}</p>
        <div className="flex gap-3"><button onClick={onCancel} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">Отмена</button><button onClick={onConfirm} className={`flex-1 px-4 py-2 text-white rounded-lg font-medium ${isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>{confirmText}</button></div>
      </div>
    </div>
  );
};
