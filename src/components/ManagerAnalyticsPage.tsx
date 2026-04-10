import React, { useState } from 'react';
import { ArrowLeft, Users, TrendingUp, PieChart, AlertCircle, CheckCircle, Building, Calendar } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { countBillableDays } from '../lib/utils';
import { CURRENT_YEAR } from '../lib/constants';

export const ManagerAnalyticsPage = ({ onBack }: any) => {
    const { currentUser, users, vacations, holidays, departments } = useAppContext();
    const [selectedDept, setSelectedDept] = useState<string>(currentUser.role === 'ceo' ? 'all' : currentUser.department);
    
    const isAllCompany = selectedDept === 'all';
    const deptUsers = isAllCompany ? users.filter((u: any) => u.role !== 'admin') : users.filter((u: any) => u.department === selectedDept && u.role !== 'admin');
    const deptVacations = vacations.filter((v: any) => deptUsers.find((u: any) => u.id === v.userId) && v.status === 'approved'); 
    
    const monthCounts = Array(12).fill(0);
    deptVacations.forEach((v: any) => { monthCounts[new Date(v.startDate).getMonth()]++; });
    const maxMonthIndex = monthCounts.indexOf(Math.max(...monthCounts));
    const peakMonth = new Date(CURRENT_YEAR, maxMonthIndex).toLocaleString('ru-RU', { month: 'long' });
    
    const usersWithVacation = new Set(deptVacations.map((v: any) => v.userId));
    const burnoutRiskUsers = deptUsers.filter((u: any) => !usersWithVacation.has(u.id));
    const totalUsers = deptUsers.length;
    const totalDaysPlanned = deptVacations.reduce((acc: number, v: any) => acc + countBillableDays(v.startDate, v.endDate, holidays), 0);

    const usersWithRemaining = deptUsers.map((u: any) => {
        const totalAllowance = Number(u.yearlyAllowance) + Number(u.carryOverDays);
        const usedDays = vacations
            .filter((v: any) => v.userId === u.id && v.status !== 'rejected' && v.status !== 'draft')
            .reduce((acc: number, v: any) => acc + countBillableDays(v.startDate, v.endDate, holidays), 0);
        const remaining = totalAllowance - usedDays;
        return { ...u, remaining, totalAllowance, usedDays };
    }).sort((a: any, b: any) => b.remaining - a.remaining);

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm"><ArrowLeft className="w-4 h-4" /> Назад к графику</button>
                    <h2 className="text-2xl font-bold text-gray-800">Аналитика: {isAllCompany ? 'Вся компания' : `Отдел "${selectedDept}"`}</h2>
                </div>
                {currentUser.role === 'ceo' && (
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                        <Building className="w-4 h-4 text-gray-500" />
                        <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="bg-transparent text-sm font-medium text-gray-700 outline-none cursor-pointer">
                            <option value="all">Вся компания</option>
                            {departments.map((d: string) => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6"><div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"><div className="flex items-center justify-between mb-4"><h3 className="text-gray-500 font-medium text-sm">Всего сотрудников</h3><Users className="w-5 h-5 text-emerald-500" /></div><div className="text-3xl font-bold text-gray-800">{totalUsers}</div></div><div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"><div className="flex items-center justify-between mb-4"><h3 className="text-gray-500 font-medium text-sm">Самый нагруженный месяц</h3><TrendingUp className="w-5 h-5 text-amber-500" /></div><div className="text-3xl font-bold text-gray-800 capitalize">{peakMonth}</div></div><div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"><div className="flex items-center justify-between mb-4"><h3 className="text-gray-500 font-medium text-sm">Использовано дней (Согл.)</h3><PieChart className="w-5 h-5 text-blue-500" /></div><div className="text-3xl font-bold text-gray-800">{totalDaysPlanned}</div></div></div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"><h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-red-500" />Зона внимания: Риск выгорания</h3>{burnoutRiskUsers.length > 0 ? (<div className="bg-red-50 border border-red-100 rounded-lg p-4"><p className="text-sm text-red-800 mb-2">Следующие сотрудники еще не запланировали отпуск в {CURRENT_YEAR} году:</p><div className="flex flex-wrap gap-2">{burnoutRiskUsers.map((u: any) => (<span key={u._docId || u.id} className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-full text-sm border border-red-200 text-gray-700"><div className="w-5 h-5 rounded-full bg-red-100 text-[10px] flex items-center justify-center font-bold text-red-600">{u.avatar}</div>{u.name} {isAllCompany && <span className="text-xs text-gray-400">({u.department})</span>}</span>))}</div></div>) : (<div className="bg-green-50 border border-green-100 rounded-lg p-4 flex items-center gap-2 text-green-700"><CheckCircle className="w-5 h-5" />Все сотрудники запланировали отдых.</div>)}</div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><Calendar className="w-5 h-5 text-indigo-500" />Остатки отпусков сотрудников</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                <th className="p-4 font-medium border-b border-gray-200">Сотрудник</th>
                                {isAllCompany && <th className="p-4 font-medium border-b border-gray-200">Отдел</th>}
                                <th className="p-4 font-medium border-b border-gray-200 text-center">Всего дней</th>
                                <th className="p-4 font-medium border-b border-gray-200 text-center">Запланировано</th>
                                <th className="p-4 font-medium border-b border-gray-200 text-center">Остаток (незапланировано)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {usersWithRemaining.map((u: any) => (
                                <tr key={u._docId || u.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 text-xs">{u.avatar}</div>
                                            <span className="font-medium text-gray-800">{u.name}</span>
                                        </div>
                                    </td>
                                    {isAllCompany && <td className="p-4 text-sm text-gray-600">{u.department}</td>}
                                    <td className="p-4 text-center text-sm text-gray-600">{u.totalAllowance}</td>
                                    <td className="p-4 text-center text-sm text-gray-600">{u.usedDays}</td>
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-sm font-bold ${u.remaining > 14 ? 'bg-red-100 text-red-700' : u.remaining > 0 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                            {u.remaining} дн.
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
