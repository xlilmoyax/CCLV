import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  Image as ImageIcon, 
  CheckCircle, 
  X, 
  Trash2, 
  FileText, 
  HelpCircle,
  MapPin,
  Flame,
  AlertTriangle,
  Send
} from 'lucide-react';
import { Incident, PriorityType, StatusType } from '../types';
import { FLOORS, CATEGORIES, SECTOR_MAP } from '../data';

interface NewIncidentViewProps {
  onAddIncident: (incident: Omit<Incident, 'id' | 'timestamp' | 'createdAt' | 'completedAt'>) => Promise<void>;
  onCancel: () => void;
}

export default function NewIncidentView({
  onAddIncident,
  onCancel
}: NewIncidentViewProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [category, setCategory] = useState('');
  const [floor, setFloor] = useState('Planta Baja');
  const [sector, setSector] = useState('Auditorio Principal');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<PriorityType>('Media');
  const [description, setDescription] = useState('');
  
  // Photo states
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string; url: string } | null>(null);

  // Automatically update sectors when floor changes
  useEffect(() => {
    const sectors = SECTOR_MAP[floor] || [];
    if (sectors.length > 0) {
      setSector(sectors[0]);
    }
  }, [floor]);

  // Handle default mock file loading to make test submission beautiful
  const handleAttachMockImage = () => {
    setAttachedFile({
      name: 'evidencia_daño_01.jpg',
      size: '2.4 MB',
      url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAp7fTxs43yx3hxP2Zi-PKlAbzfR98n5MmCXxDa8ZPgbLyI15FgRClAyy_VkPEoQgUtU36fTeVwbj4NaE69HWnIBCQpD-tpNFLCvViz5jwLO33ZC1F2zqphXV0XrxQ9iUvyeRljFfhG_oIVU8ofnxuhcDcO8nCSwixFJtPpbo7NFZdzakw8AasdIQWDr8IpVRh3rh0X_J_1DuX7UFurxydM_GiVU1GvnOWBAg1AwZDp8C54NxhdDQJ8IkDBjFc18PRCtfnWsqrSJpQ'
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setAttachedFile({
        name: file.name,
        size: `${sizeMB} MB`,
        url: url
      });
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!category) {
        alert('Por favor, selecciona una categoría para el reporte.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!title.trim()) {
        alert('Por favor, escribe un título o concepto de la falla.');
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddIncident({
        title,
        description: description || 'No se proporcionó descripción detallada.',
        category,
        floor,
        sector,
        priority,
        status: 'Pendiente',
        imageUrl: attachedFile?.url || undefined
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error al guardar la incidencia:', error);
      alert('No se pudo guardar la incidencia. Verifique la conexión con el sistema e intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get progress bar width
  const getProgressWidth = () => {
    if (currentStep === 1) return 'w-1/3';
    if (currentStep === 2) return 'w-2/3';
    return 'w-full';
  };

  return (
    <div className="max-w-2xl mx-auto" id="new-incident-wizard-flow">
      
      {/* Header bar */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onCancel}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-primary cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-on-surface">Nueva Incidencia</h2>
          <p className="text-xs text-on-surface-variant font-medium">Paso {currentStep} de 3</p>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="mb-8 w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
        <div className={`bg-primary h-full transition-all duration-500 ease-in-out ${getProgressWidth()}`} />
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm space-y-6">
        
        {/* STEP 1: Ubicación y Categoría */}
        {currentStep === 1 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
            id="report-step-1"
          >
            <div>
              <h3 className="text-lg font-bold text-on-surface">Ubicación y Categoría</h3>
              <p className="text-xs text-on-surface-variant mt-1">Define dónde y de qué tipo es el problema técnico.</p>
            </div>

            {/* Categoría Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Categoría de Falla</label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 bg-white border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                  id="category-selector-input"
                >
                  <option value="">Seleccionar categoría...</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
                  <FileText size={18} />
                </div>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-outline">&#9662;</span>
              </div>
            </div>

            {/* Piso y Sector Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Piso */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Piso / Nivel</label>
                <select
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  className="w-full h-12 px-4 bg-white border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  id="floor-selector-input"
                >
                  {FLOORS.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              {/* Sector Contextual */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Sector Específico</label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full h-12 px-4 bg-white border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                  id="sector-selector-input"
                >
                  {(SECTOR_MAP[floor] || []).map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-6 border-t border-surface-container flex justify-end">
              <button
                type="button"
                onClick={handleNextStep}
                className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                id="btn-advance-to-step2"
              >
                <span>Siguiente</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Detalles y Prioridad */}
        {currentStep === 2 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
            id="report-step-2"
          >
            <div>
              <h3 className="text-lg font-bold text-on-surface">Detalles del Reporte</h3>
              <p className="text-xs text-on-surface-variant mt-1">Describe la situación y asigna una urgencia.</p>
            </div>

            {/* Concept / Title */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Concepto / Título Corto</label>
              <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Falla en luminaria pasillo norte"
                className="w-full h-12 px-4 bg-white border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                id="title-input-field"
              />
            </div>

            {/* Priority grid cards */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Nivel de Prioridad</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([
                  { level: 'Baja', color: 'border-teal-500 bg-teal-50 text-teal-800' },
                  { level: 'Media', color: 'border-amber-500 bg-amber-50 text-amber-800' },
                  { level: 'Alta', color: 'border-red-500 bg-red-50 text-error' },
                  { level: 'Crítica', color: 'border-indigo-600 bg-indigo-50 text-indigo-900' }
                ] as { level: PriorityType; color: string }[]).map((pObj) => {
                  const isSelected = priority === pObj.level;
                  return (
                    <button
                      key={pObj.level}
                      type="button"
                      onClick={() => setPriority(pObj.level)}
                      className={`p-3.5 border rounded-lg flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                        isSelected 
                          ? `${pObj.color} border-2 ring-2 ring-offset-1 ring-primary-container` 
                          : 'border-outline-variant bg-white text-on-surface hover:bg-surface-container-low'
                      }`}
                    >
                      <span className="text-xs font-bold">{pObj.level}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description Detailed Textarea */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block">Descripción detallada</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Proporciona detalles adicionales que ayuden al técnico encargado a diagnosticar rápido..."
                rows={4}
                className="w-full p-4 bg-white border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                id="description-input-field"
              />
            </div>

            {/* Navigation buttons */}
            <div className="pt-6 border-t border-surface-container flex justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-5 py-3 border border-outline-variant hover:bg-surface-container-low rounded-lg text-sm font-semibold text-on-surface transition-all cursor-pointer"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-all"
                id="btn-advance-to-step3"
              >
                <span>Siguiente</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: Evidencia Fotográfica */}
        {currentStep === 3 && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
            id="report-step-3"
          >
            <div>
              <h3 className="text-lg font-bold text-on-surface">Evidencia Fotográfica</h3>
              <p className="text-xs text-on-surface-variant mt-1">Adjunta una o más fotografías para documentar el estado actual.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Box Uploader */}
              <div className="relative aspect-square bg-surface-container border-2 border-dashed border-outline-variant hover:border-primary rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer group transition-colors">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  id="file-upload-input"
                />
                
                <Upload className="text-outline group-hover:text-primary transition-colors mb-3" size={32} />
                <span className="text-xs font-bold text-on-surface-variant group-hover:text-primary block">
                  Adjuntar fotografía desde el dispositivo
                </span>
                <p className="text-[10px] text-outline mt-1 px-4">Soporta JPG, PNG de hasta 10MB</p>

                {/* Quick test sample loader */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAttachMockImage();
                  }}
                  className="mt-4 text-[10px] bg-primary-container text-white px-3 py-1.5 rounded-full font-bold hover:bg-primary transition-colors z-10"
                >
                  Cargar foto de muestra institucional
                </button>
              </div>

              {/* Display attached preview */}
              <div className="space-y-4">
                {attachedFile ? (
                  <div className="p-4 bg-white border border-outline-variant rounded-lg space-y-3 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded bg-surface-container overflow-hidden flex-shrink-0">
                        <img 
                          src={attachedFile.url} 
                          alt="Evidencia" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-on-surface truncate">{attachedFile.name}</p>
                        <p className="text-[11px] text-on-surface-variant">{attachedFile.size}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachedFile(null)}
                        className="text-error hover:bg-red-50 p-2 rounded-full transition-colors cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="bg-green-50 p-3 rounded text-green-800 text-[11px] font-medium flex items-center gap-1.5 border border-green-100">
                      <CheckCircle size={14} className="text-green-700" />
                      <span>Fotografía cargada correctamente.</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-surface-container p-4 rounded-lg border border-outline-variant text-center py-10">
                    <ImageIcon className="mx-auto text-outline mb-2" size={24} />
                    <p className="text-xs text-on-surface-variant">Sin fotografía adjunta actualmente.</p>
                  </div>
                )}

                <div className="p-4 bg-surface-container-low rounded-lg border border-primary/15">
                  <p className="text-xs text-primary font-medium italic leading-relaxed">
                    Tip: Asegúrate de que la imagen sea nítida y tenga buena iluminación para agilizar el diagnóstico técnico.
                  </p>
                </div>
              </div>
            </div>

            {/* Nav controls */}
            <div className="pt-6 border-t border-surface-container flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-5 py-3 border border-outline-variant hover:bg-surface-container-low rounded-lg text-sm font-semibold text-on-surface transition-all cursor-pointer"
              >
                Anterior
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary-hover disabled:opacity-60 disabled:cursor-wait text-white px-8 py-3 rounded-lg text-sm font-semibold inline-flex items-center gap-2 cursor-pointer transition-all shadow-sm"
                id="btn-submit-incident"
              >
                <Send size={16} />
                <span>{isSubmitting ? 'Guardando...' : 'Enviar Reporte'}</span>
              </button>
            </div>
          </motion.div>
        )}

      </form>

      {/* Success Modal Popup */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="relative bg-white w-full max-w-md p-8 rounded-xl shadow-2xl flex flex-col items-center text-center"
              id="success-reporting-dialog"
            >
              <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mb-5 border border-green-200 shadow-xs">
                <CheckCircle size={36} />
              </div>

              <h3 className="text-lg font-extrabold text-on-surface">¡Reporte Enviado!</h3>
              <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                La incidencia ha sido registrada exitosamente en el sistema de la institución. Se ha notificado al equipo técnico correspondiente para su pronta revisión.
              </p>

              <div className="w-full mt-6 space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessModal(false);
                    onCancel(); // Goes back to view list
                  }}
                  className="w-full bg-primary hover:bg-primary-hover text-white py-3 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                  id="btn-success-view-reports"
                >
                  Ver Mis Reportes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessModal(false);
                    onCancel(); // Back to main
                  }}
                  className="w-full border border-outline-variant text-on-surface hover:bg-surface-container py-3 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
