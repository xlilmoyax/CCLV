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
  X as CloseIcon
} from 'lucide-react';

import { Incident, PreventiveTask, Activity, PriorityType, StatusType, UserProfile } from './types';
import { INITIAL_INCIDENTS, INITIAL_PREVENTIVE_TASKS, INITIAL_ACTIVITIES } from './data';

// Import views
import DashboardView from './components/DashboardView';
import IncidentsView from './components/IncidentsView';
import PreventiveView from './components/PreventiveView';
import NewIncidentView from './components/NewIncidentView';
import NavigationMenuDrawer from './components/NavigationMenuDrawer';
import { GateScreen, PendingApprovalScreen } from './components/GateScreen';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // User Profile and Menu states
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('user_profile_data');
    return saved ? JSON.parse(saved) : null;
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Pending Workers for Approval list
  const [pendingWorkers, setPendingWorkers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('pending_workers_list');
    if (saved) return JSON.parse(saved);
    return [
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
    ];
  });

  // Approved Workers list
  const [approvedWorkers, setApprovedWorkers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('approved_workers_list');
    if (saved) return JSON.parse(saved);
    return [
      {
        name: 'Carlos Martínez',
        document: '35.912.045',
        phone: '3764-551122',
        email: 'carlos.martinez@oficina.com',
        office: 'Jóvenes',
        isApproved: true
      }
    ];
  });
  
  // Incidents state with localStorage fallback
  const [incidents, setIncidents] = useState<Incident[]>(() => {
    const saved = localStorage.getItem('incident_records');
    return saved ? JSON.parse(saved) : INITIAL_INCIDENTS;
  });

  // Preventive tasks state with localStorage fallback
  const [preventiveTasks, setPreventiveTasks] = useState<PreventiveTask[]>(() => {
    const saved = localStorage.getItem('preventive_routines');
    return saved ? JSON.parse(saved) : INITIAL_PREVENTIVE_TASKS;
  });

  // Activities state with localStorage fallback
  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem('recent_activity_log');
    return saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
  });

  // Synchronize state changes with localStorage
  useEffect(() => {
    localStorage.setItem('incident_records', JSON.stringify(incidents));
  }, [incidents]);

  useEffect(() => {
    localStorage.setItem('preventive_routines', JSON.stringify(preventiveTasks));
  }, [preventiveTasks]);

  useEffect(() => {
    localStorage.setItem('recent_activity_log', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('pending_workers_list', JSON.stringify(pendingWorkers));
  }, [pendingWorkers]);

  useEffect(() => {
    localStorage.setItem('approved_workers_list', JSON.stringify(approvedWorkers));
  }, [approvedWorkers]);

  useEffect(() => {
    if (userProfile) {
      localStorage.setItem('user_profile_data', JSON.stringify(userProfile));
    } else {
      localStorage.removeItem('user_profile_data');
    }
  }, [userProfile]);

  const handleAddActivityLog = (title: string, description: string, statusText: string) => {
    const newAct: Activity = {
      id: `ACT-${Date.now()}`,
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
            id: `ACT-${Date.now()}`,
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
      id: `ACT-${Date.now()}`,
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
  const handleUpdateIncidentStatus = (id: string, newStatus: StatusType) => {
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
            id: `ACT-${Date.now()}`,
            type: 'task_completed',
            title: `Resuelta: ${inc.title}`,
            description: `${inc.floor} - ${inc.sector}. Corregida satisfactoriamente.`,
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
            id: `ACT-${Date.now()}`,
            type: 'status_update',
            title: `Actualización de Estado`,
            description: `Incidencia ${inc.id} (${inc.title}) cambió a '${newStatus}'.`,
            timestamp: 'Ahora mismo',
            statusText: newStatus,
            category: inc.category
          };
          setActivities(act => [updateAct, ...act]);
        }

        return { ...inc, status: newStatus, completedAt };
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
          id: `ACT-${Date.now()}`,
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
      id: `ACT-${Date.now()}`,
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
            onClick={() => setIsMenuOpen(true)}
            className="hidden md:flex items-center gap-1.5 bg-surface-container text-primary hover:bg-surface-container-high px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all border border-primary/10 hover:border-primary/25"
          >
            <span className={`w-2 h-2 rounded-full animate-pulse ${userProfile ? 'bg-green-600' : 'bg-amber-500'}`}></span>
            <span>{userProfile ? userProfile.email : 'Iniciar Sesión / Registrarse'}</span>
          </div>

          <div className="relative p-2 hover:bg-surface-container rounded-full text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer">
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full animate-ping"></span>
          </div>

          {/* User Avatar Portrait */}
          <div 
            onClick={() => setIsMenuOpen(true)}
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
              <span>Dashboard</span>
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

            <button
              onClick={() => setActiveTab('preventivo')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'preventivo' 
                  ? 'bg-primary-container/10 text-primary border-l-4 border-primary' 
                  : 'text-on-surface-variant hover:bg-surface-container-low border-l-4 border-transparent'
              }`}
            >
              <CalendarRange size={16} />
              <span>Preventivo</span>
            </button>

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
                <span>Aprobaciones</span>
                {pendingWorkers.length > 0 && (
                  <span className="absolute right-3 px-1.5 py-0.5 bg-red-600 text-white rounded-full text-[9px] font-bold animate-pulse">
                    {pendingWorkers.length}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => setActiveTab('mas')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'mas' 
                  ? 'bg-primary-container/10 text-primary border-l-4 border-primary' 
                  : 'text-on-surface-variant hover:bg-surface-container-low border-l-4 border-transparent'
              }`}
            >
              <MoreHorizontal size={16} />
              <span>Más / Ajustes</span>
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
                  <h3 className="text-lg font-bold text-[#7a172c]">Aprobación de Registro de Personal</h3>
                  <p className="text-xs text-on-surface-variant">
                    Como administrador, verifique y apruebe las solicitudes de registro para habilitar los perfiles de los empleados.
                  </p>
                </div>

                <div className="space-y-4">
                  {pendingWorkers.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 border border-dashed border-outline-variant rounded-2xl">
                      <UserCheck size={40} className="text-outline mx-auto mb-3" />
                      <p className="text-sm font-bold text-on-surface">No hay registros pendientes</p>
                      <p className="text-xs text-on-surface-variant mt-1">Todos los perfiles de los empleados han sido procesados.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pendingWorkers.map((worker) => (
                        <div 
                          key={worker.email} 
                          className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant flex flex-col justify-between hover:border-primary/20 transition-all relative overflow-hidden"
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

                          <div className="flex gap-2 mt-4 pt-3 border-t border-outline-variant/30">
                            <button
                              onClick={() => handleRejectWorker(worker.email)}
                              className="flex-grow py-1.5 border border-red-200 hover:bg-red-50 text-red-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                            >
                              Rechazar
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
                    {approvedWorkers.map((worker) => (
                      <div key={worker.email} className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg border border-outline-variant/50">
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-bold text-on-surface truncate">{worker.name}</p>
                          <p className="text-[10px] text-on-surface-variant">Oficina: {worker.office} &bull; {worker.isAdmin ? 'Admin' : 'Personal'}</p>
                        </div>
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[9px] font-bold uppercase">
                          Activo
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
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
                <div className="flex items-center gap-4 pb-6 border-b border-surface-container">
                  <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold uppercase shadow-sm border-2 border-primary/20">
                    MM
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-on-surface">Mati Moya</h3>
                    <p className="text-xs text-on-surface-variant">Director General de Mantenimiento e Infraestructura</p>
                    <p className="text-xs font-mono text-primary font-bold mt-1 bg-primary/10 px-2.5 py-0.5 rounded-full inline-block">
                      matymoya18@gmail.com
                    </p>
                  </div>
                </div>

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
                          const initials = t.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'AD';
                          return (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold border border-outline-variant/50 uppercase">
                                  {initials}
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
                    <button
                      onClick={() => alert('Parámetros guardados correctamente en almacenamiento persistente.')}
                      className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                    >
                      Guardar Cambios
                    </button>
                  </div>
                </div>
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
          <span className="text-[10px] font-bold mt-1">Dashboard</span>
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
          onClick={() => setActiveTab('preventivo')}
          className={`flex flex-col items-center justify-center w-full h-full transition-all cursor-pointer ${
            activeTab === 'preventivo' ? 'text-primary font-extrabold scale-102' : 'text-on-surface-variant'
          }`}
        >
          <CalendarRange size={20} />
          <span className="text-[10px] font-bold mt-1">Preventivo</span>
        </button>

        {userProfile?.isAdmin && (
          <button 
            onClick={() => setActiveTab('aprobaciones')}
            className={`flex flex-col items-center justify-center w-full h-full transition-all cursor-pointer relative ${
              activeTab === 'aprobaciones' ? 'text-primary font-extrabold scale-102' : 'text-on-surface-variant'
            }`}
          >
            <UserCheck size={20} />
            <span className="text-[10px] font-bold mt-1">Aprobaciones</span>
            {pendingWorkers.length > 0 && (
              <span className="absolute top-1 right-4 px-1.5 py-0.5 bg-red-600 text-white rounded-full text-[8px] font-bold">
                {pendingWorkers.length}
              </span>
            )}
          </button>
        )}

        <button 
          onClick={() => setActiveTab('mas')}
          className={`flex flex-col items-center justify-center w-full h-full transition-all cursor-pointer ${
            activeTab === 'mas' ? 'text-primary font-extrabold scale-102' : 'text-on-surface-variant'
          }`}
        >
          <MoreHorizontal size={20} />
          <span className="text-[10px] font-bold mt-1">Más</span>
        </button>
      </nav>

      <NavigationMenuDrawer 
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        userProfile={userProfile}
        onSaveProfile={setUserProfile}
        onNavigateToTab={setActiveTab}
        onAddActivityLog={handleAddActivityLog}
      />

    </div>
  );
}
