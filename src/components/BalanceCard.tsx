import React, { useMemo } from 'react';
import { PieChart, Clock, FileText } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { countBillableDays } from '../lib/utils';

export const BalanceCard = () => {
    const { currentUser: user, vacations, holidays } = useAppContext();
    const stats = useMemo(() => {
        const totalAllowance = Number(user.yearlyAllowance) + Number(user.carryOverDays);
        let usedDays = 0, pendingDays = 0, draftDays = 0;
        vacations.filter((v: any) => v.userId === user.id).forEach((v: any) => {
            const days = countBillableDays(v.startDate, v.endDate, holidays);
            if (v.status === 'approved') usedDays += days;
            else if (v.status === 'pending') pendingDays += days;
            else if (v.status === 'draft') draftDays += days;
        });
        return { totalAllowance, usedDays, pendingDays, draftDays, remainingDays: totalAllowance - usedDays - pendingDays - draftDays };
    }, [user, vacations, holidays]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wide"><PieChart className="w-4 h-4 text-gray-500" /> Мой Баланс</h3>
            <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-blue-50 p-3 rounded-lg text-center"><div className="text-xs text-blue-600 font-medium mb-1">Всего</div><div className="text-xl font-bold text-blue-800">{stats.totalAllowance}</div></div>
                <div className="bg-green-50 p-3 rounded-lg text-center"><div className="text-xs text-green-600 font-medium mb-1">Одобрено</div><div className="text-xl font-bold text-green-800">{stats.usedDays}</div></div>
                <div className={`p-3 rounded-lg text-center ${stats.remainingDays < 0 ? 'bg-red-50' : 'bg-gray-100'}`}><div className={`text-xs font-medium mb-1 ${stats.remainingDays < 0 ? 'text-red-600' : 'text-gray-600'}`}>Остаток</div><div className={`text-xl font-bold ${stats.remainingDays < 0 ? 'text-red-800' : 'text-gray-800'}`}>{stats.remainingDays}</div></div>
            </div>
            {stats.pendingDays > 0 && <div className="mb-2 bg-orange-50 border border-orange-100 rounded-lg p-2 flex items-center justify-center gap-2 text-xs text-orange-700"><Clock className="w-3 h-3" /> На согласовании: <b>{stats.pendingDays}</b> дн.</div>}
            {stats.draftDays > 0 && <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-2 flex items-center justify-center gap-2 text-xs text-gray-600"><FileText className="w-3 h-3" /> В черновиках: <b>{stats.draftDays}</b> дн.</div>}
        </div>
    );
};
