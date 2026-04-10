import React, { useState } from 'react';
import { Calendar, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { CURRENT_YEAR, GLOBAL_HOLIDAYS } from '../lib/constants';
import { ConfirmModal } from './ConfirmModal';
import { setDoc, doc } from 'firebase/firestore';
import { db, appId } from '../firebase';

export const HolidayManagement = () => {
    const { holidays, logAction } = useAppContext();
    const [inputText, setInputText] = useState('');
    const [parsed, setParsed] = useState<string[]>([]);
    const [holidayToDelete, setHolidayToDelete] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);

    const parseHolidays = (text: string) => {
        const monthMap: any = { января: '01', февраля: '02', марта: '03', апреля: '04', мая: '05', июня: '06', июля: '07', августа: '08', сентября: '09', октября: '10', ноября: '11', декабря: '12' };
        const holidaysSet = new Set<string>();
        const textRegex = /((?:\d{1,2}[,\sи]*)+)(января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)/gi;
        let match;
        while ((match = textRegex.exec(text)) !== null) {
            const daysStr = match[1], monthStr = match[2].toLowerCase(), monthNum = monthMap[monthStr], days = daysStr.match(/\d{1,2}/g);
            if (days && monthNum) days.forEach((d: string) => holidaysSet.add(`${String(d).padStart(2, '0')}-${monthNum}`));
        }
        const numRegex = /\b(\d{1,2})\.(\d{1,2})\b/g;
        while ((match = numRegex.exec(text)) !== null) {
            const day = parseInt(match[1], 10), month = parseInt(match[2], 10);
            if (day >= 1 && day <= 31 && month >= 1 && month <= 12) holidaysSet.add(`${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}`);
        }
        setParsed(Array.from(holidaysSet).sort());
    };

    const handleSave = async () => {
        const currentYearHolidays = GLOBAL_HOLIDAYS[selectedYear] || [];
        const combined = Array.from(new Set([...currentYearHolidays, ...parsed])).sort();
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'holidays'), { [selectedYear]: combined }, { merge: true });
        logAction('ADD_HOLIDAYS', `Добавлены выходные дни на ${selectedYear} год: ${parsed.join(', ')}`);
        setInputText(''); setParsed([]);
    };

    const confirmDeleteHoliday = async () => {
        if (!holidayToDelete) return;
        const currentYearHolidays = GLOBAL_HOLIDAYS[selectedYear] || [];
        const updated = currentYearHolidays.filter(d => d !== holidayToDelete);
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'holidays'), { [selectedYear]: updated }, { merge: true });
        logAction('DELETE_HOLIDAY', `Удален выходной день ${holidayToDelete} из ${selectedYear} года`);
        setHolidayToDelete(null);
    };

    const displayedHolidays = GLOBAL_HOLIDAYS[selectedYear] || [];

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><Calendar className="w-5 h-5 text-gray-500" />Праздничные дни</h3>
                <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-gray-500">Год:</label>
                    <input 
                        type="number" 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(Number(e.target.value))} 
                        className="px-2 py-1 border rounded-lg outline-none focus:border-blue-500 text-sm bg-gray-50 w-20" 
                    />
                </div>
            </div>
            <div className="mb-4"><label className="block text-xs font-medium text-gray-500 mb-1">Вставьте текст из Консультанта (напр. "1, 2 и 8 января...") или даты ("09.01")</label><textarea className="w-full px-3 py-2 border rounded-lg outline-none focus:border-blue-500 text-sm h-24 resize-none" value={inputText} onChange={(e) => { setInputText(e.target.value); parseHolidays(e.target.value); }} placeholder="Вставьте текст..." /></div>
            <div className="flex gap-2 mb-4"><button onClick={handleSave} disabled={parsed.length === 0} className="w-full bg-indigo-600 text-white px-3 py-2 rounded text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors">Добавить ({parsed.length} дн.)</button></div>
            <div className="text-xs text-gray-500"><strong>Будут добавлены в {selectedYear} год:</strong><div className="flex flex-wrap gap-1 mt-2">{parsed.map(d => <span key={`p-${d}`} className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-1 rounded">{d}</span>)}{parsed.length === 0 && <span>Нет данных</span>}</div></div>
            <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500"><strong>Уже в базе для {selectedYear} года ({displayedHolidays.length}):</strong><div className="flex flex-wrap gap-1 mt-2">{displayedHolidays.map((d: string) => (<span key={`h-${d}`} className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded group">{d}<button onClick={() => setHolidayToDelete(d)} className="text-gray-400 hover:text-red-500 transition-colors" title="Удалить"><X className="w-3 h-3" /></button></span>))}</div></div>
            <ConfirmModal isOpen={!!holidayToDelete} title="Удаление выходного" message={`Вы уверены, что хотите удалить выходной день ${holidayToDelete} из ${selectedYear} года?`} onConfirm={confirmDeleteHoliday} onCancel={() => setHolidayToDelete(null)} />
        </div>
    );
};
