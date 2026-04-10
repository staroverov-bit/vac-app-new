import React, { useRef } from 'react';
import { Save, Download, Upload } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { writeBatch, doc } from 'firebase/firestore';
import { db, appId } from '../firebase';

export const DatabaseBackup = () => {
    const { users, departments, vacations, holidays, authSettings, logAction, deptDocs } = useAppContext();
    const fileRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        const data = { users, deptDocs, vacations, holidays, authSettings };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `HR_Backup_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        logAction('SYSTEM_BACKUP', 'Скачан бэкап базы данных (JSON)');
    };

    const handleImport = (e: any) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (evt: any) => {
            try {
                const data = JSON.parse(evt.target.result);
                const batch = writeBatch(db);
                if (data.users) data.users.forEach((u: any) => batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'users', u._docId || u.id.toString()), u));
                if (data.vacations) data.vacations.forEach((v: any) => batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'vacations', v._docId || v.id.toString()), v));
                if (data.deptDocs) data.deptDocs.forEach((d: any) => batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'departments', d.id), d));
                if (data.holidays) batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'holidays'), data.holidays);
                if (data.authSettings) batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'auth'), data.authSettings);
                await batch.commit();
                logAction('SYSTEM_RESTORE', 'База восстановлена из бэкапа');
                alert('База данных успешно восстановлена!');
            } catch(err: any) { alert('Ошибка импорта: ' + err.message); }
        };
        reader.readAsText(file); e.target.value = '';
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4"><Save className="w-5 h-5 text-gray-500" />Резервное копирование</h3>
            <p className="text-xs text-gray-500 mb-4">Полная выгрузка и загрузка базы данных (пользователи, отпуска, отделы, настройки).</p>
            <div className="flex gap-3">
                <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-700 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"><Download className="w-4 h-4"/> Скачать JSON</button>
                <button onClick={() => fileRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 bg-orange-50 text-orange-700 py-2 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors"><Upload className="w-4 h-4"/> Загрузить JSON</button>
                <input type="file" ref={fileRef} onChange={handleImport} accept=".json" className="hidden" />
            </div>
        </div>
    );
};
