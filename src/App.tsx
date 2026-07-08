import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  CalendarRange, 
  MoreHorizontal, 
  Plus, 
  Menu, 
  Bell, 
  User, 
  Settings, 
  Wrench, 
  CheckSquare, 
  Trash2, 
  HelpCircle,
  Clock,
  Briefcase,
  Sliders,
  LogOut,
  SlidersHorizontal,
  ChevronRight,
  UserCheck,
  Check,
  X as CloseIcon,
  Mail,
  Phone,
  Building2,
  Edit3,
  Sparkles
} from 'lucide-react';

import { Incident, PreventiveTask, Activity, PriorityType, StatusType, UserProfile } from './types';
import { INITIAL_INCIDENTS, INITIAL_PREVENTIVE_TASKS, INITIAL_ACTIVITIES } from './data';
import { secureSave, secureLoad } from './utils/security';

// Import views
import DashboardView from './components/DashboardView';
import IncidentsView from './components/IncidentsView';
import PreventiveView from './components/PreventiveView';
import NewIncidentView from './components/NewIncidentView';
import NavigationMenuDrawer from './components/NavigationMenuDrawer';
import { GateScreen, PendingApprovalScreen } from './components/GateScreen';
import SoporteView from './components/SoporteView';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // User Profile and Menu states
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    return secureLoad<UserProfile | null>('user_profile_data', null);
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Profile editing states inside the "Más" profile section
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDocument, setEditDocument] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editOffice, setEditOffice] = useState<'Misiones' | 'Kinectika' | 'Jóvenes' | 'Administración' | 'Mantenimiento'>('Misiones');

  // Pending Workers for Approval list
  const [pendingWorkers, setPendingWorkers] = useState<UserProfile[]>(() => {
    return secureLoad<UserProfile[]>('pending_workers_list', [
      {
        name: 'Roberto Gómez',
        document: '38.452.193',
        phone: '3764-981244',
        email: 'roberto.gomez@oficina.com',
        office: 'Misiones',
        isApproved: false
      },
      {
        name: 'Lucía Benítez',
        document: '40.129.852',
        phone: '3764-152288',
        email: 'lucia.benitez@oficina.com',
        office: 'Kinectika',
        isApproved: false
      }
    ]);
  });

  // Approved Workers list
  const [approvedWorkers, setApprovedWorkers] = useState<UserProfile[]>(() => {
    return secureLoad<UserProfile[]>('approved_workers_list', [
      {
        name: 'Carlos Martínez',
        document: '35.912.045',
        phone: '3764-551122',
        email: 'carlos.martinez@oficina.com',
        office: 'Jóvenes',
        isApproved: true
      }
    ]);
  });

  // Admin staff account management states
  const [editingWorker, setEditingWorker] = useState<UserProfile | null>(null);
  const [deleteConfirmWorker, setDeleteConfirmWorker] = useState<UserProfile | null>(null);
  const [editWorkerName, setEditWorkerName] = useState('');
  const [editWorkerDocument, setEditWorkerDocument] = useState('');
  const [editWorkerPhone, setEditWorkerPhone] = useState('');
  const [editWorkerOffice, setEditWorkerOffice] = useState<UserProfile['office']>('Misiones');
  const [editWorkerIsAdmin, setEditWorkerIsAdmin] = useState(false);
  
  // Incidents state with localStorage fallback
  const [incidents, setIncidents] = useState<Incident[]>(() => {
    return secureLoad<Incident[]>('incident_records_v4', INITIAL_INCIDENTS);
  });

  const [showNotifications, setShowNotifications] = useState(false);
  const [highlightedIncidentId, setHighlightedIncidentId] = useState<string | null>(null);

  // Preventive tasks state with localStorage fallback
  const [preventiveTasks, setPreventiveTasks] = useState<PreventiveTask[]>(() => {
    return secureLoad<PreventiveTask[]>('preventive_routines', INITIAL_PREVENTIVE_TASKS);
  });

  // Activities state with localStorage fallback
  const [activities, setActivities] = useState<Activity[]>(() => {
    return secureLoad<Activity[]>('recent_activity_log_v4', INITIAL_ACTIVITIES);
  });

  // Synchronize state changes with localStorage
  useEffect(() => {
    secureSave('incident_records_v4', incidents);
  }, [incidents]);

  useEffect(() => {
    secureSave('preventive_routines', preventiveTasks);
  }, [preventiveTasks]);

  useEffect(() => {
    secureSave('recent_activity_log_v4', activities);
  }, [activities]);

  useEffect(() => {
    secureSave('pending_workers_list', pendingWorkers);
  }, [pendingWorkers]);

  useEffect(() => {
    secureSave('approved_workers_list', approvedWorkers);
  }, [approvedWorkers]);

  useEffect(() => {
    if (userProfile) {
      secureSave('user_profile_data', userProfile);
    } else {
      localStorage.removeItem('user_profile_data');
    }
  }, [userProfile]);

  useEffect(() => {
    if (userProfile && !userProfile.isAdmin && activeTab === 'preventivo') {
      setActiveTab('dashboard');
    }
  }, [userProfile, activeTab]);

  // Database maintenance / optimization: keeping important data and removing unused stale data
  const runDatabaseMaintenance = () => {
    // 1. Keep all pending or in-progress incidents, and all high/critical priority incidents.
    // 2. For completed incidents of low/medium priority, if they are older than 14 days or we have more than 5, keep only the 5 most recent ones to save storage.
    // 3. Keep only the 15 most recent activities in the log.
    // This maintains database performance and cleans up unused/stale items automatically!
    
    setIncidents(prevIncidents => {
      const pendingOrInProcess = prevIncidents.filter(i => i.status !== 'Completada');
      const highOrCritical = prevIncidents.filter(i => i.status === 'Completada' && (i.priority === 'Alta' || i.priority === 'Crítica'));
      const completedLowMedium = prevIncidents.filter(i => i.status === 'Completada' && i.priority !== 'Alta' && i.priority !== 'Crítica');
      
      // Sort completed low/medium by date, keep only the 5 most recent ones
      const sortedCompleted = [...completedLowMedium].sort((a, b) => {
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });
      const keptCompleted = sortedCompleted.slice(0, 5);
      const optimizedIncidents = [...pendingOrInProcess, ...highOrCritical, ...keptCompleted];
      
      return optimizedIncidents;
    });

    setActivities(prevActivities => {
      // Keep only the 15 most recent activities
      if (prevActivities.length > 15) {
        return prevActivities.slice(0, 15);
      }
      return prevActivities;
    });
  };

  useEffect(() => {
    runDatabaseMaintenance();
  }, []);

  const handleAddActivityLog = (title: string, description: string, statusText: string) => {
    const newAct: Activity = {
      id: `ACT-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: 'status_update',
      title,
      description,
      timestamp: 'Ahora mismo',
      statusText,
      category: 'General'
    };
    setActivities(prev => [newAct, ...prev]);
  };

  const handleApproveWorker = (workerEmail: string) => {
    const workerToApprove = pendingWorkers.find(w => w.email.toLowerCase() === workerEmail.toLowerCase());
    if (!workerToApprove) return;

    const approvedWorker = { ...workerToApprove, isApproved: true };
    setApprovedWorkers(prev => [...prev, approvedWorker]);
    setPendingWorkers(prev => prev.filter(w => w.email.toLowerCase() !== workerEmail.toLowerCase()));

    if (userProfile && userProfile.email.toLowerCase() === workerEmail.toLowerCase()) {
      setUserProfile(approvedWorker);
    }

    handleAddActivityLog(
      'Registro Aprobado',
      `El administrador aprobó la solicitud de registro de ${workerToApprove.name} para la oficina ${workerToApprove.office}.`,
      'Aprobado'
    );
  };

  const handleRejectWorker = (workerEmail: string) => {
    const workerToReject = pendingWorkers.find(w => w.email.toLowerCase() === workerEmail.toLowerCase());
    if (!workerToReject) return;

    setPendingWorkers(prev => prev.filter(w => w.email.toLowerCase() !== workerEmail.toLowerCase()));

    if (userProfile && userProfile.email.toLowerCase() === workerEmail.toLowerCase()) {
      setUserProfile(null);
    }

    handleAddActivityLog(
      'Registro Rechazado',
      `Se rechazó la solicitud de registro de ${workerToReject.name}.`,
      'Rechazado'
    );
  };

  const handleUpdateWorker = (email: string, updatedData: Partial<UserProfile>) => {
    setApprovedWorkers(prev => prev.map(w => w.email.toLowerCase() === email.toLowerCase() ? { ...w, ...updatedData } : w));
    setPendingWorkers(prev => prev.map(w => w.email.toLowerCase() === email.toLowerCase() ? { ...w, ...updatedData } : w));

    if (userProfile && userProfile.email.toLowerCase() === email.toLowerCase()) {
      setUserProfile(prev => prev ? { ...prev, ...updatedData } : null);
    }

    handleAddActivityLog(
      'Usuario Modificado',
      `Se actualizaron los datos del usuario ${updatedData.name || email}.`,
      'Modificación'
    );
  };

  const handleDeleteWorker = (email: string) => {
    const foundApproved = approvedWorkers.find(w => w.email.toLowerCase() === email.toLowerCase());
    const foundPending = pendingWorkers.find(w => w.email.toLowerCase() === email.toLowerCase());
    const name = foundApproved?.name || foundPending?.name || email;

    setApprovedWorkers(prev => prev.filter(w => w.email.toLowerCase() !== email.toLowerCase()));
    setPendingWorkers(prev => prev.filter(w => w.email.toLowerCase() !== email.toLowerCase()));

    if (userProfile && userProfile.email.toLowerCase() === email.toLowerCase()) {
      setUserProfile(null);
    }

    handleAddActivityLog(
      'Usuario Eliminado',
      `Se eliminó la cuenta de ${name} (${email}).`,
      'Eliminación'
    );
  };

  const handleStartEditWorker = (worker: UserProfile) => {
    setEditingWorker(worker);
    setEditWorkerName(worker.name);
    setEditWorkerDocument(worker.document);
    setEditWorkerPhone(worker.phone);
    setEditWorkerOffice(worker.office);
    setEditWorkerIsAdmin(!!worker.isAdmin);
  };

  const handleSaveWorkerEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorker) return;
    if (!editWorkerName.trim() || !editWorkerDocument.trim() || !editWorkerPhone.trim()) {
      alert('Por favor complete todos los campos.');
      return;
    }

    const updatedData: Partial<UserProfile> = {
      name: editWorkerName,
      document: editWorkerDocument,
      phone: editWorkerPhone,
      office: editWorkerOffice,
      isAdmin: editWorkerIsAdmin,
    };

    handleUpdateWorker(editingWorker.email, updatedData);
    setEditingWorker(null);
  };

  const handleStartEditing = () => {
    if (userProfile) {
      setEditName(userProfile.name);
      setEditDocument(userProfile.document);
      setEditPhone(userProfile.phone);
      setEditEmail(userProfile.email);
      setEditOffice(userProfile.office);
      setIsEditingProfile(true);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    if (!editName || !editDocument || !editPhone || !editEmail) {
      alert('Por favor complete todos los campos requeridos.');
      return;
    }

    const updated: UserProfile = {
      ...userProfile,
      name: editName,
      document: editDocument,
      phone: editPhone,
      email: editEmail,
      office: editOffice,
    };

    setUserProfile(updated);
    localStorage.setItem('user_profile_data', JSON.stringify(updated));

    setApprovedWorkers(prev => prev.map(w => w.email.toLowerCase() === userProfile.email.toLowerCase() ? updated : w));
    setPendingWorkers(prev => prev.map(w => w.email.toLowerCase() === userProfile.email.toLowerCase() ? updated : w));

    setIsEditingProfile(false);
    handleAddActivityLog(
      'Perfil Actualizado',
      `Los datos de perfil han sido actualizados con éxito.`,
      'Perfil'
    );
  };

  // Auth portal redirects if no profile or not approved
  if (!userProfile) {
    return (
      <GateScreen 
        approvedWorkers={approvedWorkers}
        pendingWorkers={pendingWorkers}
        onLogin={(profile) => {
          setUserProfile(profile);
          if (profile.isAdmin) {
            setApprovedWorkers(prev => {
              if (prev.some(w => w.email.toLowerCase() === profile.email.toLowerCase())) {
                return prev;
              }
              return [profile, ...prev];
            });
          }
          handleAddActivityLog(
            'Sesión Iniciada',
            `El usuario ${profile.name} ingresó al sistema de forma exitosa.`,
            'Inicio'
          );
        }}
        onRegisterWorker={(newWorker) => {
          setPendingWorkers(prev => [newWorker, ...prev]);
          setUserProfile(newWorker);
          
          // Add alert to activity log
          const newAct: Activity = {
            id: `ACT-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            type: 'new_incident',
            title: `Registro pendiente: ${newWorker.name}`,
            description: `Sede: ${newWorker.office}. Requiere aprobación de administración para activar perfil.`,
            timestamp: 'Ahora mismo',
            statusText: 'Pendiente',
            category: 'Registro'
          };
          setActivities(prev => [newAct, ...prev]);
        }}
        onRegisterAdmin={(newAdmin) => {
          setUserProfile(newAdmin);
          setApprovedWorkers(prev => [newAdmin, ...prev]);
          handleAddActivityLog(
            'Admin Registrado',
            `El administrador ${newAdmin.name} se registró e ingresó de forma exitosa.`,
            'Admin'
          );
        }}
      />
    );
  }

  if (userProfile && userProfile.isApproved === false) {
    return (
      <PendingApprovalScreen 
        profile={userProfile}
        onCancel={() => {
          setUserProfile(null);
        }}
      />
    );
  }

  // Callback: Add newly reported incident
  const handleAddIncident = (newIncData: Omit<Incident, 'id' | 'timestamp' | 'createdAt' | 'completedAt'>) => {
    // Generate sequential ID
    const baseNum = 1024;
    const currentMaxId = incidents.reduce((max, inc) => {
      const num = parseInt(inc.id.replace('INC-', ''), 10);
      return isNaN(num) ? max : Math.max(max, num);
    }, baseNum);
    const nextId = `INC-${currentMaxId + 1}`;

    const now = new Date();
    const Y = now.getFullYear();
    const M = String(now.getMonth() + 1).padStart(2, '0');
    const D = String(now.getDate()).padStart(2, '0');
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const formattedDate = `${Y}-${M}-${D} ${h}:${m}`;

    const newIncident: Incident = {
      ...newIncData,
      id: nextId,
      timestamp: 'Hace 1 min',
      createdAt: formattedDate
    };

    setIncidents(prev => [newIncident, ...prev]);

    // Create corresponding Activity feed item
    const newAct: Activity = {
      id: `ACT-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: 'new_incident',
      title: `Nueva incidencia: ${newIncident.title}`,
      description: `${newIncident.floor} - ${newIncident.sector}. Prioridad: ${newIncident.priority}.`,
      timestamp: 'Hace 1 min',
      statusText: 'Urgente',
      category: newIncident.category
    };

    setActivities(prev => [newAct, ...prev]);
    setActiveTab('incidencias'); // Redirect to Incidencias list
  };

  // Callback: Update Incident status
  const handleUpdateIncidentStatus = (id: string, newStatus: StatusType, cost?: number, actionsTaken?: string) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === id) {
        let completedAt = inc.completedAt;
        // Create activity log if newly completed
        if (newStatus === 'Completada' && inc.status !== 'Completada') {
          const now = new Date();
          const Y = now.getFullYear();
          const M = String(now.getMonth() + 1).padStart(2, '0');
          const D = String(now.getDate()).padStart(2, '0');
          const h = String(now.getHours()).padStart(2, '0');
          const m = String(now.getMinutes()).padStart(2, '0');
          completedAt = `${Y}-${M}-${D} ${h}:${m}`;

          const resolveAct: Activity = {
            id: `ACT-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            type: 'task_completed',
            title: `Resuelta: ${inc.title}`,
            description: `${inc.floor} - ${inc.sector}. Corregida satisfactoriamente. ${cost ? `Costo: $${cost}` : ''}`,
            timestamp: 'Ahora mismo',
            statusText: 'Completada',
            category: inc.category
          };
          setActivities(act => [resolveAct, ...act]);
        } else if (newStatus !== 'Completada') {
          // If status moved away from Completed, clear completedAt
          completedAt = undefined;
        }

        // Create status update log if not transitioned to completed (to avoid duplication of activity item)
        if (!(newStatus === 'Completada' && inc.status !== 'Completada')) {
          const updateAct: Activity = {
            id: `ACT-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            type: 'status_update',
            title: `Actualización de Estado`,
            description: `Incidencia ${inc.id} (${inc.title}) cambió a '${newStatus}'.`,
            timestamp: 'Ahora mismo',
            statusText: newStatus,
            category: inc.category
          };
          setActivities(act => [updateAct, ...act]);
        }

        return { 
          ...inc, 
          status: newStatus, 
          completedAt,
          cost: cost !== undefined ? cost : inc.cost,
          actionsTaken: actionsTaken !== undefined ? actionsTaken : inc.actionsTaken
        };
      }
      return inc;
    }));
  };

  // Callback: Update Incident priority
  const handleUpdateIncidentPriority = (id: string, newPriority: PriorityType) => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === id) {
        return { ...inc, priority: newPriority };
      }
      return inc;
    }));
  };

  // Callback: Delete incident
  const handleDeleteIncident = (id: string) => {
    setIncidents(prev => prev.filter(inc => inc.id !== id));
  };

  // Callback: Complete a scheduled preventive task
  const handleCompleteTask = (id: string) => {
    setPreventiveTasks(prev => prev.map(task => {
      if (task.id === id) {
        // Create activity feed entry
        const taskAct: Activity = {
          id: `ACT-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          type: 'task_completed',
          title: `Rutina Hecha: ${task.title}`,
          description: `Mantenimiento preventivo en ${task.floor} finalizado por ${task.assigneeName}.`,
          timestamp: 'Ahora mismo',
          statusText: 'Completado',
          category: task.category
        };
        setActivities(act => [taskAct, ...act]);
        return { ...task, status: 'Completada' };
      }
      return task;
    }));
  };

  // Callback: Schedule new preventive task
  const handleAddPreventiveTask = (newTaskData: Omit<PreventiveTask, 'id'>) => {
    const nextId = `PM-${100 + preventiveTasks.length + 1}`;
    const newTask: PreventiveTask = {
      ...newTaskData,
      id: nextId
    };

    setPreventiveTasks(prev => [...prev, newTask]);

    // Log scheduling activity
    const schedAct: Activity = {
      id: `ACT-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type: 'status_update',
      title: `Programado: ${newTask.title}`,
      description: `Nueva rutina programada para el ${newTask.date} en ${newTask.floor}.`,
      timestamp: 'Ahora mismo',
      statusText: 'Programado',
      category: newTask.category
    };
    setActivities(act => [schedAct, ...act]);
  };

  // Reset database back to seed values
  const handleResetDatabase = () => {
    if (confirm('¿Desea restaurar los datos de simulación por defecto? Esto borrará sus cambios locales.')) {
      localStorage.removeItem('incident_records');
      localStorage.removeItem('preventive_routines');
      localStorage.removeItem('recent_activity_log');
      setIncidents(INITIAL_INCIDENTS);
      setPreventiveTasks(INITIAL_PREVENTIVE_TASKS);
      setActivities(INITIAL_ACTIVITIES);
      setActiveTab('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col font-sans">
      
      {/* Top Application Header Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-surface-container-lowest border-b border-outline-variant shadow-xs">
        <div className="flex items-center gap-4">
          <div 
            onClick={() => setIsMenuOpen(true)}
            className="p-2 rounded-full bg-surface-container text-primary hover:bg-surface-container-high transition-colors md:hidden cursor-pointer"
          >
            <Menu size={18} />
          </div>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary text-white flex items-center justify-center">
              <Wrench size={16} />
            </div>
            <h1 className="text-sm md:text-base font-extrabold tracking-tight text-primary">
              Mantenimiento - Cita con la Vida
            </h1>
          </div>
        </div>

        {/* User context info and notifications */}
        <div className="flex items-center gap-4">
          <div 
            onClick={() => setActiveTab('mas')}
            className="hidden md:flex items-center gap-1.5 bg-surface-container text-primary hover:bg-surface-container-high px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all border border-primary/10 hover:border-primary/25"
          >
            <span className={`w-2 h-2 rounded-full animate-pulse ${userProfile ? 'bg-green-600' : 'bg-amber-500'}`}></span>
            <span>{userProfile ? userProfile.email : 'Iniciar Sesión / Registrarse'}</span>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <div 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              id="notification-bell-btn"
            >
              <Bell size={18} />
              {incidents.filter(i => i.status === 'Pendiente').length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse"></span>
              )}
            </div>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowNotifications(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="fixed md:absolute top-16 md:top-auto right-4 left-4 md:left-auto md:right-0 mt-2 md:w-80 max-h-[80vh] md:max-h-96 overflow-y-auto bg-white border border-outline-variant rounded-xl shadow-lg z-50 py-3 text-on-surface"
                    id="notifications-dropdown-menu"
                  >
                    <div className="px-4 pb-2.5 border-b border-surface-container flex justify-between items-center">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">Incidencias Recientes</span>
                      <span className="text-[10px] bg-primary-container text-primary px-1.5 py-0.5 rounded-full font-bold">
                        {incidents.length} total
                      </span>
                    </div>

                    <div className="divide-y divide-surface-container overflow-y-auto max-h-[300px]">
                      {(() => {
                        const priorityWeight = {
                          'Crítica': 4,
                          'Alta': 3,
                          'Media': 2,
                          'Baja': 1
                        };
                        const sortedNotifs = [...incidents].sort((a, b) => {
                          const wA = priorityWeight[a.priority] || 1;
                          const wB = priorityWeight[b.priority] || 1;
                          if (wB !== wA) {
                            return wB - wA;
                          }
                          return (b.createdAt || '').localeCompare(a.createdAt || '');
                        });

                        if (sortedNotifs.length === 0) {
                          return (
                            <div className="p-4 text-center text-xs text-on-surface-variant">
                              No hay incidencias registradas.
                            </div>
                          );
                        }

                        return sortedNotifs.map((inc) => {
                          const isPending = inc.status === 'Pendiente';
                          const isEnProceso = inc.status === 'En Proceso';
                          const priorityColor = 
                            inc.priority === 'Crítica' ? 'bg-red-100 text-red-800 border-red-200' :
                            inc.priority === 'Alta' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                            inc.priority === 'Media' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            'bg-slate-100 text-slate-800 border-slate-200';

                          return (
                            <div 
                              key={inc.id}
                              onClick={() => {
                                setActiveTab('incidencias');
                                setHighlightedIncidentId(inc.id);
                                setShowNotifications(false);
                              }}
                              className="p-3 hover:bg-surface-container-low transition-colors cursor-pointer flex gap-3 items-start"
                            >
                              <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${
                                isPending ? 'bg-red-500 animate-pulse' :
                                isEnProceso ? 'bg-amber-500' :
                                'bg-green-500'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1 mb-0.5">
                                  <span className="text-[10px] font-mono font-bold text-on-surface-variant">{inc.id}</span>
                                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${priorityColor}`}>
                                    {inc.priority}
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-on-surface truncate">{inc.title}</p>
                                <p className="text-[10px] text-on-surface-variant truncate">{inc.floor} - {inc.sector}</p>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* User Avatar Portrait */}
          <div 
            onClick={() => setActiveTab('mas')}
            className="w-10 h-10 rounded-full border-2 border-primary/20 overflow-hidden bg-primary-container hover:bg-primary-hover/10 flex items-center justify-center shadow-xs cursor-pointer transition-all active:scale-95"
          >
            {userProfile ? (
              <div className="w-full h-full bg-primary text-white flex items-center justify-center text-xs font-bold uppercase">
                {userProfile.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
            ) : (
              <div className="w-full h-full bg-surface-container text-primary flex items-center justify-center">
                <User size={18} />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Persistent left sidebar on Desktop devices */}
      <aside className="hidden md:flex fixed left-0 top-16 bottom-0 w-[260px] bg-white border-r border-outline-variant flex-col py-6 px-4 justify-between shadow-xs z-30">
        <div className="space-y-6">
          <div className="px-2">
            <button
              onClick={() => setActiveTab('nuevo')}
              className="w-full bg-primary hover:bg-primary-hover text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-bold text-xs transition-colors shadow-sm cursor-pointer"
            >
              <Plus size={16} />
              <span>Reportar Incidencia</span>
            </button>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'dashboard' 
                  ? 'bg-primary-container/10 text-primary border-l-4 border-primary' 
                  : 'text-on-surface-variant hover:bg-surface-container-low border-l-4 border-transparent'
              }`}
            >
              <LayoutDashboard size={16} />
              <span>Inicio</span>
            </button>

            <button
              onClick={() => setActiveTab('incidencias')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'incidencias' 
                  ? 'bg-primary-container/10 text-primary border-l-4 border-primary' 
                  : 'text-on-surface-variant hover:bg-surface-container-low border-l-4 border-transparent'
              }`}
            >
              <AlertTriangle size={16} />
              <span>Incidencias</span>
            </button>

            {userProfile?.isAdmin && (
              <button
                onClick={() => setActiveTab('preventivo')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'preventivo' 
                    ? 'bg-primary-container/10 text-primary border-l-4 border-primary' 
                    : 'text-on-surface-variant hover:bg-surface-container-low border-l-4 border-transparent'
                }`}
              >
                <CalendarRange size={16} />
                <span>Calendario</span>
              </button>
            )}

            {userProfile?.isAdmin && (
              <button
                onClick={() => setActiveTab('aprobaciones')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all cursor-pointer relative ${
                  activeTab === 'aprobaciones' 
                    ? 'bg-primary-container/10 text-primary border-l-4 border-primary' 
                    : 'text-on-surface-variant hover:bg-surface-container-low border-l-4 border-transparent'
                }`}
              >
                <UserCheck size={16} />
                <span>Personal</span>
                {pendingWorkers.length > 0 && (
                  <span className="absolute right-3 px-1.5 py-0.5 bg-red-600 text-white rounded-full text-[9px] font-bold animate-pulse">
                    {pendingWorkers.length}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => setActiveTab('soporte')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'soporte' 
                  ? 'bg-primary-container/10 text-primary border-l-4 border-primary' 
                  : 'text-on-surface-variant hover:bg-surface-container-low border-l-4 border-transparent'
              }`}
            >
              <Sparkles size={16} />
              <span>Eddie (Soporte IA)</span>
            </button>

            <button
              onClick={() => setIsMenuOpen(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold text-on-surface-variant hover:bg-surface-container-low border-l-4 border-transparent transition-all cursor-pointer"
            >
              <Menu size={16} />
              <span>Menú de Opciones</span>
            </button>
          </nav>
        </div>

        {/* Reset utilities at bottom of sidebar */}
        <div className="border-t border-surface-container pt-4 px-2">
          <button
            onClick={handleResetDatabase}
            className="w-full flex items-center justify-between text-[11px] font-bold text-on-surface-variant hover:text-error transition-colors px-2 py-1.5 hover:bg-red-50 rounded-lg cursor-pointer"
          >
            <span>Reiniciar Simulación</span>
            <Trash2 size={12} />
          </button>
        </div>
      </aside>

      {/* Main viewport Container */}
      <main className="flex-1 w-full md:pl-[260px] p-4 md:p-8 pt-20 pb-24 md:pb-8">
        <div className="max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <DashboardView 
                incidents={incidents}
                preventiveTasks={preventiveTasks}
                activities={activities}
                onNavigateToTab={setActiveTab}
                onOpenNewIncident={() => setActiveTab('nuevo')}
                userProfile={userProfile}
              />
            </motion.div>
          )}

          {activeTab === 'incidencias' && (
            <motion.div
              key="incidencias"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <IncidentsView 
                incidents={incidents}
                onUpdateIncidentStatus={handleUpdateIncidentStatus}
                onUpdateIncidentPriority={handleUpdateIncidentPriority}
                onDeleteIncident={handleDeleteIncident}
                onOpenNewIncident={() => setActiveTab('nuevo')}
                userProfile={userProfile}
                highlightedIncidentId={highlightedIncidentId}
                onClearHighlight={() => setHighlightedIncidentId(null)}
              />
            </motion.div>
          )}

          {activeTab === 'preventivo' && (
            <motion.div
              key="preventivo"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <PreventiveView 
                tasks={preventiveTasks}
                onCompleteTask={handleCompleteTask}
                onAddTask={handleAddPreventiveTask}
              />
            </motion.div>
          )}

          {activeTab === 'nuevo' && (
            <motion.div
              key="nuevo"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <NewIncidentView 
                onAddIncident={handleAddIncident}
                onCancel={() => setActiveTab('incidencias')}
              />
            </motion.div>
          )}

          {activeTab === 'aprobaciones' && userProfile?.isAdmin && (
            <motion.div
              key="aprobaciones"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6 animate-fade-in"
            >
              <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
                <div className="border-b border-surface-container pb-4 mb-6">
                  <h3 className="text-lg font-bold text-[#7a172c]">Control de Personal</h3>
                  <p className="text-xs text-on-surface-variant">
                    Como administrador, verifique las solicitudes de registro, apruebe nuevos perfiles, o edite y elimine las cuentas del personal.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Solicitudes de Registro Pendientes</h4>
                  {pendingWorkers.length === 0 ? (
                    <div className="text-center py-8 bg-slate-50 border border-dashed border-outline-variant rounded-2xl">
                      <UserCheck size={36} className="text-outline mx-auto mb-2" />
                      <p className="text-xs font-bold text-on-surface">No hay registros pendientes</p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">Todos los perfiles de los empleados han sido procesados.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pendingWorkers.map((worker, index) => (
                        <div 
                          key={`${worker.email}-${index}`} 
                          className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant flex flex-col justify-between hover:border-primary/20 transition-all relative overflow-hidden shadow-3xs"
                        >
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-sm font-bold text-on-surface">{worker.name}</h4>
                                <p className="text-[10px] text-on-surface-variant font-medium">Sede: <strong className="text-primary">{worker.office}</strong></p>
                              </div>
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[9px] font-bold uppercase">
                                Pendiente
                              </span>
                            </div>

                            <div className="text-[11px] space-y-1 bg-surface-container-low p-2.5 rounded-lg text-on-surface-variant">
                              <p><strong>DNI:</strong> <span className="font-mono">{worker.document}</span></p>
                              <p><strong>Celular:</strong> {worker.phone}</p>
                              <p className="truncate"><strong>Correo:</strong> {worker.email}</p>
                            </div>
                          </div>

                          <div className="flex gap-1.5 mt-4 pt-3 border-t border-outline-variant/30">
                            <button
                              onClick={() => handleRejectWorker(worker.email)}
                              className="px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                            >
                              Rechazar
                            </button>
                            <button
                              onClick={() => handleStartEditWorker(worker)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1"
                            >
                              <Edit3 size={12} />
                              <span>Editar</span>
                            </button>
                            <button
                              onClick={() => handleApproveWorker(worker.email)}
                              className="flex-grow py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                            >
                              Aprobar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Approved users list */}
                <div className="mt-8 pt-6 border-t border-surface-container">
                  <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4">Personal Registrado y Activo</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {approvedWorkers.map((worker, index) => (
                      <div key={`${worker.email}-${index}`} className="flex flex-col justify-between p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/60 hover:border-primary/10 hover:shadow-3xs transition-all">
                        <div className="min-w-0 pb-2.5">
                          <div className="flex justify-between items-start gap-1">
                            <p className="text-xs font-bold text-on-surface truncate">{worker.name}</p>
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[9px] font-bold uppercase shrink-0">
                              Activo
                            </span>
                          </div>
                          <p className="text-[10px] text-on-surface-variant mt-1">Oficina: <strong className="text-primary">{worker.office}</strong> &bull; {worker.isAdmin ? 'Admin' : 'Personal'}</p>
                          <p className="text-[10px] text-on-surface-variant/80 font-mono mt-0.5 truncate">{worker.email}</p>
                          <p className="text-[10px] text-on-surface-variant/80 font-mono">DNI: {worker.document}</p>
                        </div>
                        
                        <div className="flex gap-1.5 pt-2 border-t border-outline-variant/30 mt-auto">
                          <button
                            onClick={() => handleStartEditWorker(worker)}
                            className="flex-1 py-1 px-2 bg-white hover:bg-slate-50 border border-outline-variant/60 text-slate-700 text-[10px] font-bold rounded-md cursor-pointer transition-colors flex items-center justify-center gap-1 shadow-3xs"
                          >
                            <Edit3 size={10} />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => setDeleteConfirmWorker(worker)}
                            className="py-1 px-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold rounded-md cursor-pointer transition-colors flex items-center justify-center border border-red-100"
                            title="Eliminar Cuenta"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Edit Worker Modal Overlay */}
              {editingWorker && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs">
                  <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-outline-variant relative">
                    <button 
                      onClick={() => setEditingWorker(null)}
                      className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-on-surface-variant transition-colors"
                    >
                      <CloseIcon size={18} />
                    </button>

                    <h3 className="text-base font-bold text-on-surface mb-1">Editar Cuenta de Personal</h3>
                    <p className="text-xs text-on-surface-variant mb-6">
                      Modifique los datos de la cuenta de <strong>{editingWorker.email}</strong>.
                    </p>

                    <form onSubmit={handleSaveWorkerEdit} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-on-surface-variant">Nombre Completo</label>
                        <input
                          type="text"
                          required
                          value={editWorkerName}
                          onChange={(e) => setEditWorkerName(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-outline-variant rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-on-surface-variant">Documento de Identidad / DNI</label>
                        <input
                          type="text"
                          required
                          value={editWorkerDocument}
                          onChange={(e) => setEditWorkerDocument(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-outline-variant rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-on-surface-variant">Número de Celular</label>
                        <input
                          type="text"
                          required
                          value={editWorkerPhone}
                          onChange={(e) => setEditWorkerPhone(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-outline-variant rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-on-surface-variant">Sede / Oficina</label>
                        <select
                          value={editWorkerOffice}
                          onChange={(e) => setEditWorkerOffice(e.target.value as any)}
                          className="w-full p-2.5 bg-slate-50 border border-outline-variant rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        >
                          <option value="Misiones">Misiones</option>
                          <option value="Kinectika">Kinectika</option>
                          <option value="Jóvenes">Jóvenes</option>
                          <option value="Administración">Administración</option>
                          <option value="Mantenimiento">Mantenimiento</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2.5 pt-2">
                        <input
                          type="checkbox"
                          id="editWorkerIsAdmin"
                          checked={editWorkerIsAdmin}
                          onChange={(e) => setEditWorkerIsAdmin(e.target.checked)}
                          className="w-4 h-4 text-primary border-outline-variant rounded-xs focus:ring-primary/20"
                        />
                        <label htmlFor="editWorkerIsAdmin" className="text-xs font-bold text-on-surface select-none">
                          Otorgar privilegios de Administrador
                        </label>
                      </div>

                      <div className="flex gap-2.5 pt-4">
                        <button
                          type="button"
                          onClick={() => setEditingWorker(null)}
                          className="flex-grow py-2.5 border border-outline-variant hover:bg-slate-50 text-on-surface-variant text-xs font-bold rounded-xl transition-all"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="flex-grow py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                        >
                          Guardar Cambios
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Delete Worker Confirmation Modal Overlay */}
              {deleteConfirmWorker && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-xs">
                  <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-red-100 relative text-center">
                    <div className="mx-auto w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center border border-red-100 mb-4 animate-pulse">
                      <Trash2 size={24} />
                    </div>

                    <h3 className="text-base font-bold text-on-surface mb-1">¿Eliminar Cuenta de Personal?</h3>
                    <p className="text-xs text-on-surface-variant mb-6">
                      ¿Está seguro de eliminar de forma permanente la cuenta de <strong>{deleteConfirmWorker.name}</strong> ({deleteConfirmWorker.email})? Esta acción no se puede deshacer.
                    </p>

                    <div className="flex gap-2.5">
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmWorker(null)}
                        className="flex-1 py-2.5 border border-outline-variant hover:bg-slate-50 text-on-surface-variant text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleDeleteWorker(deleteConfirmWorker.email);
                          setDeleteConfirmWorker(null);
                        }}
                        className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                      >
                        Eliminar Cuenta
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'soporte' && (
            <motion.div
              key="soporte"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <SoporteView incidents={incidents} userProfile={userProfile} />
            </motion.div>
          )}

          {activeTab === 'mas' && (
            <motion.div
              key="mas"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
                
                {isEditingProfile ? (
                  /* PROFILE EDIT MODE FOR BOTH ADMIN AND STAFF */
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <div className="border-b border-surface-container pb-4">
                      <h3 className="text-base font-bold text-on-surface">Editar mis Datos de Perfil</h3>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Actualice su información personal registrada en el sistema.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-on-surface-variant">Nombre Completo</label>
                        <input
                          type="text"
                          required
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-outline-variant rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-on-surface-variant">Documento de Identidad / DNI</label>
                        <input
                          type="text"
                          required
                          value={editDocument}
                          onChange={(e) => setEditDocument(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-outline-variant rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-on-surface-variant">Número de Celular</label>
                        <input
                          type="text"
                          required
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-outline-variant rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-on-surface-variant">Correo Electrónico</label>
                        <input
                          type="email"
                          required
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-outline-variant rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                      </div>

                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-on-surface-variant">Oficina de Trabajo / Sede</label>
                        <select
                          value={editOffice}
                          onChange={(e) => setEditOffice(e.target.value as any)}
                          className="w-full p-2.5 bg-slate-50 border border-outline-variant rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        >
                          <option value="Misiones">Misiones</option>
                          <option value="Kinectika">Kinectika</option>
                          <option value="Jóvenes">Jóvenes</option>
                          <option value="Administración">Administración</option>
                          <option value="Mantenimiento">Mantenimiento</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2.5 pt-4 border-t border-surface-container">
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="px-4 py-2 border border-outline-variant hover:bg-slate-50 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
                      >
                        <Check size={14} />
                        <span>Guardar Perfil</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  /* READ-ONLY PROFILE DETAIL MODE */
                  <>
                    {/* Header profile info dynamic based on registered userProfile */}
                    <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4 pb-6 border-b border-surface-container">
                      <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                        <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold uppercase shadow-sm border-2 border-primary/20 shrink-0">
                          {userProfile?.name ? userProfile.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'MM'}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-on-surface">{userProfile?.name}</h3>
                          <p className="text-xs text-on-surface-variant font-medium">
                            {userProfile?.isAdmin 
                              ? 'Director General de Mantenimiento / Administrador' 
                              : 'Personal de Oficina Registrado'}
                          </p>
                          <p className="text-xs font-mono text-primary font-bold mt-1 bg-primary/10 px-2.5 py-0.5 rounded-full inline-block">
                            {userProfile?.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleStartEditing}
                          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
                        >
                          <Edit3 size={14} />
                          <span>Editar Perfil</span>
                        </button>
                        <button
                          onClick={() => {
                            setUserProfile(null);
                            localStorage.removeItem('user_profile_data');
                            handleAddActivityLog('Sesión Cerrada', 'El usuario cerró sesión en el aplicativo.', 'Cerrar');
                          }}
                          className="px-4 py-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
                        >
                          <LogOut size={14} />
                          <span>Cerrar Sesión</span>
                        </button>
                      </div>
                    </div>

                    {!userProfile?.isAdmin ? (
                      /* RENDER FOR OFFICE STAFF: PROFILE AND PERSONAL DATA */
                      <div className="pt-6">
                        <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4">Información de Registro</h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 border border-outline-variant/60 rounded-xl hover:shadow-2xs transition-all">
                            <div className="p-2.5 bg-white rounded-lg border border-outline-variant text-primary shrink-0">
                              <User size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Nombre Completo</p>
                              <p className="text-xs font-bold text-on-surface mt-0.5 truncate">{userProfile?.name}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 border border-outline-variant/60 rounded-xl hover:shadow-2xs transition-all">
                            <div className="p-2.5 bg-white rounded-lg border border-outline-variant text-primary shrink-0">
                              <Mail size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Correo de Contacto</p>
                              <p className="text-xs font-mono font-bold text-on-surface mt-0.5 truncate">{userProfile?.email}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 border border-outline-variant/60 rounded-xl hover:shadow-2xs transition-all">
                            <div className="p-2.5 bg-white rounded-lg border border-outline-variant text-primary shrink-0">
                              <Building2 size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Sede / Oficina</p>
                              <p className="text-xs font-bold text-on-surface mt-0.5 truncate">{userProfile?.office}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 border border-outline-variant/60 rounded-xl hover:shadow-2xs transition-all">
                            <div className="p-2.5 bg-white rounded-lg border border-outline-variant text-primary shrink-0">
                              <Phone size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Número de Celular</p>
                              <p className="text-xs font-mono font-bold text-on-surface mt-0.5 truncate">{userProfile?.phone}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 border border-outline-variant/60 rounded-xl hover:shadow-2xs transition-all">
                            <div className="p-2.5 bg-white rounded-lg border border-outline-variant text-primary shrink-0">
                              <Sliders size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Documento de Identidad / DNI</p>
                              <p className="text-xs font-mono font-bold text-on-surface mt-0.5 truncate">{userProfile?.document}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 border border-outline-variant/60 rounded-xl hover:shadow-2xs transition-all">
                            <div className="p-2.5 bg-white rounded-lg border border-outline-variant text-green-600 shrink-0">
                              <UserCheck size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-bold text-outline uppercase tracking-wider">Estado de Aprobación</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <p className="text-xs font-bold text-green-700">Aprobado y Activo</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* RENDER FOR ADMINISTRATORS: PREFERENCES, SPECIALISTS & ACTIONS */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                        {/* System Parameters toggles */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-primary font-bold text-sm">
                            <Sliders size={18} />
                            <span>Preferencias del Sistema</span>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg border border-outline-variant">
                              <div>
                                <p className="text-xs font-bold text-on-surface">Notificaciones por Correo</p>
                                <p className="text-[10px] text-on-surface-variant mt-0.5">Alertas automáticas en reportes críticos.</p>
                              </div>
                              <input type="checkbox" defaultChecked className="h-4 w-4 text-primary focus:ring-primary rounded" />
                            </div>

                            <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg border border-outline-variant">
                              <div>
                                <p className="text-xs font-bold text-on-surface">Sonido de Alerta de Prioridad</p>
                                <p className="text-[10px] text-on-surface-variant mt-0.5">Emitir pitido en cambio de estado urgente.</p>
                              </div>
                              <input type="checkbox" className="h-4 w-4 text-primary focus:ring-primary rounded" />
                            </div>

                            <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg border border-outline-variant">
                              <div>
                                <p className="text-xs font-bold text-on-surface">Auto-Asignación Inteligente</p>
                                <p className="text-[10px] text-on-surface-variant mt-0.5">Inteligencia Artificial asigna técnico por área.</p>
                              </div>
                              <input type="checkbox" defaultChecked className="h-4 w-4 text-primary focus:ring-primary rounded" />
                            </div>
                          </div>
                        </div>

                        {/* Technicians directory */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-primary font-bold text-sm">
                            <Briefcase size={18} />
                            <span>Directorio de Especialistas (Administradores)</span>
                          </div>

                          <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                            {approvedWorkers.filter(w => w.isAdmin).length === 0 ? (
                              <div className="text-center py-8 text-xs text-on-surface-variant bg-surface-container-low rounded-lg border border-dashed border-outline-variant">
                                No hay administradores registrados.
                              </div>
                            ) : (
                              approvedWorkers.filter(w => w.isAdmin).map((t, idx) => {
                                const tInitials = t.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'AD';
                                return (
                                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low transition-colors">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold border border-outline-variant/50 uppercase">
                                        {tInitials}
                                      </div>
                                      <div>
                                        <p className="text-xs font-bold text-on-surface">{t.name}</p>
                                        <p className="text-[10px] text-on-surface-variant">Área: {t.office}</p>
                                      </div>
                                    </div>
                                    <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-green-100 text-green-700">
                                      Activo
                                    </span>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Footer Controls for database and resetting state */}
                    <div className="mt-8 pt-6 border-t border-surface-container flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="text-xs text-on-surface-variant">
                        <span>Versión de Aplicativo: </span>
                        <span className="font-mono font-bold">v1.2.4 (Enterprise)</span>
                      </div>

                      <div className="flex gap-2.5">
                        <button
                          onClick={handleResetDatabase}
                          className="px-4 py-2 border border-red-200 text-error hover:bg-red-50 text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
                        >
                          <Trash2 size={14} />
                          <span>Restaurar Valores por Defecto</span>
                        </button>
                        {userProfile?.isAdmin && (
                          <button
                            onClick={() => alert('Parámetros guardados correctamente en almacenamiento persistente.')}
                            className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                          >
                            Guardar Cambios
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </main>

      {/* Floating Action Button (Mobile Contextual FAB) */}
      {activeTab !== 'nuevo' && (
        <button
          onClick={() => setActiveTab('nuevo')}
          id="mobile-bottom-fab"
          className="md:hidden fixed bottom-20 right-6 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-hover hover:scale-105 active:scale-95 transition-all z-40 group cursor-pointer"
        >
          <Plus size={28} />
        </button>
      )}

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 bg-surface-container-lowest border-t border-outline-variant md:hidden px-2 pb-safe shadow-md">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center w-full h-full transition-all cursor-pointer ${
            activeTab === 'dashboard' ? 'text-primary font-extrabold scale-102' : 'text-on-surface-variant'
          }`}
        >
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-bold mt-1">Inicio</span>
        </button>

        <button 
          onClick={() => setActiveTab('incidencias')}
          className={`flex flex-col items-center justify-center w-full h-full transition-all cursor-pointer ${
            activeTab === 'incidencias' ? 'text-primary font-extrabold scale-102' : 'text-on-surface-variant'
          }`}
        >
          <AlertTriangle size={20} />
          <span className="text-[10px] font-bold mt-1">Incidencias</span>
        </button>

        <button 
          onClick={() => setActiveTab('soporte')}
          className={`flex flex-col items-center justify-center w-full h-full transition-all cursor-pointer ${
            activeTab === 'soporte' ? 'text-primary font-extrabold scale-102' : 'text-on-surface-variant'
          }`}
        >
          <Sparkles size={20} />
          <span className="text-[10px] font-bold mt-1">Eddie</span>
        </button>

        {userProfile?.isAdmin && (
          <button 
            onClick={() => setActiveTab('preventivo')}
            className={`flex flex-col items-center justify-center w-full h-full transition-all cursor-pointer ${
              activeTab === 'preventivo' ? 'text-primary font-extrabold scale-102' : 'text-on-surface-variant'
            }`}
          >
            <CalendarRange size={20} />
            <span className="text-[10px] font-bold mt-1">Calendario</span>
          </button>
        )}
      </nav>

      <NavigationMenuDrawer 
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        userProfile={userProfile}
        onSaveProfile={setUserProfile}
        onNavigateToTab={setActiveTab}
        onAddActivityLog={handleAddActivityLog}
        pendingWorkersCount={pendingWorkers.length}
        activeTab={activeTab}
      />

    </div>
  );
}
