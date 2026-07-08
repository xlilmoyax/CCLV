import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  FileText, 
  Home, 
  MessageSquare, 
  Edit3, 
  LogOut, 
  Save, 
  CheckCircle2, 
  Send,
  ArrowLeft,
  Trash2,
  AlertTriangle,
  LayoutDashboard,
  CalendarRange,
  UserCheck,
  MoreHorizontal,
  Sparkles
} from 'lucide-react';
import { UserProfile } from '../types';

interface NavigationMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  onSaveProfile: (profile: UserProfile | null) => void;
  onNavigateToTab: (tab: string) => void;
  onAddActivityLog: (title: string, description: string, statusText: string) => void;
  pendingWorkersCount: number;
  activeTab: string;
}

export default function NavigationMenuDrawer({
  isOpen,
  onClose,
  userProfile,
  onSaveProfile,
  onNavigateToTab,
  onAddActivityLog,
  pendingWorkersCount,
  activeTab
}: NavigationMenuDrawerProps) {
  
  // Tabs: 'menu', 'perfil' (which resolves to profile info or register) or 'contacto'
  const [activeMenuTab, setActiveMenuTab] = useState<'menu' | 'perfil' | 'contacto'>('menu');
  const [isEditing, setIsEditing] = useState(false);
  const [showSessionExitView, setShowSessionExitView] = useState(false);

  // Registration & Edit Form State
  const [formName, setFormName] = useState(userProfile?.name || '');
  const [formDocument, setFormDocument] = useState(userProfile?.document || '');
  const [formPhone, setFormPhone] = useState(userProfile?.phone || '');
  const [formEmail, setFormEmail] = useState(userProfile?.email || '');
  const [formOffice, setFormOffice] = useState<UserProfile['office']>(userProfile?.office || 'Misiones');

  // Contact Form State
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);

  // Handle Init Form when switching to Edit or Register
  const handleOpenEdit = () => {
    if (userProfile) {
      setFormName(userProfile.name);
      setFormDocument(userProfile.document);
      setFormPhone(userProfile.phone);
      setFormEmail(userProfile.email);
      setFormOffice(userProfile.office);
    }
    setIsEditing(true);
  };

  // Form Validation and submission
  const handleRegisterOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDocument.trim() || !formPhone.trim() || !formEmail.trim()) {
      alert('Por favor complete todos los campos.');
      return;
    }

    const updatedProfile: UserProfile = {
      name: formName,
      document: formDocument,
      phone: formPhone,
      email: formEmail,
      office: formOffice
    };

    onSaveProfile(updatedProfile);
    setIsEditing(false);

    if (userProfile) {
      // Profile update
      onAddActivityLog(
        'Perfil Actualizado',
        `El usuario ${formName} actualizó sus datos de contacto.`,
        'Info'
      );
    } else {
      // New Registration
      onAddActivityLog(
        'Nuevo Registro',
        `${formName} se ha registrado en la oficina ${formOffice}.`,
        'Registro'
      );
    }
  };

  const executeLogoutOnly = () => {
    onSaveProfile(null);
    setIsEditing(false);
    setShowSessionExitView(false);
    onAddActivityLog(
      'Sesión Cerrada',
      'El usuario cerró su sesión de forma temporal.',
      'Sesión'
    );
  };

  const executeDeleteProfile = () => {
    onSaveProfile(null);
    setIsEditing(false);
    setShowSessionExitView(false);
    // Clear local states
    setFormName('');
    setFormDocument('');
    setFormPhone('');
    setFormEmail('');
    setFormOffice('Misiones');
    onAddActivityLog(
      'Perfil Eliminado',
      'Se eliminaron permanentemente todos los datos del perfil de este dispositivo.',
      'Eliminación'
    );
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactSubject.trim() || !contactMessage.trim()) {
      alert('Por favor complete el asunto y mensaje.');
      return;
    }

    // Success simulation
    setContactSuccess(true);
    onAddActivityLog(
      'Consulta de Soporte',
      `Asunto: ${contactSubject}. Mensaje enviado por ${userProfile?.name || 'Usuario Anónimo'}.`,
      'Contacto'
    );

    setTimeout(() => {
      setContactSubject('');
      setContactMessage('');
      setContactSuccess(false);
    }, 4000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black"
      />

      {/* Slideout Container */}
      <div className="absolute inset-y-0 right-0 max-w-full flex">
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-primary text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User size={20} />
              <h2 className="font-extrabold text-sm tracking-wide uppercase">Menú de Navegación</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Main vertical stacked navigation */}
          {activeMenuTab === 'menu' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {userProfile?.isAdmin && (
                <div>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-2.5">
                    Secciones del Aplicativo
                  </span>
                  <div className="flex flex-col space-y-2">
                    <button
                      onClick={() => {
                        onNavigateToTab('aprobaciones');
                        onClose();
                      }}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl text-xs font-bold transition-all border cursor-pointer text-left ${
                        activeTab === 'aprobaciones'
                          ? 'bg-primary-container/10 text-primary border-primary shadow-2xs'
                          : 'bg-white hover:bg-slate-50 text-on-surface border-outline-variant hover:border-outline shadow-3xs'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <UserCheck size={18} className={activeTab === 'aprobaciones' ? 'text-primary' : 'text-indigo-600'} />
                        <span>Personal</span>
                      </div>
                      {pendingWorkersCount > 0 ? (
                        <span className="px-2 py-0.5 bg-red-600 text-white rounded-full text-[9px] font-bold animate-pulse">
                          {pendingWorkersCount} pendientes
                        </span>
                      ) : (
                        <span className="text-[10px] text-outline font-medium">Gestión de personal</span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <div className={userProfile?.isAdmin ? "border-t border-outline-variant/60 pt-5" : ""}>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-2.5">
                  Mi Cuenta y Soporte
                </span>
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => setActiveMenuTab('perfil')}
                    className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 text-on-surface border border-outline-variant hover:border-outline rounded-xl text-xs font-bold transition-all shadow-3xs cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <User size={18} className="text-slate-600" />
                      <span>Mi Perfil</span>
                    </div>
                    <span className="text-[10px] text-outline font-medium">Registrar o editar datos</span>
                  </button>

                  <button
                    onClick={() => setActiveMenuTab('contacto')}
                    className="w-full flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 text-on-surface border border-outline-variant hover:border-outline rounded-xl text-xs font-bold transition-all shadow-3xs cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare size={18} className="text-slate-600" />
                      <span>Contacto</span>
                    </div>
                    <span className="text-[10px] text-outline font-medium">Soporte y consultas</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content Wrapper */}
          {activeMenuTab !== 'menu' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {activeMenuTab === 'perfil' && (
              <div className="space-y-6">
                <button
                  onClick={() => setActiveMenuTab('menu')}
                  className="flex items-center gap-2 text-primary hover:text-primary-hover font-bold text-xs cursor-pointer mb-2 bg-slate-50 hover:bg-slate-100 py-1.5 px-3 rounded-lg border border-outline-variant transition-all inline-flex"
                >
                  <ArrowLeft size={14} />
                  <span>Volver al Menú</span>
                </button>
                
                {showSessionExitView ? (
                  <div className="space-y-6">
                    {/* Header with back button */}
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setShowSessionExitView(false)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-on-surface-variant transition-all cursor-pointer"
                        title="Volver"
                      >
                        <ArrowLeft size={16} />
                      </button>
                      <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">Gestión de Cuenta</h3>
                    </div>

                    <div className="p-4 bg-amber-50/70 border border-amber-200/50 rounded-2xl flex gap-3">
                      <AlertTriangle size={20} className="text-amber-600 shrink-0" />
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-amber-800">¿Qué desea realizar?</h4>
                        <p className="text-[10px] text-amber-700/90 leading-relaxed">
                          Por favor, seleccione una de las opciones para gestionar su sesión o eliminar definitivamente su perfil de este dispositivo.
                        </p>
                      </div>
                    </div>

                    {/* Options Cards */}
                    <div className="space-y-4">
                      
                      {/* Option 1: Logout */}
                      <div className="p-4 bg-white border border-outline-variant hover:border-primary/40 rounded-2xl transition-all shadow-2xs space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                            <LogOut size={18} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-on-surface">Cerrar Sesión Temporalmente</h4>
                            <p className="text-[10px] text-on-surface-variant/80 mt-1 leading-relaxed">
                              Cierra la sesión activa en este momento. Sus datos permanecerán disponibles localmente para cuando decida volver a ingresar con este mismo navegador.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={executeLogoutOnly}
                          className="w-full py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <LogOut size={14} />
                          <span>Confirmar Cerrar Sesión</span>
                        </button>
                      </div>

                      {/* Option 2: Delete Profile */}
                      <div className="p-4 bg-white border border-outline-variant hover:border-error/40 rounded-2xl transition-all shadow-2xs space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 bg-red-50 text-error rounded-xl">
                            <Trash2 size={18} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-on-surface">Eliminar Perfil por Completo</h4>
                            <p className="text-[10px] text-on-surface-variant/80 mt-1 leading-relaxed">
                              Borra de manera definitiva todos sus datos (nombre, celular, correo, oficina) guardados en la memoria local de este navegador.
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={executeDeleteProfile}
                          className="w-full py-2 px-4 bg-error hover:bg-error-hover text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Trash2 size={14} />
                          <span>Eliminar Perfil Definitivamente</span>
                        </button>
                      </div>

                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => setShowSessionExitView(false)}
                        className="w-full py-2.5 border border-outline-variant text-on-surface-variant hover:bg-slate-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Cancelar y Volver al Perfil
                      </button>
                    </div>

                  </div>
                ) : userProfile && !isEditing ? (
                  <div className="space-y-6">
                    <div className="flex flex-col items-center p-6 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl relative overflow-hidden">
                      <div className="absolute top-2 right-2 px-2.5 py-1 bg-primary/15 text-primary text-[10px] font-extrabold uppercase rounded-full tracking-wider">
                        Registrado
                      </div>
                      
                      <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-xl font-bold uppercase shadow-md mb-3 border-2 border-white">
                        {userProfile.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      
                      <h3 className="text-base font-bold text-on-surface text-center leading-tight">
                        {userProfile.name}
                      </h3>
                      <p className="text-xs text-on-surface-variant/80 mt-1 font-mono">
                        Doc: {userProfile.document}
                      </p>
                    </div>

                    {/* Information Grid */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Datos del Usuario</span>
                      
                      <div className="flex items-center gap-3 p-3 bg-slate-50 border border-outline-variant rounded-xl">
                        <div className="p-2 bg-white rounded-lg border border-outline-variant text-primary">
                          <Mail size={15} />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-[10px] font-semibold text-outline uppercase tracking-wider">Correo Electrónico</p>
                          <p className="text-xs font-mono font-bold text-on-surface truncate">{userProfile.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-slate-50 border border-outline-variant rounded-xl">
                        <div className="p-2 bg-white rounded-lg border border-outline-variant text-primary">
                          <Building2 size={15} />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-semibold text-outline uppercase tracking-wider">Oficina de Trabajo</p>
                          <p className="text-xs font-bold text-on-surface">{userProfile.office}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-3 bg-slate-50 border border-outline-variant rounded-xl">
                        <div className="p-2 bg-white rounded-lg border border-outline-variant text-primary">
                          <Phone size={15} />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-semibold text-outline uppercase tracking-wider">Número de Celular</p>
                          <p className="text-xs font-mono font-bold text-on-surface">{userProfile.phone}</p>
                        </div>
                      </div>
                    </div>

                    {/* Edit Buttons */}
                    <div className="pt-4 space-y-2.5">
                      <button
                        onClick={handleOpenEdit}
                        className="w-full bg-primary hover:bg-primary-hover text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-colors shadow-xs cursor-pointer"
                      >
                        <Edit3 size={15} />
                        <span>Editar Perfil y Datos</span>
                      </button>

                      <button
                        onClick={() => setShowSessionExitView(true)}
                        className="w-full border border-red-200 text-error hover:bg-red-50 py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 font-bold text-[11px] transition-all cursor-pointer"
                      >
                        <LogOut size={13} />
                        <span>Cerrar Sesión / Borrar Perfil</span>
                      </button>
                    </div>

                  </div>
                ) : isEditing && userProfile ? (
                  
                  // 2. PROFILE EDIT MODE
                  <form onSubmit={handleRegisterOrUpdate} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-on-surface">Editar mis Datos</h3>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="text-xs font-bold text-primary hover:underline cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>

                    <div className="space-y-3.5">
                      <div>
                        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Nombre y Apellido</label>
                        <input
                          type="text"
                          value={formName}
                          onChange={e => setFormName(e.target.value)}
                          className="w-full bg-white border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 text-xs font-semibold"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Documento de Identidad</label>
                        <input
                          type="text"
                          value={formDocument}
                          onChange={e => setFormDocument(e.target.value)}
                          className="w-full bg-white border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 text-xs font-semibold"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Número de Celular</label>
                        <input
                          type="tel"
                          value={formPhone}
                          onChange={e => setFormPhone(e.target.value)}
                          className="w-full bg-white border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 text-xs font-semibold"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Correo Electrónico</label>
                        <input
                          type="email"
                          value={formEmail}
                          onChange={e => setFormEmail(e.target.value)}
                          className="w-full bg-white border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 text-xs font-semibold"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Oficina / Área de Trabajo</label>
                        <select
                          value={formOffice}
                          onChange={e => setFormOffice(e.target.value as any)}
                          className="w-full bg-white border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 text-xs font-semibold"
                        >
                          {userProfile?.isAdmin ? (
                            <>
                              <option value="Mantenimiento">Mantenimiento</option>
                              <option value="Administración">Administración</option>
                            </>
                          ) : (
                            <>
                              <option value="Misiones">Misiones</option>
                              <option value="Kinectika">Kinectika</option>
                              <option value="Jóvenes">Jóvenes</option>
                              <option value="Administración">Administración</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary-hover text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-colors shadow-xs cursor-pointer"
                      >
                        <Save size={15} />
                        <span>Guardar Cambios</span>
                      </button>
                    </div>
                  </form>

                ) : (
                  
                  // 3. REGISTRATION / LOGIN MODE (IF NO PROFILE EXISTS)
                  <form onSubmit={handleRegisterOrUpdate} className="space-y-4">
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 space-y-1">
                      <h4 className="text-xs font-bold">Registro Obligatorio</h4>
                      <p className="text-[10px] leading-relaxed">
                        Para poder interactuar con las opciones de perfil e inicio, debe registrar sus datos como técnico o especialista encargado del complejo.
                      </p>
                    </div>

                    <div className="space-y-3.5">
                      <div>
                        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Nombre y Apellido</label>
                        <input
                          type="text"
                          placeholder="Ej. Juan Pérez"
                          value={formName}
                          onChange={e => setFormName(e.target.value)}
                          className="w-full bg-white border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 text-xs font-semibold"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Documento de Identidad</label>
                        <input
                          type="text"
                          placeholder="Ej. DNI / Pasaporte"
                          value={formDocument}
                          onChange={e => setFormDocument(e.target.value)}
                          className="w-full bg-white border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 text-xs font-semibold"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Número de Celular</label>
                        <input
                          type="tel"
                          placeholder="Ej. +54 9 11 1234-5678"
                          value={formPhone}
                          onChange={e => setFormPhone(e.target.value)}
                          className="w-full bg-white border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 text-xs font-semibold"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Correo Electrónico</label>
                        <input
                          type="email"
                          placeholder="Ej. tu@correo.com"
                          value={formEmail}
                          onChange={e => setFormEmail(e.target.value)}
                          className="w-full bg-white border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 text-xs font-semibold"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Oficina de Trabajo</label>
                        <select
                          value={formOffice}
                          onChange={e => setFormOffice(e.target.value as UserProfile['office'])}
                          className="w-full bg-white border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 text-xs font-semibold"
                        >
                          <option value="Misiones">Misiones</option>
                          <option value="Kinectika">Kinectika</option>
                          <option value="Jóvenes">Jóvenes</option>
                          <option value="Administración">Administración</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary-hover text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-colors shadow-xs cursor-pointer"
                      >
                        <User size={15} />
                        <span>Crear Perfil / Registrarse</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {activeMenuTab === 'contacto' && (
              <div className="space-y-6">
                <button
                  onClick={() => setActiveMenuTab('menu')}
                  className="flex items-center gap-2 text-primary hover:text-primary-hover font-bold text-xs cursor-pointer mb-2 bg-slate-50 hover:bg-slate-100 py-1.5 px-3 rounded-lg border border-outline-variant transition-all inline-flex"
                >
                  <ArrowLeft size={14} />
                  <span>Volver al Menú</span>
                </button>

                {/* AI Assistant Banner Shortcut */}
                <div className="p-4 bg-gradient-to-r from-pink-500/10 to-violet-500/10 border border-violet-500/20 rounded-2xl flex flex-col gap-3">
                  <div className="flex gap-2.5 items-start">
                    <div className="p-2 bg-white rounded-xl text-violet-600 shadow-2xs">
                      <Sparkles size={18} className="animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-violet-950">¡Hola! Soy Eddie, tu asistente IA</h4>
                      <p className="text-[10px] text-violet-900/80 leading-relaxed mt-0.5">
                        Consulte los pasos para reportar fallas, sectores habilitados, incidencias pendientes o resueltas de forma instantánea.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onNavigateToTab('soporte');
                      onClose();
                    }}
                    className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <span>Preguntarle a Eddie (Soporte IA)</span>
                    <Sparkles size={12} />
                  </button>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <h4 className="text-xs font-bold text-blue-800">Soporte Técnico y Consultas</h4>
                  <p className="text-[10px] text-blue-700/90 leading-relaxed mt-1">
                    ¿Tiene dudas con el funcionamiento de la plataforma o necesita reportar un problema de red? Comuníquese directamente con nuestro equipo.
                  </p>
                </div>

                {contactSuccess ? (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-6 bg-green-50 border border-green-200 text-green-800 text-center rounded-2xl space-y-2"
                  >
                    <CheckCircle2 size={36} className="text-green-600 mx-auto" />
                    <h4 className="text-xs font-bold">¡Mensaje Enviado!</h4>
                    <p className="text-[10px] leading-relaxed">
                      Su solicitud ha sido registrada en la base de actividades del sistema. Nos pondremos en contacto a la brevedad.
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Asunto / Motivo</label>
                      <input
                        type="text"
                        placeholder="Ej. Problema con sincronización de tareas"
                        value={contactSubject}
                        onChange={e => setContactSubject(e.target.value)}
                        className="w-full bg-white border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 text-xs font-semibold"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Detalle de la consulta</label>
                      <textarea
                        rows={4}
                        placeholder="Escriba aquí los detalles..."
                        value={contactMessage}
                        onChange={e => setContactMessage(e.target.value)}
                        className="w-full bg-white border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3 py-2 text-xs font-semibold"
                        required
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary-hover text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-xs transition-colors shadow-xs cursor-pointer"
                      >
                        <Send size={14} />
                        <span>Enviar Mensaje</span>
                      </button>
                    </div>
                  </form>
                )}

                <div className="pt-4 border-t border-surface-container space-y-3">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Canales Directos</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 border border-outline-variant rounded-xl">
                      <p className="text-[9px] font-bold text-outline uppercase">Oficina Central</p>
                      <p className="text-xs font-extrabold text-on-surface mt-0.5">Soporte IT</p>
                      <p className="text-[10px] text-on-surface-variant font-mono mt-1">+54 9 376 412345</p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-outline-variant rounded-xl">
                      <p className="text-[9px] font-bold text-outline uppercase">Email Corporativo</p>
                      <p className="text-xs font-extrabold text-on-surface mt-0.5">Mantenimiento</p>
                      <p className="text-[10px] text-on-surface-variant font-mono mt-1">maint@cita.org</p>
                    </div>
                  </div>
                </div>

              </div>
            )}

            </div>
          )}

          {/* Footer Info */}
          <div className="p-4 bg-slate-50 border-t border-outline-variant text-center">
            <p className="text-[10px] text-on-surface-variant font-medium">
              Mantenimiento — Cita con la Vida &copy; 2026
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
