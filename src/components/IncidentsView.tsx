import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  MapPin, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  User, 
  Trash2, 
  X, 
  ChevronRight, 
  Sparkles, 
  FileText,
  AlertCircle,
  Plus,
  ArrowUpRight
} from 'lucide-react';
import { Incident, PriorityType, StatusType, UserProfile } from '../types';
import { FLOORS, CATEGORIES } from '../data';

interface IncidentsViewProps {
  incidents: Incident[];
  onUpdateIncidentStatus: (id: string, newStatus: StatusType, cost?: number, actionsTaken?: string) => void;
  onUpdateIncidentPriority: (id: string, newPriority: PriorityType) => void;
  onDeleteIncident: (id: string) => void;
  onOpenNewIncident: () => void;
  userProfile?: UserProfile | null;
  highlightedIncidentId?: string | null;
  onClearHighlight?: () => void;
}

export default function IncidentsView({
  incidents,
  onUpdateIncidentStatus,
  onUpdateIncidentPriority,
  onDeleteIncident,
  onOpenNewIncident,
  userProfile,
  highlightedIncidentId,
  onClearHighlight
}: IncidentsViewProps) {
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFloor, setSelectedFloor] = useState<string>('Todos');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [selectedStatus, setSelectedStatus] = useState<string>('Activos'); // 'Todos' | 'Activos' | 'Pendiente' | 'En Proceso' | 'Completada'

  // Incident detail modal state
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const activeIncident = selectedIncident ? (incidents.find(i => i.id === selectedIncident.id) || selectedIncident) : null;

  // Sync highlighted incident
  React.useEffect(() => {
    if (highlightedIncidentId) {
      const found = incidents.find(i => i.id === highlightedIncidentId);
      if (found) {
        if (found.status === 'Completada') {
          setSelectedStatus('Todos');
        } else {
          setSelectedStatus('Activos');
        }
        setSearchTerm('');
        setSelectedFloor('Todos');
        setSelectedCategory('Todas');
        setSelectedIncident(found);
      }
    }
  }, [highlightedIncidentId, incidents]);

  const handleCloseModal = () => {
    setSelectedIncident(null);
    setShowDeleteConfirm(false);
    onClearHighlight?.();
  };

  // Filtered incidents
  const filteredIncidents = incidents.filter(incident => {
    // Search matching id, title or description
    const query = searchTerm.toLowerCase();
    const matchesSearch = 
      incident.id.toLowerCase().includes(query) ||
      incident.title.toLowerCase().includes(query) ||
      incident.description.toLowerCase().includes(query) ||
      incident.sector.toLowerCase().includes(query);

    // Floor matching
    const matchesFloor = selectedFloor === 'Todos' || incident.floor === selectedFloor;

    // Category matching
    const matchesCategory = selectedCategory === 'Todas' || incident.category === selectedCategory;

    // Status matching
    let matchesStatus = true;
    if (selectedStatus === 'Activos') {
      matchesStatus = incident.status !== 'Completada';
    } else if (selectedStatus !== 'Todos') {
      matchesStatus = incident.status === selectedStatus;
    }

    return matchesSearch && matchesFloor && matchesCategory && matchesStatus;
  });

  // Sort incidents from most recent (newest) to oldest
  const sortedIncidents = [...filteredIncidents].sort((a, b) => {
    const dateA = a.createdAt || '';
    const dateB = b.createdAt || '';
    return dateB.localeCompare(dateA);
  });

  // KPI Calculations on the fly for dynamic feel, based on the search, floor, and category filters
  const kpiFilteredIncidents = incidents.filter(incident => {
    const query = searchTerm.toLowerCase();
    const matchesSearch = 
      incident.id.toLowerCase().includes(query) ||
      incident.title.toLowerCase().includes(query) ||
      incident.description.toLowerCase().includes(query) ||
      incident.sector.toLowerCase().includes(query);

    const matchesFloor = selectedFloor === 'Todos' || incident.floor === selectedFloor;
    const matchesCategory = selectedCategory === 'Todas' || incident.category === selectedCategory;

    return matchesSearch && matchesFloor && matchesCategory;
  });

  const totalActivasFiltered = kpiFilteredIncidents.filter(i => i.status !== 'Completada').length;
  const pendientesCount = kpiFilteredIncidents.filter(i => i.status === 'Pendiente').length;
  const enProcesoCount = kpiFilteredIncidents.filter(i => i.status === 'En Proceso').length;
  const criticasCount = kpiFilteredIncidents.filter(i => i.priority === 'Crítica' && i.status !== 'Completada').length;
  const completadasCount = kpiFilteredIncidents.filter(i => i.status === 'Completada').length;

  return (
    <div className="space-y-6" id="incidents-tab-content">
      {/* Search & Filter Header bar */}
      <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm space-y-4" id="search-filter-incidents">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Input Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={18} />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por ID, sector o concepto..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:outline-none text-sm shadow-xs placeholder-on-surface-variant text-on-surface"
              id="search-input-field"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface text-xs font-semibold"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Quick Add button */}
          <button
            onClick={onOpenNewIncident}
            className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors duration-150 cursor-pointer"
          >
            <Plus size={16} />
            <span>Reportar</span>
          </button>
        </div>

        {/* Dropdowns Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-surface-container">
          <div className="flex items-center gap-1 bg-surface-container px-3 py-1.5 rounded-full text-xs font-bold text-primary">
            <Filter size={14} />
            <span>Filtros:</span>
          </div>

          {/* Floor filter */}
          <div className="relative">
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="bg-white border border-outline-variant rounded-full px-3 py-1.5 text-xs font-semibold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer pr-6"
            >
              <option value="Todos">Piso: Todos</option>
              {FLOORS.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-outline">&#9662;</span>
          </div>

          {/* Category filter */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-outline-variant rounded-full px-3 py-1.5 text-xs font-semibold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer pr-6"
            >
              <option value="Todas">Categoría: Todas</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-outline">&#9662;</span>
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white border border-outline-variant rounded-full px-3 py-1.5 text-xs font-semibold text-on-surface focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer pr-6"
            >
              <option value="Activos">Estado: Activos</option>
              <option value="Todos">Estado: Todos</option>
              <option value="Pendiente">Estado: Pendientes</option>
              <option value="En Proceso">Estado: En Proceso</option>
              <option value="Completada">Estado: Completadas</option>
            </select>
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-outline">&#9662;</span>
          </div>

          {/* Clear filters trigger */}
          {(selectedFloor !== 'Todos' || selectedCategory !== 'Todas' || selectedStatus !== 'Activos' || searchTerm !== '') && (
            <button
              onClick={() => {
                setSelectedFloor('Todos');
                setSelectedCategory('Todas');
                setSelectedStatus('Activos');
                setSearchTerm('');
              }}
              className="text-error hover:underline text-xs font-semibold px-2"
            >
              Restablecer
            </button>
          )}
        </div>
      </div>

      {/* Stats Counter Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4" id="incident-stats-small">
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-xs">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">TOTAL ACTIVAS</p>
          <p className="text-xl font-bold text-primary mt-1">{totalActivasFiltered}</p>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-xs">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">PENDIENTES</p>
          <p className="text-xl font-bold text-error mt-1">{pendientesCount}</p>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-xs">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">EN PROCESO</p>
          <p className="text-xl font-bold text-tertiary mt-1">{enProcesoCount}</p>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-xs">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">CRÍTICAS</p>
          <p className="text-xl font-bold text-[#ba1a1a] mt-1">{criticasCount}</p>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-xs">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">COMPLETADAS</p>
          <p className="text-xl font-bold text-green-700 mt-1">{completadasCount}</p>
        </div>
      </div>

      {/* Incidents Listing */}
      <div className="grid grid-cols-1 gap-4" id="incidents-list-container">
        {filteredIncidents.length === 0 ? (
          <div className="bg-white border border-outline-variant rounded-xl p-12 text-center">
            <AlertCircle className="mx-auto text-outline mb-4" size={40} />
            <h3 className="text-lg font-bold text-on-surface">No se encontraron incidencias</h3>
            <p className="text-sm text-on-surface-variant mt-1">
              Prueba modificando tus filtros o busca un término diferente.
            </p>
            <button
              onClick={() => {
                setSelectedFloor('Todos');
                setSelectedCategory('Todas');
                setSelectedStatus('Todos');
                setSearchTerm('');
              }}
              className="mt-4 text-sm text-primary font-bold hover:underline"
            >
              Mostrar todas las incidencias
            </button>
          </div>
        ) : (
          sortedIncidents.map((incident) => {
            const isCritical = incident.priority === 'Crítica';
            const isCompleted = incident.status === 'Completada';
            const isPending = incident.status === 'Pendiente';
            
            // Highlight container if it's a critical incident (matches Bento Style layout from Screen 1 card 4)
            if (isCritical && !isCompleted) {
              return (
                <motion.div
                  layoutId={`incident-card-${incident.id}`}
                  key={incident.id}
                  onClick={() => setSelectedIncident(incident)}
                  className="group bg-primary-container text-white border border-outline-variant hover:border-primary rounded-xl overflow-hidden shadow-md transition-all hover:scale-[1.01] cursor-pointer flex flex-col md:flex-row relative"
                >
                  <div className="flex-1 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Icon wrapper */}
                      <div className="p-3 bg-white/20 text-white rounded-lg flex items-center justify-center">
                        <AlertTriangle size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono tracking-wider text-white/70">{incident.id}</span>
                          <span className="px-1.5 py-0.5 bg-white text-primary rounded text-[9px] font-extrabold uppercase tracking-widest">
                            {incident.priority}
                          </span>
                        </div>
                        <h4 className="text-base font-bold">{incident.title}</h4>
                        <p className="text-xs text-white/80 mt-1 line-clamp-1">{incident.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-white/90 text-xs">
                          <div className="flex items-center gap-1">
                            <MapPin size={13} />
                            <span className="font-medium">{incident.floor} - {incident.sector}</span>
                          </div>
                          <div className="flex items-center gap-1 font-mono text-[11px] bg-white/10 px-2 py-0.5 rounded">
                            <span className="text-white/70">Inicio:</span>
                            <span>{incident.createdAt}</span>
                          </div>
                          {incident.completedAt && (
                            <div className="flex items-center gap-1 font-mono text-[11px] bg-green-600/40 border border-green-400/30 px-2 py-0.5 rounded text-white font-bold">
                              <span>Fin:</span>
                              <span>{incident.completedAt}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:flex-col md:items-end gap-2 mt-3 md:mt-0">
                      <span className="px-3 py-1 bg-white text-primary rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                        {incident.status}
                      </span>
                      <p className="text-xs text-white/70 font-mono">
                        {incident.assigneeName ? `Asignado: ${incident.assigneeName}` : incident.timestamp}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            }

            // Normal structured list card
            return (
              <motion.div
                layoutId={`incident-card-${incident.id}`}
                key={incident.id}
                onClick={() => setSelectedIncident(incident)}
                className={`group bg-white border border-outline-variant hover:border-primary rounded-xl overflow-hidden shadow-xs transition-all hover:shadow-md cursor-pointer flex flex-col md:flex-row ${
                  isCompleted ? 'opacity-70 hover:opacity-100' : ''
                }`}
              >
                {/* Lateral Accent indicator color bar */}
                <div className={`w-full md:w-2 h-2 md:h-auto ${
                  isCompleted ? 'bg-secondary' : isPending ? 'bg-error' : 'bg-tertiary-container'
                }`} />

                <div className="flex-1 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Circle icon with category representation */}
                    <div className="p-3 bg-surface-container text-primary rounded-lg flex items-center justify-center">
                      <FileText size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono tracking-wider text-on-surface-variant font-medium">{incident.id}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-widest ${
                          incident.priority === 'Alta' ? 'bg-red-100 text-error' : 
                          incident.priority === 'Media' ? 'bg-amber-100 text-tertiary' : 
                          'bg-slate-100 text-on-surface-variant'
                        }`}>
                          {incident.priority}
                        </span>
                        
                        {incident.imageUrl && (
                          <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                            Foto Adjunta
                          </span>
                        )}
                      </div>
                      
                      <h4 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors">
                        {incident.title}
                      </h4>
                      <p className="text-xs text-on-surface-variant line-clamp-1 mt-0.5">{incident.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-on-surface-variant text-xs">
                        <div className="flex items-center gap-1">
                          <MapPin size={13} className="text-outline" />
                          <span className="font-medium">{incident.floor} - {incident.sector}</span>
                        </div>
                        <div className="flex items-center gap-1 font-mono text-[11px] text-on-surface-variant/85 bg-surface-container/60 px-2 py-0.5 rounded">
                          <span className="font-semibold text-on-surface-variant/70">Inicio:</span>
                          <span>{incident.createdAt}</span>
                        </div>
                        {incident.completedAt && (
                          <div className="flex items-center gap-1 font-mono text-[11px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded font-bold">
                            <span className="uppercase text-[9px]">Fin:</span>
                            <span>{incident.completedAt}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right hand side Status Badges and timestamps */}
                  <div className="flex items-center justify-between md:flex-col md:items-end gap-2.5 mt-3 md:mt-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                      isCompleted ? 'bg-green-100 text-green-700' : 
                      isPending ? 'bg-red-50 text-error' : 'bg-amber-50 text-tertiary'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isCompleted ? 'bg-green-700' : isPending ? 'bg-error animate-pulse' : 'bg-tertiary-container'
                      }`} />
                      {incident.status}
                    </span>
                    <p className="text-xs text-on-surface-variant font-mono">
                      {incident.timestamp}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Incident details interactive Modal / Drawer Dialog */}
      <AnimatePresence>
        {selectedIncident && (() => {
          const selectedIncident = activeIncident!;
          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Modal Body */}
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-outline-variant flex items-center justify-between bg-surface-container">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-primary">{selectedIncident.id}</span>
                  <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold">
                    {selectedIncident.category}
                  </span>
                </div>
                <button 
                  onClick={handleCloseModal}
                  className="p-1.5 rounded-full hover:bg-surface-container-high text-outline hover:text-on-surface transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content Body */}
              <div className="p-6 overflow-y-auto space-y-5">
                <div>
                  <h3 className="text-lg font-bold text-on-surface tracking-tight">{selectedIncident.title}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-on-surface-variant mt-1.5">
                    <MapPin size={13} className="text-outline" />
                    <span className="font-medium">{selectedIncident.floor} &bull; {selectedIncident.sector}</span>
                  </div>
                </div>

                {/* Main Image Evidence Preview if present */}
                {selectedIncident.imageUrl && (
                  <div className="border border-outline-variant rounded-lg overflow-hidden bg-surface-container-low max-h-48 flex justify-center">
                    <img 
                      src={selectedIncident.imageUrl} 
                      alt="Evidencia fotográfica" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Technical description */}
                <div className="space-y-1 bg-surface-container-low p-4 rounded-lg border border-outline-variant">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Descripción del Reporte</span>
                  <p className="text-sm text-on-surface leading-relaxed">{selectedIncident.description}</p>
                </div>

                {/* Registro de Tiempos (Start and End date) */}
                <div className="space-y-2 bg-slate-50/80 p-4 rounded-lg border border-outline-variant">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Registro de Tiempos</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-outline uppercase">Fecha de Reporte / Inicio</span>
                      <span className="text-xs font-mono text-on-surface font-semibold mt-1 bg-white border border-outline-variant px-2.5 py-1.5 rounded flex items-center gap-1.5 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        {selectedIncident.createdAt}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold text-outline uppercase">Fecha de Finalización</span>
                      {selectedIncident.completedAt ? (
                        <span className="text-xs font-mono text-green-800 font-bold mt-1 bg-green-50 border border-green-200 px-2.5 py-1.5 rounded flex items-center gap-1.5 shadow-2xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"></span>
                          {selectedIncident.completedAt}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-on-surface-variant italic mt-1 bg-white border border-dashed border-outline-variant px-2.5 py-1.5 rounded block">
                          Pendiente de resolución
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Assigned Person */}
                <div className="flex items-center justify-between border-b border-surface-container pb-4">
                  <div className="text-xs font-semibold text-on-surface-variant">TÉCNICO ENCARGADO</div>
                  <div className="flex items-center gap-2">
                    {selectedIncident.assigneeAvatar ? (
                      <img 
                        src={selectedIncident.assigneeAvatar} 
                        alt="Asignado" 
                        className="w-6 h-6 rounded-full object-cover border border-outline-variant"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center text-outline text-xs border border-outline-variant">
                        <User size={12} />
                      </div>
                    )}
                    <span className="text-sm font-medium text-on-surface">
                      {selectedIncident.assigneeName || 'Sin asignar - Equipo General'}
                    </span>
                  </div>
                </div>

                {/* Reporter details for admins */}
                {userProfile?.isAdmin && (
                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline/20 space-y-2">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">Usuario que cargó la incidencia</span>
                    {selectedIncident.reportedBy ? (
                      <div className="space-y-1 text-xs">
                        <p className="text-on-surface font-semibold">Nombre: <span className="font-normal text-on-surface-variant">{selectedIncident.reportedBy.name}</span></p>
                        <p className="text-on-surface font-semibold">Oficina: <span className="font-normal text-on-surface-variant">{selectedIncident.reportedBy.office}</span></p>
                        <p className="text-on-surface font-semibold">Contacto: <span className="font-normal text-on-surface-variant">{selectedIncident.reportedBy.phone} &bull; {selectedIncident.reportedBy.email}</span></p>
                      </div>
                    ) : (
                      <p className="text-xs text-on-surface-variant italic">Reportado de forma automática por el Sistema de Monitoreo General</p>
                    )}
                  </div>
                )}

                {/* Resolution Details Display / Inputs */}
                {(selectedIncident.cost || selectedIncident.actionsTaken || userProfile?.isAdmin) && (
                  <div className="p-4 bg-slate-50 border border-outline-variant rounded-xl space-y-3">
                    <span className="text-[10px] font-bold text-[#7a172c] uppercase tracking-wider block">Resolución de Incidencia</span>
                    
                    {userProfile?.isAdmin ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-on-surface-variant block mb-1">
                            Costo o Monto de Reparación (ARS)
                          </label>
                          <input 
                            type="number"
                            value={selectedIncident.cost !== undefined ? selectedIncident.cost : ''}
                            onChange={(e) => {
                              const val = e.target.value ? parseFloat(e.target.value) : undefined;
                              onUpdateIncidentStatus(selectedIncident.id, selectedIncident.status, val, selectedIncident.actionsTaken);
                              setSelectedIncident({ ...selectedIncident, cost: val });
                            }}
                            placeholder="Ej. 12500"
                            className="w-full px-3 py-1.5 bg-white border border-outline-variant rounded-lg text-xs focus:ring-1 focus:ring-primary focus:outline-none text-on-surface font-medium"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-on-surface-variant block mb-1">
                            Detalle de qué se hizo / Acciones tomadas
                          </label>
                          <textarea 
                            rows={2}
                            value={selectedIncident.actionsTaken || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              onUpdateIncidentStatus(selectedIncident.id, selectedIncident.status, selectedIncident.cost, val);
                              setSelectedIncident({ ...selectedIncident, actionsTaken: val });
                            }}
                            placeholder="Ej. Se lubricó el picaporte y se cambió el cilindro de la cerradura."
                            className="w-full px-3 py-1.5 bg-white border border-outline-variant rounded-lg text-xs focus:ring-1 focus:ring-primary focus:outline-none resize-none text-on-surface font-medium"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5 text-xs">
                        {selectedIncident.actionsTaken && (
                          <p className="text-on-surface leading-relaxed">
                            <strong className="text-on-surface-variant font-bold">Trabajo realizado:</strong> {selectedIncident.actionsTaken}
                          </p>
                        )}
                        {selectedIncident.cost !== undefined && (
                          <p className="text-on-surface">
                            <strong className="text-on-surface-variant font-bold">Costo de resolución:</strong> ${selectedIncident.cost.toLocaleString('es-AR')} ARS
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Edit Controls Row */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                    Actualizar Estado {!userProfile?.isAdmin && <span className="text-red-500 font-normal text-[10px] lowercase italic">(requiere rol de administrador)</span>}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Pendiente', 'En Proceso', 'Completada'] as StatusType[]).map((st) => {
                      const isActive = selectedIncident.status === st;
                      const disabled = !userProfile?.isAdmin;
                      return (
                        <button
                          key={st}
                          disabled={disabled}
                          onClick={() => {
                            if (!disabled) {
                              onUpdateIncidentStatus(selectedIncident.id, st);
                              setSelectedIncident({ ...selectedIncident, status: st });
                            }
                          }}
                          className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                            isActive 
                              ? 'bg-primary border-primary text-white shadow-xs' 
                              : 'bg-white border-outline-variant text-on-surface hover:bg-surface-container-low'
                          } ${disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {st}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">
                    Prioridad Urgencia {!userProfile?.isAdmin && <span className="text-red-500 font-normal text-[10px] lowercase italic">(requiere rol de administrador)</span>}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['Baja', 'Media', 'Alta', 'Crítica'] as PriorityType[]).map((pr) => {
                      const isActive = selectedIncident.priority === pr;
                      const disabled = !userProfile?.isAdmin;
                      return (
                        <button
                          key={pr}
                          disabled={disabled}
                          onClick={() => {
                            if (!disabled) {
                              onUpdateIncidentPriority(selectedIncident.id, pr);
                              setSelectedIncident({ ...selectedIncident, priority: pr });
                            }
                          }}
                          className={`py-2 px-1 text-center rounded-lg text-xs font-bold border transition-all ${
                            isActive 
                              ? 'bg-primary-container border-primary-container text-white shadow-xs' 
                              : 'bg-white border-outline-variant text-on-surface hover:bg-surface-container-low'
                          } ${disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {pr}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {!userProfile?.isAdmin && (
                  <div className="p-3 bg-red-50 border border-red-200/50 rounded-xl text-[10px] text-red-800 leading-relaxed">
                    ⚠️ <strong>Información de Permisos:</strong> Usted está registrado como Personal de Oficina. Puede reportar nuevas incidencias pero no posee los privilegios administrativos para modificar sus estados, prioridades o eliminarlas.
                  </div>
                )}
              </div>

              {/* Footer Controls */}
              <div className="px-6 py-4 bg-surface-container border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-4">
                {showDeleteConfirm ? (
                  <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in">
                    <p className="text-xs font-semibold text-error text-left">
                      ¿Seguro de eliminar este reporte permanentemente?
                    </p>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 sm:flex-none px-3 py-1.5 border border-outline-variant hover:bg-white text-on-surface-variant text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteIncident(selectedIncident.id);
                          handleCloseModal();
                        }}
                        className="flex-1 sm:flex-none px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-3xs"
                      >
                        Sí, Eliminar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {userProfile?.isAdmin ? (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="text-error hover:bg-red-50 p-2 rounded-lg transition-colors inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                      >
                        <Trash2 size={15} />
                        <span>Eliminar Reporte</span>
                      </button>
                    ) : (
                      <div className="text-xs text-on-surface-variant/80 italic font-medium">Vista de lectura</div>
                    )}
                    <button
                      onClick={handleCloseModal}
                      className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                    >
                      Cerrar Detalle
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}
