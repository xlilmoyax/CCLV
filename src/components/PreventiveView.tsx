import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Search, 
  Filter, 
  Plus, 
  Cpu, 
  User, 
  MoreVertical,
  X,
  Droplet,
  Shield,
  Layers,
  Wrench,
  Check,
  CheckSquare,
  RefreshCw
} from 'lucide-react';
import { PreventiveTask, StatusType } from '../types';
import { FLOORS, CATEGORIES } from '../data';

interface PreventiveViewProps {
  tasks: PreventiveTask[];
  onCompleteTask: (id: string) => void;
  onAddTask: (task: Omit<PreventiveTask, 'id'>) => void;
  onSyncOneDrive?: () => Promise<void>;
  isSyncing?: boolean;
}

export default function PreventiveView({
  tasks,
  onCompleteTask,
  onAddTask,
  onSyncOneDrive,
  isSyncing = false
}: PreventiveViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState<string>('Todas');
  const [selectedDay, setSelectedDay] = useState<number | null>(15); // Default highlight Day 15 (Ascensores)
  
  // Modals state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  // New task form fields
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('2026-10-15');
  const [newCategory, setNewCategory] = useState('Infraestructura');
  const [newFloor, setNewFloor] = useState('Todos');
  const [newFrequency, setNewFrequency] = useState('Mensual');
  const [newResponsable, setNewResponsable] = useState('M. Rodríguez');

  // Filtered tasks for the list
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          task.assigneeName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesArea = selectedArea === 'Todas' || task.category === selectedArea;
    
    return matchesSearch && matchesArea;
  });

  // KPI Metrics calculated live
  const totalCompletadas = tasks.filter(t => t.status === 'Completada').length;
  const totalProgramadas = tasks.filter(t => t.status === 'Programada').length;
  const totalVencidas = tasks.filter(t => t.status === 'Vencida').length;

  // Calendar parameters for October 2026
  // October 1 2026 is a Thursday. 
  // Week start: Lun (0) to Dom (6)
  // Thursday is index 3.
  const emptyDaysOffset = 3; 
  const totalDaysInOctober = 31;
  const calendarGridCells = Array.from({ length: emptyDaysOffset + totalDaysInOctober });

  // Get task for a specific day in October 2026
  const getTasksForDay = (day: number) => {
    const dateString = `2026-10-${day.toString().padStart(2, '0')}`;
    return tasks.filter(t => t.date === dateString);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddTask({
      title: newTitle,
      date: newDate,
      category: newCategory,
      floor: newFloor,
      frequency: newFrequency,
      assigneeName: newResponsable,
      assigneeAvatar: newResponsable === 'J. Pérez' 
        ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuALTD5bpIoJ6b2hk9t9PjQ8NReezTTfWpI-GXLQR1Olz2UD4SdIIrSt_DYW4MG23gnAgYLD-Xd7cahKYJTV6jyYAX6mH_M19F7FXrVPVkQ2Y5NoxlYLF3ee3oNL3oBMFunWlz-IIsNRk9oZLdoVN2XdjTPiucvA6B-lSl-ew8Z1XI9S26nbI4rUZevOPXuvqNpAk7agK5tEN-y1Ujvvlhrm_LSBlGMBUgq_8Vb4rwH01JOmckEX3ajPaalRqmQAxOB5gRWufnt39dE'
        : newResponsable === 'L. Gómez'
        ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuD4DBRZ0A_QNrDliXWywRAGgg5E0Rpd9KROOew8MOGhkj2C74DrULj_qbzHsyb8s4gJtqUeEujS9Q6Yk8EZ0VJyCq6HEpHaNRbqho12IYNethb7l84-mPDVG8LKZdGjWThGr84FVxMzngbUQijakLrlJ9y1abBm9fcq77o6VvxnUhqUDdjXghjM7DusLYOqAxjuz_6YzGFERMkBVFYHpdPW7gvU6nKDjfVvQR_JSNjP_mEdYrEI0I5XRo_VmPyo91FHGdm0_IJ11_Y'
        : 'https://lh3.googleusercontent.com/aida-public/AB6AXuA728MD6rZDv4BH2SQrEjEPhoOMSNNza3I-2HcLA8Ap9LdrPeJmablghS5kXzJO8gLMU8aml0r-WQJWWL_EC_i2cvE6nqivHdkHS6SfAkQiyjXyv3hAK-EThgE3saTgaZ9bIGvvTY-SgjrQ74U85kas6DzltWMpEhUntXiZC_BsCyeDWfSbXoJCGcl11PYNETTmTgqNFMhQqkHdckc1aU8iIi4uWDzz0h15ZCx7jQN8hZZFPqv1Cf-RwMtxL092Y9z4GRdfQLklVnA',
      status: 'Programada'
    });

    // Reset fields & Close modal
    setNewTitle('');
    setIsScheduleModalOpen(false);
  };

  // Helper icons for categories in the table
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Infraestructura': return <Layers className="text-primary" size={18} />;
      case 'Climatización': return <Wrench className="text-red-700" size={18} />;
      case 'IT': return <Cpu className="text-indigo-900" size={18} />;
      case 'Limpieza': return <Droplet className="text-green-700" size={18} />;
      case 'Seguridad': return <Shield className="text-amber-800" size={18} />;
      default: return <Wrench className="text-primary" size={18} />;
    }
  };

  return (
    <div className="space-y-6" id="preventive-tab-content">
      {/* Tab bar header & Scheduling button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-on-surface">Mantenimiento Preventivo</h2>
          <p className="text-sm text-on-surface-variant">Programación, control de rutinas técnicas y calendarios operativos.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5">
          {onSyncOneDrive && (
            <button
              onClick={onSyncOneDrive}
              disabled={isSyncing}
              className={`bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 px-5 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-150 shadow-2xs cursor-pointer active:scale-[0.99] ${isSyncing ? 'opacity-70 cursor-wait' : ''}`}
            >
              <RefreshCw size={15} className={isSyncing ? 'animate-spin text-[#7a172c]' : 'text-emerald-700'} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar OneDrive Excel'}</span>
            </button>
          )}
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            id="btn-schedule-preventive-task"
            className="bg-primary hover:bg-primary-hover text-white px-5 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-150 shadow-sm cursor-pointer"
          >
            <Plus size={18} />
            <span>Programar Tarea</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Calendar left, stats right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* October 2026 Calendar view card */}
        <div className="lg:col-span-2 bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col" id="calendar-bento-card">
          <div className="p-4 border-b border-outline-variant flex items-center justify-between bg-surface-container">
            <div className="flex items-center gap-2 text-primary">
              <Calendar size={18} />
              <span className="text-sm font-bold">Calendario de Octubre 2026</span>
            </div>
          </div>

          <div className="p-4 flex-1">
            {/* Days of week labels */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-on-surface-variant uppercase pb-2 border-b border-surface-container">
              <div>Lun</div>
              <div>Mar</div>
              <div>Mié</div>
              <div>Jue</div>
              <div>Vie</div>
              <div>Sáb</div>
              <div>Dom</div>
            </div>

            {/* Grid days */}
            <div className="grid grid-cols-7 gap-1.5 pt-2">
              {calendarGridCells.map((_, idx) => {
                // If it is an offset cell, render empty
                if (idx < emptyDaysOffset) {
                  return <div key={`empty-${idx}`} className="min-h-[76px] bg-slate-50/50 rounded-lg" />;
                }

                // Days numbers
                const day = idx - emptyDaysOffset + 1;
                const isSelected = selectedDay === day;
                const dayTasks = getTasksForDay(day);
                const hasOverdue = dayTasks.some(t => t.status === 'Vencida');
                const hasPending = dayTasks.some(t => t.status === 'Programada');
                
                return (
                  <div 
                    key={`day-${day}`}
                    onClick={() => setSelectedDay(day)}
                    className={`min-h-[76px] border rounded-lg p-1.5 transition-all cursor-pointer flex flex-col justify-between group ${
                      isSelected 
                        ? 'bg-primary-container/10 border-primary shadow-xs ring-1 ring-primary' 
                        : 'bg-white border-outline-variant hover:bg-surface-container-low'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-[11px] font-bold h-5 w-5 flex items-center justify-center rounded-full ${
                        isSelected ? 'bg-primary text-white' : 'text-on-surface'
                      }`}>
                        {day}
                      </span>
                      
                      {/* Event dot indicators */}
                      <div className="flex gap-1">
                        {hasOverdue && <span className="w-1.5 h-1.5 rounded-full bg-error" />}
                        {hasPending && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      </div>
                    </div>

                    {/* Miniature title tags inside the day boxes */}
                    <div className="space-y-0.5 mt-1">
                      {dayTasks.slice(0, 2).map((t, tid) => (
                        <div 
                          key={tid}
                          className={`text-[9px] px-1 py-0.5 rounded font-extrabold truncate leading-tight ${
                            t.status === 'Vencida' 
                              ? 'bg-red-50 text-error border border-red-100' 
                              : t.status === 'Completada'
                              ? 'bg-slate-100 text-on-surface-variant'
                              : 'bg-indigo-50 text-primary border border-indigo-100'
                          }`}
                        >
                          {t.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Day details & general stats */}
        <div className="space-y-6 flex flex-col justify-between">
          
          {/* General metrics */}
          <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
            <h3 className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider mb-4">Estado General</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 text-green-700 rounded-lg flex items-center justify-center border border-green-100">
                    <CheckSquare size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-on-surface leading-none">{totalCompletadas}</p>
                    <p className="text-xs text-on-surface-variant mt-1">Completadas</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded">+24% vs last mo.</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 text-tertiary rounded-lg flex items-center justify-center border border-amber-100">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-on-surface leading-none">{totalProgramadas}</p>
                    <p className="text-xs text-on-surface-variant mt-1">Programadas</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 text-error rounded-lg flex items-center justify-center border border-red-100">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-on-surface leading-none">{totalVencidas}</p>
                    <p className="text-xs text-on-surface-variant mt-1">Vencidas</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-error bg-red-50 px-2 py-0.5 rounded">-2%</span>
              </div>
            </div>
          </div>

          {/* Details for clicked day */}
          <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-extrabold text-on-surface-variant uppercase tracking-wider mb-3">
                Tareas del Día: {selectedDay ? `Octubre ${selectedDay}` : 'Ninguno seleccionado'}
              </h3>

              {selectedDay && getTasksForDay(selectedDay).length === 0 ? (
                <p className="text-xs text-on-surface-variant italic py-8 text-center bg-surface-container-low rounded-lg border border-dashed border-outline-variant">
                  No hay tareas preventivas programadas para esta fecha.
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedDay && getTasksForDay(selectedDay).map(task => (
                    <div key={task.id} className="p-3.5 border border-outline-variant rounded-lg bg-surface-container-lowest shadow-xs flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-surface-container rounded text-primary">
                          {getCategoryIcon(task.category)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-on-surface">{task.title}</h4>
                          <p className="text-[10px] text-on-surface-variant mt-0.5">Ubicación: {task.floor}</p>
                        </div>
                      </div>
                      
                      {task.status !== 'Completada' ? (
                        <button
                          onClick={() => onCompleteTask(task.id)}
                          className="text-[10px] bg-primary hover:bg-primary-hover text-white px-2.5 py-1 rounded font-bold cursor-pointer transition-all flex items-center gap-1"
                        >
                          <Check size={10} />
                          <span>Completar</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-green-700 bg-green-50 px-2 py-1 rounded font-bold uppercase">
                          Hecha
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-center pt-4 border-t border-surface-container mt-4">
              <p className="text-[11px] text-on-surface-variant italic">
                Tip: Haz clic en cualquier día marcado en el calendario para gestionar su programación directa.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Filter by Area and searchable list */}
      <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden" id="preventive-routines-box">
        
        {/* Table Controls */}
        <div className="p-6 border-b border-outline-variant flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-on-surface">Rutinas Preventivas</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">Lista detallada y control de revisiones periódicas.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Area selections buttons filter */}
            <div className="flex flex-wrap gap-1.5 bg-surface-container p-1 rounded-lg">
              {['Todas', 'Infraestructura', 'Climatización', 'IT', 'Limpieza'].map(area => (
                <button
                  key={area}
                  onClick={() => setSelectedArea(area)}
                  className={`px-3 py-1 text-xs font-bold rounded-md cursor-pointer transition-all ${
                    selectedArea === area 
                      ? 'bg-primary text-white shadow-xs' 
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {area}
                </button>
              ))}
            </div>

            {/* Input Search inside table bar */}
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={15} />
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por tarea o responsable..."
                className="pl-9 pr-4 py-1.5 bg-white border border-outline-variant rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary w-full"
              />
            </div>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-surface-container border-b border-outline-variant text-on-surface-variant text-[11px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Tarea</th>
                <th className="px-6 py-4">Próxima Revisión</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4">Piso</th>
                <th className="px-6 py-4">Frecuencia</th>
                <th className="px-6 py-4">Responsable</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container font-medium text-on-surface">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-on-surface-variant italic">
                    No se encontraron tareas periódicas para el filtro seleccionado.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-surface-container-low transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-surface-container text-primary rounded-lg flex items-center justify-center">
                          {getCategoryIcon(task.category)}
                        </div>
                        <span className="font-bold text-on-surface text-xs">{task.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">{task.date}</td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] bg-surface-container px-2.5 py-1 rounded-full font-bold">
                        {task.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">{task.floor}</td>
                    <td className="px-6 py-4 text-xs">{task.frequency}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <img 
                          src={task.assigneeAvatar} 
                          alt={task.assigneeName} 
                          className="w-5 h-5 rounded-full object-cover border border-outline-variant"
                        />
                        <span className="text-xs">{task.assigneeName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-tight ${
                        task.status === 'Completada' 
                          ? 'bg-slate-100 text-on-surface-variant' 
                          : task.status === 'Vencida'
                          ? 'bg-red-50 text-error'
                          : 'bg-amber-50 text-tertiary'
                      }`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {task.status !== 'Completada' ? (
                        <button
                          onClick={() => onCompleteTask(task.id)}
                          className="bg-primary hover:bg-primary-hover text-white px-3 py-1 rounded text-xs font-bold cursor-pointer transition-colors"
                        >
                          Hecha
                        </button>
                      ) : (
                        <span className="text-green-700 bg-green-50 px-2 py-1 rounded text-xs font-bold">
                          Completada
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination mock bar */}
        <div className="p-4 border-t border-outline-variant bg-surface-container flex items-center justify-center">
          <p className="text-xs text-on-surface-variant italic font-medium">
            Mostrando {filteredTasks.length} de {tasks.length} tareas programadas para este período.
          </p>
        </div>
      </div>

      {/* Programar Tarea Modal Dialogue */}
      <AnimatePresence>
        {isScheduleModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsScheduleModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container">
                <h3 className="text-base font-bold text-on-surface">Programar Tarea Preventiva</h3>
                <button 
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="p-1 text-outline hover:text-on-surface rounded-full hover:bg-surface-container-high transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="p-6 space-y-4">
                {/* Título */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Título de la revisión</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ej: Calibración Tableros Eléctricos"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Fecha */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Fecha programada (Octubre 2026)</label>
                  <input 
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Grid category & floors */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Categoría</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Piso</label>
                    <select
                      value={newFloor}
                      onChange={(e) => setNewFloor(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Todos">Todos</option>
                      {FLOORS.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Grid frequency & responsable */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Frecuencia</label>
                    <select
                      value={newFrequency}
                      onChange={(e) => setNewFrequency(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Semanal">Semanal</option>
                      <option value="Mensual">Mensual</option>
                      <option value="Trimestral">Trimestral</option>
                      <option value="Semestral">Semestral</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Responsable</label>
                    <select
                      value={newResponsable}
                      onChange={(e) => setNewResponsable(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="M. Rodríguez">M. Rodríguez</option>
                      <option value="J. Pérez">J. Pérez</option>
                      <option value="L. Gómez">L. Gómez</option>
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-surface-container flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsScheduleModalOpen(false)}
                    className="px-4 py-2 border border-outline-variant hover:bg-surface-container-low rounded-lg text-xs font-bold cursor-pointer text-on-surface"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Programar Tarea
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
