import { GLOBAL_HOLIDAYS } from './constants';

export const parseDateLocalObj = (dateStr: string | Date) => {
    if (!dateStr) return new Date();
    if (dateStr instanceof Date) return new Date(dateStr.getFullYear(), dateStr.getMonth(), dateStr.getDate());
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
};

export const parseDateLocal = (dateStr: string | Date) => parseDateLocalObj(dateStr).getTime();

export const isHoliday = (d: Date, hConfig = GLOBAL_HOLIDAYS) => { const year = d.getFullYear(); const dateStr = `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}`; return (hConfig[year] || []).includes(dateStr); };
export const isWeekend = (d: Date, hConfig = GLOBAL_HOLIDAYS) => d.getDay() === 0 || d.getDay() === 6 || isHoliday(d, hConfig);
export const countBillableDays = (s: string | Date, e: string | Date, hConfig = GLOBAL_HOLIDAYS) => { if (!s || !e) return 0; let c = 0, cur = parseDateLocalObj(s), end = parseDateLocalObj(e); while (cur <= end) { if (!isHoliday(cur, hConfig)) c++; cur.setDate(cur.getDate() + 1); } return c; };
export const isSameDay = (d1: Date, d2: Date) => d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();

export const getApproverForUser = (user: any, users: any[]) => {
    if (!user || !users) return null;
    if (user.role === 'admin' || user.role === 'ceo') return null; 
    if (user.role === 'manager') return users.find(u => u.role === 'ceo') || users.find(u => u.role === 'admin');
    const deptManager = users.find(u => u.department === user.department && u.role === 'manager');
    return deptManager || users.find(u => u.role === 'ceo') || users.find(u => u.role === 'admin');
};
