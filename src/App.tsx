import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, onSnapshot, doc, deleteDoc, updateDoc, addDoc, writeBatch } from 'firebase/firestore';
import { auth, db, appId } from './firebase';
import { AppContext } from './context/AppContext';
import { LoginScreen } from './components/LoginScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { ManagerDashboard } from './components/ManagerDashboard';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import emailjs from '@emailjs/browser';

function App() {
  const [isReady, setIsReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [deptDocs, setDeptDocs] = useState<any[]>([]);
  const [vacations, setVacations] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any>({});
  const [authSettings, setAuthSettings] = useState<any>({ allowedDomains: '', requireAdminApproval: false });
  const [emailTemplates, setEmailTemplates] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [toast, setToast] = useState<{title: string, message: string, type: 'success'|'error'|'info'} | null>(null);

  useEffect(() => {
    const handleToast = (e: any) => {
      setToast(e.detail);
      setTimeout(() => setToast(null), 5000);
    };
    window.addEventListener('app-toast', handleToast);
    return () => window.removeEventListener('app-toast', handleToast);
  }, []);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'users'), (snap) => setUsers(snap.docs.map(d => ({ ...d.data(), _docId: d.id }))));
    const unsubDepts = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'departments'), (snap) => {
      const docs = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      const uniqueNames = new Set();
      const duplicates: any[] = [];
      docs.forEach(d => {
        const name = (d.name || '').trim();
        if (uniqueNames.has(name.toLowerCase())) duplicates.push(d);
        else uniqueNames.add(name.toLowerCase());
      });
      
      if (duplicates.length > 0 && auth.currentUser) {
        duplicates.forEach(async (d) => {
          try {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'departments', d.id));
          } catch (e) { console.error("Failed to delete duplicate dept:", e); }
        });
      }
      
      const uniqueDocs = docs.filter(d => !duplicates.includes(d));
      setDeptDocs(uniqueDocs); 
      setDepartments(uniqueDocs.map((d: any) => d.name));
    });
    const unsubVacs = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'vacations'), (snap) => setVacations(snap.docs.map(d => ({ ...d.data(), _docId: d.id }))));
    const unsubHolidays = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'holidays'), (snap) => { if (snap.exists()) setHolidays(snap.data()); });
    const unsubAuth = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'auth'), (snap) => { if (snap.exists()) setAuthSettings(snap.data()); });
    const unsubEmailTpls = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'email_templates'), (snap) => { if (snap.exists()) setEmailTemplates(snap.data()); });
    const unsubAudit = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'audit_logs'), (snap) => setAuditLogs(snap.docs.map(d => ({ ...d.data(), _docId: d.id })).sort((a: any, b: any) => b.timestamp - a.timestamp)));
    
    const unsubFirebase = onAuthStateChanged(auth, (user) => {
        setIsReady(true);
    });

    return () => { unsubUsers(); unsubDepts(); unsubVacs(); unsubHolidays(); unsubAuth(); unsubEmailTpls(); unsubAudit(); unsubFirebase(); };
  }, []);

  useEffect(() => {
    if (!isReady || vacations.length === 0 || users.length === 0) return;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    vacations.forEach(async (v: any) => {
      if (v.status === 'approved' && !v.notified7Days) {
        const startDate = new Date(v.startDate);
        const diffTime = startDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 7) {
          const user = users.find((u: any) => u.id === v.userId);
          const manager = users.find((u: any) => u.department === user?.department && (u.role === 'manager' || u.role === 'ceo'));
          
          if (user && manager && manager.email) {
            const templateParams = {
              to_email: manager.email,
              to_name: manager.name,
              cc_emails: emailTemplates?.reminderCc || '',
              subject: emailTemplates?.reminderSubject || 'Скоро отпуск у сотрудника',
              message: (emailTemplates?.reminderMessage || 'Через 7 дней у сотрудника {{name}} начнется отпуск с {{startDate}} по {{endDate}}.')
                .replace('{{name}}', user.name)
                .replace('{{startDate}}', new Date(v.startDate).toLocaleDateString())
                .replace('{{endDate}}', new Date(v.endDate).toLocaleDateString())
            };

            emailjs.send(
              'service_0rphyiq', 
              'template_ledfu5o', 
              templateParams, 
              '5Q8hmgz0oZzkUr87Z'
            ).then(() => {
              console.log('7-day reminder sent to manager');
            }).catch((e) => {
              console.error('Failed to send 7-day reminder', e);
              window.dispatchEvent(new CustomEvent('app-toast', { 
                detail: { 
                  title: 'Ошибка отправки письма', 
                  message: `EmailJS: ${e.text || e.message || 'Проверьте Service ID и настройки.'}`, 
                  type: 'error' 
                } 
              }));
            });
            
            if (v._docId && auth.currentUser) {
              try {
                await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'vacations', v._docId), { ...v, notified7Days: true });
              } catch (e) { console.error("Failed to update vacation notification status:", e); }
            }
          }
        }
      }
    });
  }, [vacations, users, isReady]);

  useEffect(() => {
    if (auth.currentUser && users.length > 0 && !currentUser) {
        const matchedUser = users.find(u => u.email === auth.currentUser?.email);
        if (matchedUser) setCurrentUser(matchedUser);
    }
  }, [users, currentUser]);

  const logAction = async (type: string, details: string, targetId?: string, previousData?: any, newData?: any) => {
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'audit_logs'), {
        timestamp: Date.now(), userId: currentUser?.id || 'system', userName: currentUser?.name || 'System',
        type, details, targetId: targetId || null, previousData: previousData || null, newData: newData || null, reverted: false
      });
    } catch (e) { console.error("Audit log error:", e); }
  };

  const updateEmailTemplates = async (templates: any) => {
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'email_templates'), templates);
  };

  const contextValue = {
    currentUser, setCurrentUser, users, departments, vacations, holidays, authSettings, emailTemplates, auditLogs, logAction, deptDocs, updateEmailTemplates
  };

  if (!isReady) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <AppContext.Provider value={contextValue}>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100 selection:text-blue-900">
        {currentUser && <Header />}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!currentUser ? (
            <LoginScreen />
          ) : (
            <div className="space-y-6">
              {currentUser.role === 'admin' && <AdminDashboard />}
              {(currentUser.role === 'manager' || currentUser.role === 'ceo') && <ManagerDashboard />}
              {currentUser.role === 'employee' && <EmployeeDashboard />}
            </div>
          )}
        </main>
        {toast && <Toast title={toast.title} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </AppContext.Provider>
  );
}

export default App;
