import React from 'react';
import { Lock } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { setDoc, doc } from 'firebase/firestore';
import { db, appId } from '../firebase';

export const AuthSettingsManagement = () => {
    const { authSettings, logAction } = useAppContext();
    const toggleSetting = async (key: string) => {
        const newValue = !authSettings[key];
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'auth'), { ...authSettings, [key]: newValue }, { merge: true });
        logAction('UPDATE_AUTH', `Изменены настройки входа. ${key} теперь ${newValue ? 'включен' : 'выключен'}`);
    };
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4"><Lock className="w-5 h-5 text-gray-500" />Методы входа</h3>
            <div className="space-y-3 text-sm text-gray-700">
                <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors -ml-2"><input type="checkbox" checked={authSettings.password} onChange={() => toggleSetting('password')} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer" /><span className="font-medium">Вход по списку и паролю</span></label>
                <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors -ml-2"><input type="checkbox" checked={authSettings.google} onChange={() => toggleSetting('google')} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer" /><span className="font-medium">Вход через Google</span></label>
                <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors -ml-2"><input type="checkbox" checked={authSettings.yandex} onChange={() => toggleSetting('yandex')} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer" /><span className="font-medium">Вход через Яндекс</span></label>
            </div>
        </div>
    );
};
