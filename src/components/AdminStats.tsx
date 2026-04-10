import React from 'react';
import { Users, Calendar } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { countBillableDays } from '../lib/utils';

export const AdminStats = () => {
    const { users, vacations, holidays } = useAppContext();
    const totalUsers = users.filter((u: any) => u.role !== 'admin').length;
    const totalVacationDays = vacations.filter((v: any) => v.status === 'approved').reduce((acc: number, v: any) => acc + countBillableDays(v.startDate, v.endDate, holidays), 0);
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"><div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center"><div><div className="text-gray-500 text-sm">Сотрудников</div><div className="text-3xl font-bold">{totalUsers}</div></div><Users className="w-8 h-8 text-blue-500 opacity-20"/></div><div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center"><div><div className="text-gray-500 text-sm">Дней отпуска (Согл.)</div><div className="text-3xl font-bold">{totalVacationDays}</div></div><Calendar className="w-8 h-8 text-green-500 opacity-20"/></div></div>
    );
};
