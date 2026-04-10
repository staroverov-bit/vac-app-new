import React, { useState, useMemo } from 'react';
import { Clock, Check, X, AlertTriangle, Info } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { countBillableDays } from '../lib/utils';
import { ConfirmModal } from './ConfirmModal';
import { db, appId } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import emailjs from '@emailjs/browser';

export const ManagerApprovals = ({ onUpdateVacation }: any) => {
    const { currentUser, users, vacations, holidays, logAction, emailTemplates } = useAppContext();
    const [rejectModal, setRejectModal] = useState<any>(null);
    const [overlapModal, setOverlapModal] = useState<any>(null);
    const [newEmployeeModal, setNewEmployeeModal] = useState<any>(null);

    const pendingRequests = useMemo(() => {
        return vacations.filter((v: any) => {
            const reqUser = users.find((u: any) => u.id === v.userId);
            if (v.status !== 'pending' || !reqUser || reqUser.id === currentUser.id) return false;
            if (currentUser.role === 'ceo') return reqUser.role === 'manager' || (reqUser.role === 'employee' && !users.some((u: any) => u.department === reqUser.department && u.role === 'manager'));
            if (currentUser.role === 'manager') return reqUser.department === currentUser.department && reqUser.role === 'employee';
            return false;
        }).map((v: any) => ({ ...v, user: users.find((u: any) => u.id === v.userId) }));
    }, [vacations, users, currentUser]);

    const doApprove = (vacation: any) => {
        onUpdateVacation({ ...vacation, status: 'approved' }); 
        logAction('APPROVE_VACATION', `Согласован отпуск сотрудника ${vacation.user.name}`, vacation.id, vacation, { ...vacation, status: 'approved' });
        setOverlapModal(null);
        setNewEmployeeModal(null);
    };

    const checkOverlapAndApprove = (vacation: any) => {
        const overlappingUsers: string[] = [];
        vacations.forEach((v: any) => {
            if (v.status !== 'approved' || v.userId === vacation.userId) return;
            const otherUser = users.find((u: any) => u.id === v.userId);
            if (!otherUser || otherUser.department !== vacation.user.department) return;
            
            const s1 = new Date(vacation.startDate).getTime();
            const e1 = new Date(vacation.endDate).getTime();
            const s2 = new Date(v.startDate).getTime();
            const e2 = new Date(v.endDate).getTime();
            
            if (s1 <= e2 && e1 >= s2) {
                overlappingUsers.push(otherUser.name);
            }
        });

        if (overlappingUsers.length > 0) {
            setOverlapModal({ vacation, overlappingUsers: Array.from(new Set(overlappingUsers)) });
        } else {
            doApprove(vacation);
        }
    };

    const handleApproveClick = (vacation: any) => {
        if (vacation.user.hireDate) {
            const hireDate = new Date(vacation.user.hireDate);
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            if (hireDate > sixMonthsAgo) {
                setNewEmployeeModal(vacation);
                return;
            }
        }
        checkOverlapAndApprove(vacation);
    };

    const confirmReject = async () => { 
        if (rejectModal) { 
            onUpdateVacation({ ...rejectModal, status: 'rejected' }); 
            logAction('REJECT_VACATION', `Отклонен отпуск сотрудника ${rejectModal.user?.name}`, rejectModal.id, rejectModal, { ...rejectModal, status: 'rejected' }); 
            
            window.dispatchEvent(new CustomEvent('app-toast', { 
                detail: { 
                    title: 'Уведомление сотруднику', 
                    message: `Отправлено письмо об отклонении для ${rejectModal.user?.name}.`, 
                    type: 'email' 
                } 
            }));

            try {
                const subject = emailTemplates?.rejectionSubject || 'Заявка на отпуск отклонена';
                let message = emailTemplates?.rejectionMessage || 'Здравствуйте, {{name}}. Ваша заявка на отпуск с {{startDate}} по {{endDate}} была отклонена руководителем.';
                message = message.replace(/{{name}}/g, rejectModal.user.name).replace(/{{startDate}}/g, new Date(rejectModal.startDate).toLocaleDateString()).replace(/{{endDate}}/g, new Date(rejectModal.endDate).toLocaleDateString());

                await emailjs.send(
                    'service_0rphyiq', 
                    'template_ledfu5o', 
                    { 
                        to_email: rejectModal.user.email,
                        to_name: rejectModal.user.name,
                        cc_emails: emailTemplates?.rejectionCc || '',
                        subject: subject,
                        message: message
                    }, 
                    '5Q8hmgz0oZzkUr87Z'
                );
            } catch (e: any) {
                console.error("Error sending rejection email:", e);
                window.dispatchEvent(new CustomEvent('app-toast', { 
                    detail: { 
                        title: 'Ошибка отправки письма', 
                        message: `EmailJS: ${e.text || e.message || 'Проверьте Service ID и настройки.'}`, 
                        type: 'error' 
                    } 
                }));
            }

            setRejectModal(null); 
        } 
    };

    if (pendingRequests.length === 0) return null;
    return (
        <div className="bg-white rounded-xl shadow-sm border border-orange-200 overflow-hidden mb-6 animate-fadeIn">
            <div className="bg-orange-50 px-6 py-4 border-b border-orange-100 flex items-center justify-between"><h3 className="font-bold text-orange-800 flex items-center gap-2"><Clock className="w-5 h-5" /> Заявки на согласование ({pendingRequests.length})</h3></div>
            <div className="divide-y divide-gray-100">
                {pendingRequests.map((req: any) => (
                    <div key={req._docId || req.id} className="p-4 flex items-center justify-between hover:bg-orange-50/30 transition-colors">
                        <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 text-sm">{req.user.avatar}</div><div><div className="font-semibold text-gray-800">{req.user.name}</div><div className="text-sm text-gray-500">{new Date(req.startDate).toLocaleDateString()} — {new Date(req.endDate).toLocaleDateString()} <span className="ml-1 font-medium text-indigo-600">({countBillableDays(req.startDate, req.endDate, holidays)} дн.)</span></div></div></div>
                        <div className="flex gap-2"><button onClick={() => handleApproveClick(req)} className="flex items-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm"><Check className="w-4 h-4" /> Согласовать</button><button onClick={() => setRejectModal(req)} className="flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm"><X className="w-4 h-4" /> Отклонить</button></div>
                    </div>
                ))}
            </div>
            <ConfirmModal isOpen={!!rejectModal} title="Отклонение" message={`Отклонить заявку сотрудника?`} confirmText="Отклонить" isDanger={true} onConfirm={confirmReject} onCancel={() => setRejectModal(null)} />
            
            {newEmployeeModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 text-center">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                            <Info className="w-6 h-6 text-blue-600" />
                        </div>
                        <h4 className="font-bold text-gray-800 text-lg mb-2">Малый срок работы</h4>
                        <p className="text-sm text-gray-600 mb-6">
                            Сотрудник <strong>{newEmployeeModal.user.name}</strong> работает в компании менее 6 месяцев (дата найма: {new Date(newEmployeeModal.user.hireDate).toLocaleDateString()}).
                            <br/><br/>
                            Вы уверены, что хотите продолжить согласование?
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setNewEmployeeModal(null)} className="flex-1 py-2 bg-gray-100 text-gray-800 font-medium rounded-lg hover:bg-gray-200 transition-colors">
                                Отмена
                            </button>
                            <button onClick={() => { setRejectModal(newEmployeeModal); setNewEmployeeModal(null); }} className="flex-1 py-2 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 transition-colors">
                                Отклонить
                            </button>
                            <button onClick={() => {
                                const vac = newEmployeeModal;
                                setNewEmployeeModal(null);
                                checkOverlapAndApprove(vac);
                            }} className="flex-1 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors">
                                Согласовать
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {overlapModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 text-center">
                        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-6 h-6 text-amber-600" />
                        </div>
                        <h4 className="font-bold text-gray-800 text-lg mb-2">Пересечение отпусков</h4>
                        <p className="text-sm text-gray-600 mb-6">
                            Дни отпуска сотрудника <strong>{overlapModal.vacation.user.name}</strong> пересекаются с отпусками следующих коллег из этого же отдела:
                            <br/><br/>
                            <span className="font-medium text-gray-800">{overlapModal.overlappingUsers.join(', ')}</span>
                            <br/><br/>
                            Вы уверены, что хотите согласовать этот отпуск?
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setOverlapModal(null)} className="flex-1 py-2 bg-gray-100 text-gray-800 font-medium rounded-lg hover:bg-gray-200 transition-colors">
                                Отмена
                            </button>
                            <button onClick={() => { setRejectModal(overlapModal.vacation); setOverlapModal(null); }} className="flex-1 py-2 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 transition-colors">
                                Отклонить
                            </button>
                            <button onClick={() => doApprove(overlapModal.vacation)} className="flex-1 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors">
                                Согласовать
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
