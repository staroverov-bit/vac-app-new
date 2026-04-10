import React, { useState } from 'react';
import { History, CheckCircle, RotateCcw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ConfirmModal } from './ConfirmModal';
import { deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db, appId } from '../firebase';

export const AuditLogViewer = () => {
    const { auditLogs, logAction } = useAppContext();
    const [restoreModal, setRestoreModal] = useState<any>(null);

    const confirmRestore = async () => {
        const log = restoreModal;
        if (!log) return;
        try {
            let collectionName = '', typeName = '';
            if (log.type.includes('USER')) { collectionName = 'users'; typeName = 'RESTORE_USER'; }
            else if (log.type.includes('VACATION')) { collectionName = 'vacations'; typeName = 'RESTORE_VACATION'; }
            else if (log.type.includes('DEPT')) { collectionName = 'departments'; typeName = 'RESTORE_DEPT'; }
            else throw new Error("Этот тип действий не поддерживает автоматическое восстановление.");

            if (log.type.includes('ADD') || log.type.includes('CREATE')) {
                const docId = log.newData?._docId || log.targetId;
                if (!docId) throw new Error("ID документа не найден.");
                await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, docId));
                logAction(typeName, `Отменено добавление: ${log.details}`);
            } else {
                if (!log.previousData || !log.previousData._docId) throw new Error("Невозможно восстановить: нет данных предыдущего состояния.");
                const { _docId, ...dataToRestore } = log.previousData;
                await setDoc(doc(db, 'artifacts', appId, 'public', 'data', collectionName, _docId), dataToRestore);
                logAction(typeName, `Восстановлены данные из лога: ${log.details}`);
            }
            window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Успех', message: 'Действие успешно отменено.', type: 'self' } }));
        } catch (e: any) { window.dispatchEvent(new CustomEvent('app-toast', { detail: { title: 'Ошибка', message: e.message, type: 'subordinate' } })); } 
        finally { setRestoreModal(null); }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
            <div className="p-6 border-b border-gray-200 bg-gray-50"><h3 className="font-bold text-gray-800 flex items-center gap-2"><History className="w-5 h-5 text-gray-500" /> Журнал действий (Бэклог)</h3><p className="text-xs text-gray-500 mt-1">История изменений системы. Поддерживается возврат (отмена) для удаленных или измененных данных.</p></div>
            <div className="overflow-auto max-h-96">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 sticky top-0 shadow-sm z-10"><tr><th className="p-3 w-40 text-gray-600 font-semibold text-xs uppercase">Дата / Время</th><th className="p-3 w-48 text-gray-600 font-semibold text-xs uppercase">Пользователь</th><th className="p-3 w-40 text-gray-600 font-semibold text-xs uppercase">Тип действия</th><th className="p-3 text-gray-600 font-semibold text-xs uppercase">Детали</th><th className="p-3 w-24 text-right text-gray-600 font-semibold text-xs uppercase">Откат</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                        {auditLogs.length === 0 && (<tr><td colSpan={5} className="p-8 text-center text-gray-400">Журнал пуст</td></tr>)}
                        {auditLogs.map((log: any) => {
                            const date = new Date(log.timestamp);
                            const isDestructive = log.type.includes('DELETE') || log.type.includes('EDIT') || log.type.includes('REJECT');
                            const canRestore = (!!log.previousData || log.type.includes('ADD') || log.type.includes('CREATE')) && (log.type.includes('USER') || log.type.includes('DEPT') || log.type.includes('VACATION'));
                            return (
                                <tr key={log._docId} className={`hover:bg-gray-50 transition-colors ${log.reverted ? 'opacity-50' : ''}`}>
                                    <td className="p-3 text-gray-500 text-xs">{date.toLocaleDateString()} <span className="font-medium">{date.toLocaleTimeString()}</span></td>
                                    <td className="p-3 font-medium text-gray-700">{log.userName}</td>
                                    <td className="p-3"><span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${log.type.includes('DELETE') ? 'bg-red-100 text-red-700' : (log.type.includes('ADD') || log.type.includes('CREATE')) ? 'bg-green-100 text-green-700' : log.type.includes('RESTORE') ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{log.type}</span></td>
                                    <td className={`p-3 ${isDestructive ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>{log.details}</td>
                                    <td className="p-3 text-right">{log.reverted ? (<span className="text-xs text-gray-400 flex items-center justify-end gap-1"><CheckCircle className="w-3 h-3"/> Отменено</span>) : canRestore ? (<button onClick={() => setRestoreModal(log)} className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded text-xs flex items-center justify-end gap-1 ml-auto transition-colors" title="Отменить действие"><RotateCcw className="w-3 h-3" /> Возврат</button>) : null}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <ConfirmModal isOpen={!!restoreModal} title="Отмена действия" message={restoreModal ? `Вы уверены, что хотите отменить действие:\n"${restoreModal.details}"?` : ''} confirmText="Отменить действие" isDanger={false} onConfirm={confirmRestore} onCancel={() => setRestoreModal(null)} />
        </div>
    );
};
