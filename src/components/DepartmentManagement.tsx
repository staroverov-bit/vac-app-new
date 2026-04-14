import React, { useState, useEffect } from 'react';
import { Briefcase, Pencil, Trash2, Check, X, Plus, AlertOctagon } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ConfirmModal } from './ConfirmModal';
import { addDoc, collection, updateDoc, doc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db, appId } from '../firebase';

export const DepartmentManagement = ({ deptDocs }: any) => {
    const { departments, users, logAction } = useAppContext();
    const [newDept, setNewDept] = useState(''), [editingDept, setEditingDept] = useState<string | null>(null), [editValue, setEditValue] = useState('');
    const [moveModal, setMoveModal] = useState<any>(null), [targetDept, setTargetDept] = useState(''), [confirmDelete, setConfirmDelete] = useState<any>(null), [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

    useEffect(() => {
        if (moveModal || confirmDelete || confirmDeleteAll) {
            if ('parentIFrame' in window && (window as any).parentIFrame) {
                (window as any).parentIFrame.scrollToOffset(0, 0);
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    }, [moveModal, confirmDelete, confirmDeleteAll]);

    const handleAdd = async (e: any) => { 
        e.preventDefault(); 
        const trimmedName = newDept.trim();
        if (!trimmedName) return;
        const isDuplicate = departments.some((d: string) => d.toLowerCase() === trimmedName.toLowerCase());
        if (!isDuplicate) { 
            const ref = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'departments'), { name: trimmedName }); 
            logAction('ADD_DEPT', `Создан отдел: ${trimmedName}`, ref.id, null, { name: trimmedName, _docId: ref.id }); 
            setNewDept(''); 
        } else {
            alert('Отдел с таким названием уже существует!');
        }
    };
    const startEdit = (dept: string) => { setEditingDept(dept); setEditValue(dept); };
    const saveEdit = async () => { if (editValue && !departments.includes(editValue)) { const deptDoc = deptDocs.find((d: any) => d.name === editingDept); if (deptDoc) { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'departments', deptDoc.id), { name: editValue }); logAction('EDIT_DEPT', `Переименован отдел: ${editingDept} -> ${editValue}`, deptDoc.id, deptDoc, { ...deptDoc, name: editValue }); } const usersToUpdate = users.filter((u: any) => u.department === editingDept); for (const u of usersToUpdate) { if (u._docId) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', u._docId), { department: editValue }); } } setEditingDept(null); };
    const attemptDelete = (dept: string) => { const usersInDept = users.filter((u: any) => u.department === dept).length; if (usersInDept > 0) { setTargetDept(''); setMoveModal({ deptToDelete: dept, usersCount: usersInDept }); } else setConfirmDelete({ dept }); };
    const confirmDeleteDept = async () => { const deptDoc = deptDocs.find((d: any) => d.name === confirmDelete.dept); if (deptDoc) { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'departments', deptDoc.id)); logAction('DELETE_DEPT', `Удален отдел: ${deptDoc.name}`, deptDoc.id, deptDoc); } setConfirmDelete(null); };
    const confirmMoveAndDelete = async () => { const deptToDelete = moveModal.deptToDelete; const newDepartment = targetDept || 'Без отдела'; const usersToMove = users.filter((u: any) => u.department === deptToDelete); for (const u of usersToMove) { if (u._docId) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', u._docId), { department: newDepartment }); } const deptDoc = deptDocs.find((d: any) => d.name === deptToDelete); if (deptDoc) { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'departments', deptDoc.id)); logAction('DELETE_DEPT_BULK_MOVE', `Удален отдел ${deptDoc.name} с переносом сотрудников в ${newDepartment}`, deptDoc.id, deptDoc); } setMoveModal(null); };
    const handleDeleteAllDepartments = async () => { const batch = writeBatch(db); deptDocs.forEach((d: any) => { const ref = doc(db, 'artifacts', appId, 'public', 'data', 'departments', d.id); batch.delete(ref); }); users.forEach((u: any) => { if(u._docId) { const ref = doc(db, 'artifacts', appId, 'public', 'data', 'users', u._docId); batch.update(ref, { department: 'Без отдела' }); } }); await batch.commit(); logAction('DELETE_ALL_DEPTS', `Удалены все отделы`); setConfirmDeleteAll(false); };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4"><Briefcase className="w-5 h-5 text-gray-500" />Управление отделами</h3>
            <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
                {departments.map((dept: string, index: number) => (
                    <div key={`dept-${index}`} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100 group">
                        {editingDept === dept ? (<div className="flex gap-2 flex-1 items-center"><input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded outline-none bg-white" autoFocus /><button onClick={saveEdit} className="p-1 text-green-600 hover:bg-green-100 rounded"><Check className="w-4 h-4" /></button><button onClick={() => setEditingDept(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button></div>) : (<><span className="text-sm font-medium text-gray-700">{dept}</span><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => startEdit(dept)} className="p-1 text-blue-500 hover:bg-blue-50 rounded" title="Переименовать"><Pencil className="w-4 h-4" /></button><button onClick={() => attemptDelete(dept)} className="p-1 text-red-400 hover:bg-red-50 rounded" title="Удалить"><Trash2 className="w-4 h-4" /></button></div></>)}
                    </div>
                ))}
            </div>
            <form onSubmit={handleAdd} className="flex gap-2 mb-6"><input type="text" placeholder="Новый отдел" value={newDept} onChange={(e) => setNewDept(e.target.value)} className="flex-1 px-3 py-2 rounded border border-gray-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /><button type="submit" disabled={!newDept} className="bg-indigo-600 text-white px-3 py-2 rounded text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"><Plus className="w-4 h-4" /> Добавить</button></form>
            <button onClick={() => setConfirmDeleteAll(true)} type="button" className="w-full text-center text-xs text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 p-2 rounded transition-colors flex items-center justify-center gap-1"><AlertOctagon className="w-3 h-3" /> Удалить ВСЕ отделы</button>
            <ConfirmModal isOpen={!!confirmDelete} title="Удаление отдела" message={`Вы уверены, что хотите удалить отдел "${confirmDelete?.dept}"?`} onConfirm={confirmDeleteDept} onCancel={() => setConfirmDelete(null)} />
            <ConfirmModal isOpen={confirmDeleteAll} title="Удаление ВСЕХ отделов" message="ВНИМАНИЕ! Это действие необратимо." confirmText="Удалить всё" onConfirm={handleDeleteAllDepartments} onCancel={() => setConfirmDeleteAll(false)} />
            {moveModal && (<div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-32 p-4 backdrop-blur-sm"><div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 border border-gray-200"><h4 className="font-bold text-gray-800 text-lg mb-2">Удаление отдела</h4><p className="text-sm text-gray-500 mb-4 text-center">Куда перевести <b>{moveModal.usersCount}</b> сотрудников?</p><select value={targetDept} onChange={(e) => setTargetDept(e.target.value)} className="w-full mb-6 px-3 py-2 border border-gray-300 rounded text-sm bg-white"><option value="">Выберите новый отдел</option><option value="Без отдела">Без отдела</option>{departments.filter((d: string) => d !== moveModal.deptToDelete).map((d: string, i: number) => (<option key={`m-${i}`} value={d}>{d}</option>))}</select><div className="flex gap-3"><button onClick={() => setMoveModal(null)} className="flex-1 py-2 bg-gray-100 rounded">Отмена</button><button onClick={confirmMoveAndDelete} className="flex-1 py-2 bg-indigo-600 text-white rounded">Перенести</button></div></div></div>)}
        </div>
    );
};
