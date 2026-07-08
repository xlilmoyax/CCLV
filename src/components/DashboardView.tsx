import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Wrench, 
  Activity as ActivityIcon, 
  Plus, 
  Layers,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Sliders,
  Check,
  RefreshCw
} from 'lucide-react';
import { Incident, PreventiveTask, Activity, UserProfile } from '../types';

interface DashboardViewProps {
  incidents: Incident[];
  preventiveTasks: PreventiveTask[];
  activities: Activity[];
  onNavigateToTab: (tab: string) => void;
  onOpenNewIncident: () => void;
  userProfile?: UserProfile | null;
  onSyncOneDrive?: () => void;
  isSyncing?: boolean;
}

export default function DashboardView({
  incidents,
  preventiveTasks,
  activities,
  onNavigateToTab,
  onOpenNewIncident,
  userProfile,
  onSyncOneDrive,
  isSyncing
}: DashboardViewProps) {
  const [selectedPisoDays, setSelectedPisoDays] = useState<'7' | '30'>('30');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Dynamic calculations from real state!
  const totalIncidentsCount = incidents.length;
  const pendingCount = incidents.filter(i => i.status === 'Pendiente').length;
  const inProcessCount = incidents.filter(i => i.status === 'En Proceso').length;
  const completedCount = incidents.filter(i => i.status === 'Completada').length;

  // Categorize
  const categoryCounts = incidents.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const finalCategoryCounts = { ...categoryCounts };
  const totalCatSum = Object.values(finalCategoryCounts).reduce((a, b) => a + b, 0) || 1;

  // Floor distribution
  const floorCounts = incidents.reduce((acc, curr) => {
    acc[curr.floor] = (acc[curr.floor] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const floorsOrdered = [
    { key: 'Subsuelo', abbrev: 'SS' },
    { key: 'Planta Baja', abbrev: 'PB' },
    { key: 'Primero', abbrev: '1°' },
    { key: 'Segundo', abbrev: '2°' },
    { key: 'Tercero', abbrev: '3°' },
    { key: 'Cuarto', abbrev: '4°' },
    { key: 'Quinto', abbrev: '5°' },
    { key: 'Sexto', abbrev: '6°' },
    { key: 'Terraza', abbrev: 'TR' }
  ];

  const finalFloorCounts = floorsOrdered.map(floor => ({
    full: floor.key,
    abbrev: floor.abbrev,
    count: floorCounts[floor.key] || 0
  }));

  const maxFloorCount = Math.max(...finalFloorCounts.map(f => f.count), 1);

  // Color map for categories
  const categoryColors: Record<string, { fill: string; dot: string }> = {
    Electricidad: { fill: '#3b82f6', dot: 'bg-blue-500' },
    Plomería: { fill: '#eab308', dot: 'bg-yellow-500' },
    Climatización: { fill: '#ef4444', dot: 'bg-red-500' },
    Limpieza: { fill: '#10b981', dot: 'bg-green-500' },
    Seguridad: { fill: '#f97316', dot: 'bg-orange-500' },
    Infraestructura: { fill: '#6366f1', dot: 'bg-indigo-500' },
    IT: { fill: '#8b5cf6', dot: 'bg-purple-500' },
    Cerrajería: { fill: '#14b8a6', dot: 'bg-teal-500' },
    Mobiliario: { fill: '#ec4899', dot: 'bg-pink-500' },
    Pintura: { fill: '#84cc16', dot: 'bg-lime-500' },
    Aberturas: { fill: '#a855f7', dot: 'bg-purple-500' },
    Ascensores: { fill: '#64748b', dot: 'bg-slate-500' },
    Herrería: { fill: '#475569', dot: 'bg-slate-600' },
  };

  // Generate SVG donut parameters
  let cumulativePercent = 0;
  const donutSlices = Object.entries(finalCategoryCounts)
    .map(([cat, val]) => {
      const percent = totalCatSum > 0 ? (val / totalCatSum) * 100 : 0;
      const start = cumulativePercent;
      cumulativePercent += percent;
      return {
        category: cat,
        value: val,
        percent: isNaN(percent) ? 0 : percent,
        start: isNaN(start) ? 0 : start,
        color: categoryColors[cat]?.fill || '#77767f'
      };
    })
    .filter(slice => slice.percent > 0);

  if (userProfile && !userProfile.isAdmin) {
    return (
      <div className="space-y-8 animate-fade-in" id="dashboard-worker-view">
        {/* Welcome Banner */}
        <div className="bg-surface-container border border-outline-variant rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold uppercase rounded-full tracking-wider">
                Personal de Oficina: {userProfile.office}
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-on-surface">¡Hola, {userProfile.name}!</h2>
            <p className="text-sm text-on-surface-variant mt-1">
              Consulte el historial de incidencias registradas en la institución y reporte nuevos eventos técnicos.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {onSyncOneDrive && (
              <button
                onClick={onSyncOneDrive}
                disabled={isSyncing}
                className={`bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors duration-150 shadow-2xs cursor-pointer active:scale-[0.99] ${isSyncing ? 'opacity-70 cursor-wait' : ''}`}
              >
                <RefreshCw size={15} className={isSyncing ? 'animate-spin text-[#7a172c]' : 'text-emerald-700'} />
                <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar OneDrive'}</span>
              </button>
            )}
            <button
              onClick={onOpenNewIncident}
              id="btn-report-inc-banner-worker"
              className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center gap-2 transition-colors duration-150 shadow-sm cursor-pointer"
            >
              <Plus size={18} />
              <span>Reportar Nueva Incidencia</span>
            </button>
          </div>
        </div>

        {/* Informative Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-outline-variant shadow-sm space-y-3 md:col-span-2">
            <h4 className="text-sm font-bold text-on-surface uppercase tracking-wider text-primary">Instrucciones de Reporte</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1 p-3 bg-surface-container-low rounded-lg border border-outline-variant/30">
                <span className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-[10px] mb-1">1</span>
                <p className="font-semibold text-on-surface">Cargar Evento</p>
                <p className="text-on-surface-variant/80 text-[11px]">Haz clic en "Nueva Incidencia" e indica el piso, sector y urgencia.</p>
              </div>
              <div className="space-y-1 p-3 bg-surface-container-low rounded-lg border border-outline-variant/30">
                <span className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-[10px] mb-1">2</span>
                <p className="font-semibold text-on-surface">Control de Lectura</p>
                <p className="text-on-surface-variant/80 text-[11px]">Podrás ver su estado (Pendiente, En Proceso o Completada) en tiempo real.</p>
              </div>
              <div className="space-y-1 p-3 bg-surface-container-low rounded-lg border border-outline-variant/30">
                <span className="w-5 h-5 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-[10px] mb-1">3</span>
                <p className="font-semibold text-on-surface">Resolución Técnica</p>
                <p className="text-on-surface-variant/80 text-[11px]">El equipo de mantenimiento/administración actualizará y resolverá la avería.</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-on-surface uppercase tracking-wider text-primary">Resumen del Estado</h4>
              <p className="text-[11px] text-on-surface-variant">Estado actual de todos los reportes operativos de la institución.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div className="bg-red-50 border border-red-100 p-2 rounded-lg">
                <span className="block text-lg font-bold text-red-700">{incidents.filter(i => i.status === 'Pendiente').length}</span>
                <span className="text-[9px] font-bold text-red-600 uppercase">Pendientes</span>
              </div>
              <div className="bg-amber-50 border border-amber-100 p-2 rounded-lg">
                <span className="block text-lg font-bold text-amber-700">{incidents.filter(i => i.status === 'En Proceso').length}</span>
                <span className="text-[9px] font-bold text-amber-600 uppercase">En Proceso</span>
              </div>
              <div className="bg-green-50 border border-green-100 p-2 rounded-lg">
                <span className="block text-lg font-bold text-green-700">{incidents.filter(i => i.status === 'Completada').length}</span>
                <span className="text-[9px] font-bold text-green-600 uppercase">Resueltas</span>
              </div>
            </div>
          </div>
        </div>

        {/* Incident History Table */}
        <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
          <div className="p-5 border-b border-outline-variant flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-on-surface">Historial de Incidencias Institucionales</h4>
              <p className="text-xs text-on-surface-variant">Datos del estado y progreso de resolución de cada avería reportada.</p>
            </div>
            <button 
              onClick={() => onNavigateToTab('incidencias')}
              className="text-primary text-xs font-bold hover:underline bg-primary/5 hover:bg-primary/10 px-3.5 py-1.5 rounded-lg cursor-pointer transition-all"
            >
              Ir a Buscador Detallado &rarr;
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-container/40 text-on-surface-variant font-bold border-b border-outline-variant">
                  <th className="p-4">ID</th>
                  <th className="p-4">Concepto / Avería</th>
                  <th className="p-4">Ubicación</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4">Prioridad</th>
                  <th className="p-4">Estado de Resolución</th>
                  <th className="p-4">Fecha Reporte</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {incidents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-on-surface-variant italic">
                      No hay incidencias reportadas en el sistema.
                    </td>
                  </tr>
                ) : (
                  incidents.map((inc) => {
                    const priorityBadge = inc.priority === 'Crítica'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : inc.priority === 'Alta'
                      ? 'bg-orange-100 text-orange-800 border border-orange-200'
                      : inc.priority === 'Media'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-slate-100 text-slate-800 border border-slate-200';

                    const statusBadge = inc.status === 'Completada'
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : inc.status === 'En Proceso'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-red-100 text-red-800 border border-red-200';

                    return (
                      <tr key={inc.id} className="hover:bg-surface-container-low/20 transition-all">
                        <td className="p-4 font-mono font-bold text-primary">{inc.id}</td>
                        <td className="p-4 font-semibold text-on-surface">
                          <div>
                            <p>{inc.title}</p>
                            <p className="text-[10px] text-on-surface-variant/80 font-normal line-clamp-1 mt-0.5">{inc.description}</p>
                          </div>
                        </td>
                        <td className="p-4 text-on-surface-variant">{inc.floor} &bull; {inc.sector}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant rounded-full text-[10px] font-semibold border border-outline-variant/20">
                            {inc.category}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${priorityBadge}`}>
                            {inc.priority}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1.5 w-fit ${statusBadge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              inc.status === 'Completada' ? 'bg-green-600' : inc.status === 'En Proceso' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'
                            }`} />
                            {inc.status}
                          </span>
                        </td>
                        <td className="p-4 text-on-surface-variant font-medium">{inc.createdAt}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" id="dashboard-view-panel">
      {/* Welcome Banner */}
      <div className="bg-surface-container border border-outline-variant rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-on-surface">Mantenimiento Preventivo e Incidencias</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Visualiza el estado operativo, indicadores clave y actividades recientes de la institución.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {onSyncOneDrive && (
            <button
              onClick={onSyncOneDrive}
              disabled={isSyncing}
              className={`bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors duration-150 shadow-2xs cursor-pointer active:scale-[0.99] ${isSyncing ? 'opacity-70 cursor-wait' : ''}`}
            >
              <RefreshCw size={15} className={isSyncing ? 'animate-spin text-[#7a172c]' : 'text-emerald-700'} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar OneDrive'}</span>
            </button>
          )}
          <button
            onClick={onOpenNewIncident}
            id="btn-report-inc-banner"
            className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center gap-2 transition-colors duration-150 shadow-sm cursor-pointer"
          >
            <Plus size={18} />
            <span>Nueva Incidencia</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-cards-grid">
        {/* Card 1 */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Total General</p>
            <h3 className="text-3xl font-bold text-primary mt-1">{totalIncidentsCount}</h3>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-green-700 font-medium">
            <TrendingUp size={14} />
            <span>Actualizado en vivo</span>
          </div>
        </motion.div>

        {/* Card 2 */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Pendientes</p>
            <h3 className="text-3xl font-bold text-error mt-1">{pendingCount}</h3>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-error font-medium">
            <AlertTriangle size={14} />
            <span>Requieren atención inmediata</span>
          </div>
        </motion.div>

        {/* Card 3 */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">En Proceso</p>
            <h3 className="text-3xl font-bold text-tertiary mt-1">{inProcessCount}</h3>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-tertiary font-medium">
            <Clock size={14} />
            <span>Equipos asignados</span>
          </div>
        </motion.div>

        {/* Card 4 */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Finalizadas</p>
            <h3 className="text-3xl font-bold text-green-700 mt-1">{completedCount}</h3>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-green-700 font-medium">
            <CheckCircle size={14} />
            <span>Resueltas este mes</span>
          </div>
        </motion.div>
      </div>

      {/* Bento Grid Charts & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Donut Chart Widget */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm flex flex-col justify-between" id="categories-chart-box">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-bold text-on-surface">Categorías</h4>
              <span className="text-xs text-on-surface-variant font-medium bg-surface-container px-2.5 py-1 rounded-full">Distribución</span>
            </div>

            {/* Circular Chart container */}
            <div className="relative flex items-center justify-center py-4">
              <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f0edf1" strokeWidth="3" />
                {donutSlices.map((slice, idx) => {
                  const percentVal = isNaN(slice.percent) ? 0 : slice.percent;
                  const startVal = isNaN(slice.start) ? 0 : slice.start;
                  const strokeDasharray = `${percentVal.toFixed(2)} ${(100 - percentVal).toFixed(2)}`;
                  const strokeDashoffset = (100 - startVal).toFixed(2);
                  return (
                    <circle
                      key={idx}
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth={hoveredCategory === slice.category ? '4' : '3'}
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-300 cursor-pointer"
                      onMouseEnter={() => setHoveredCategory(slice.category)}
                      onMouseLeave={() => setHoveredCategory(null)}
                    />
                  );
                })}
              </svg>

              {/* Central Text inside Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                {hoveredCategory ? (
                  <>
                    <span className="text-xl font-bold text-primary">
                      {finalCategoryCounts[hoveredCategory as keyof typeof finalCategoryCounts]}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-on-surface-variant truncate max-w-[110px]">
                      {hoveredCategory}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl font-extrabold text-primary">{totalCatSum}</span>
                    <span className="text-xs uppercase tracking-wider font-semibold text-on-surface-variant">TOTAL</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Slices legend */}
          <div className="mt-6 space-y-2 text-sm">
            {Object.entries(finalCategoryCounts).slice(0, 4).map(([category, count]) => {
              const pct = ((count / totalCatSum) * 100).toFixed(1);
              const colorInfo = categoryColors[category] || { dot: 'bg-outline' };
              const isHovered = hoveredCategory === category;
              return (
                <div 
                  key={category} 
                  className={`flex items-center justify-between p-1.5 rounded-md transition-colors ${isHovered ? 'bg-surface-container' : ''}`}
                  onMouseEnter={() => setHoveredCategory(category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${colorInfo.dot}`} />
                    <span className="font-medium text-on-surface">{category}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-on-surface font-semibold">{count}</span>
                    <span className="text-on-surface-variant">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bar Chart Widget (Incidencias por Piso) */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm lg:col-span-2 flex flex-col justify-between" id="floors-chart-box">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-bold text-on-surface">Incidencias por Piso</h4>
              <div className="flex bg-surface-container p-1 rounded-lg">
                <button 
                  onClick={() => setSelectedPisoDays('7')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer transition-all ${selectedPisoDays === '7' ? 'bg-white text-primary shadow-xs' : 'text-on-surface-variant'}`}
                >
                  7 Días
                </button>
                <button 
                  onClick={() => setSelectedPisoDays('30')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer transition-all ${selectedPisoDays === '30' ? 'bg-white text-primary shadow-xs' : 'text-on-surface-variant'}`}
                >
                  30 Días
                </button>
              </div>
            </div>

            {/* Vertical Bars */}
            <div className="h-64 flex items-end justify-between gap-3 pt-6 px-2 border-b border-outline-variant pb-3">
              {finalFloorCounts.map((floorData, idx) => {
                // Adjust value based on selected range mock calculation
                const multiplier = selectedPisoDays === '7' ? 0.4 : 1.0;
                const value = Math.max(1, Math.round(floorData.count * multiplier));
                const percentage = (value / maxFloorCount) * 100;
                
                return (
                  <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end group cursor-pointer relative">
                    {/* Tooltip on Hover */}
                    <div className="absolute -top-6 bg-primary text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none font-bold">
                      {value} {value === 1 ? 'incidencia' : 'incidencias'}
                    </div>

                    {/* Outer Bar */}
                    <div className="w-full bg-surface-container hover:bg-surface-container-high rounded-t-md transition-all duration-300 relative overflow-hidden" style={{ height: `${percentage}%` }}>
                      {/* Active Fill */}
                      <div className="absolute bottom-0 left-0 right-0 bg-primary-container group-hover:bg-primary transition-all duration-300" style={{ height: '100%' }} />
                    </div>

                    {/* Label */}
                    <span className="text-[11px] font-semibold text-on-surface-variant mt-2">
                      {floorData.abbrev}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-on-surface-variant italic">
            <span>Mostrando distribución actual de tareas activas por nivel estructural.</span>
            <span className="font-semibold text-primary cursor-pointer hover:underline" onClick={() => onNavigateToTab('incidencias')}>
              Ver Incidencias &rarr;
            </span>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm lg:col-span-3" id="recent-activity-box">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <ActivityIcon className="text-primary" size={20} />
              <h4 className="text-lg font-bold text-on-surface">Actividades Recientes</h4>
            </div>
            <button 
              onClick={() => onNavigateToTab('incidencias')}
              className="text-primary text-xs font-semibold hover:underline bg-surface-container px-2.5 py-1 rounded-full cursor-pointer"
            >
              Ver todo
            </button>
          </div>

          <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
            {activities.length === 0 ? (
              <p className="text-sm text-on-surface-variant italic text-center py-8">No hay actividades recientes.</p>
            ) : (
              activities.map((activity, index) => {
                const isCompleted = activity.type === 'task_completed';
                const isNew = activity.type === 'new_incident';
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key={`${activity.id}-${index}`}
                    className="flex items-start gap-4 p-4 hover:bg-surface-container-low transition-colors rounded-lg border border-outline-variant"
                  >
                    {/* Circle Status Icon */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isCompleted ? 'bg-green-100 text-green-700' : isNew ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {isCompleted ? <Check size={16} /> : isNew ? <AlertTriangle size={16} /> : <Wrench size={16} />}
                    </div>

                    {/* Core description text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h5 className="text-sm font-bold text-on-surface truncate pr-2">{activity.title}</h5>
                        <span className="text-[10px] font-mono text-on-surface-variant flex-shrink-0">{activity.timestamp}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                        {activity.description}
                      </p>
                      
                      {/* Sub-Badges */}
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          isCompleted ? 'bg-green-100 text-green-700' : isNew ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {activity.statusText}
                        </span>
                        <span className="bg-surface-container text-on-surface-variant px-2 py-0.5 rounded text-[9px] font-semibold uppercase">
                          {activity.category}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
