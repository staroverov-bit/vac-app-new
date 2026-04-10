import React, { useState } from 'react';
import { Settings, Users, Briefcase, Calendar, Shield, Save, Mail } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { AdminStats } from './AdminStats';
import { UserManagement } from './UserManagement';
import { DepartmentManagement } from './DepartmentManagement';
import { HolidayManagement } from './HolidayManagement';
import { AuthSettingsManagement } from './AuthSettingsManagement';
import { DatabaseBackup } from './DatabaseBackup';
import { AuditLogViewer } from './AuditLogViewer';
import { EmailSettings } from './EmailSettings';

export const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('users');
    const { deptDocs } = useAppContext();

    return (
        <div className="space-y-6 animate-fadeIn">
            <AdminStats />
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex border-b border-gray-200 overflow-x-auto">
                    <button onClick={() => setActiveTab('users')} className={`px-6 py-4 text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'users' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}><Users className="w-4 h-4" /> Сотрудники</button>
                    <button onClick={() => setActiveTab('depts')} className={`px-6 py-4 text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'depts' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}><Briefcase className="w-4 h-4" /> Отделы</button>
                    <button onClick={() => setActiveTab('holidays')} className={`px-6 py-4 text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'holidays' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}><Calendar className="w-4 h-4" /> Праздники</button>
                    <button onClick={() => setActiveTab('email')} className={`px-6 py-4 text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'email' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}><Mail className="w-4 h-4" /> Шаблоны писем</button>
                    <button onClick={() => setActiveTab('settings')} className={`px-6 py-4 text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'settings' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}><Settings className="w-4 h-4" /> Настройки</button>
                    <button onClick={() => setActiveTab('audit')} className={`px-6 py-4 text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'audit' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}><Shield className="w-4 h-4" /> Аудит</button>
                </div>
                <div className="p-6 bg-gray-50/50 min-h-[500px]">
                    {activeTab === 'users' && <UserManagement />}
                    {activeTab === 'depts' && <DepartmentManagement deptDocs={deptDocs} />}
                    {activeTab === 'holidays' && <HolidayManagement />}
                    {activeTab === 'email' && <EmailSettings />}
                    {activeTab === 'settings' && (<div className="grid grid-cols-1 md:grid-cols-2 gap-6"><AuthSettingsManagement /><DatabaseBackup /></div>)}
                    {activeTab === 'audit' && <AuditLogViewer />}
                </div>
            </div>
        </div>
    );
};
