import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wrench, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  FileText, 
  Key, 
  Lock, 
  ArrowRight, 
  UserCheck, 
  Clock, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { UserProfile } from '../types';
import { hashPassword } from '../utils/security';

interface GateScreenProps {
  approvedWorkers: UserProfile[];
  pendingWorkers: UserProfile[];
  onLogin: (profile: UserProfile) => void;
  onRegisterWorker: (profile: UserProfile) => void;
  onRegisterAdmin: (profile: UserProfile) => void;
}

export function GateScreen({
  approvedWorkers,
  pendingWorkers,
  onLogin,
  onRegisterWorker,
  onRegisterAdmin
}: GateScreenProps) {
  const [activeMode, setActiveMode] = useState<'login' | 'register'>('login');
  const [registerRole, setRegisterRole] = useState<'worker' | 'admin'>('worker');

  // Onboarding / Privacy & Permission Consent Blocker
  const [privacyAccepted, setPrivacyAccepted] = useState(() => {
    return localStorage.getItem('device_privacy_consent_accepted') === 'true';
  });
  const [consentTermsChecked, setConsentTermsChecked] = useState(false);
  const [consentDeviceChecked, setConsentDeviceChecked] = useState(false);

  // Login inputs
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState(''); // Only required for Admin login
  const [loginError, setLoginError] = useState('');

  // Common Register inputs
  const [regName, setRegName] = useState('');
  const [regDocument, setRegDocument] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regOffice, setRegOffice] = useState<UserProfile['office']>('Misiones');
  const [regAdminPassword, setRegAdminPassword] = useState('');
  const [regError, setRegError] = useState('');

  // Google OAuth Simulation States
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleLoadingMsg, setGoogleLoadingMsg] = useState('');
  const [googleCustomEmail, setGoogleCustomEmail] = useState('');
  const [googleCustomName, setGoogleCustomName] = useState('');
  const [showGoogleCustomForm, setShowGoogleCustomForm] = useState(false);
  const [googleSyncedEmail, setGoogleSyncedEmail] = useState('');
  const [googleSyncedName, setGoogleSyncedName] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail.trim()) {
      setLoginError('Por favor ingrese su correo electrónico.');
      return;
    }
    if (!loginPassword) {
      setLoginError('Por favor ingrese su contraseña.');
      return;
    }

    const emailLower = loginEmail.toLowerCase().trim();

    // 1. Check if email is in approved workers list
    const foundApproved = approvedWorkers.find(
      u => u.email.toLowerCase().trim() === emailLower
    );

    // 2. Check if email is in pending workers list
    const foundPending = pendingWorkers.find(
      u => u.email.toLowerCase().trim() === emailLower
    );

    const foundUser = foundApproved || foundPending;

    if (foundUser) {
      // If the user has a secure password hash, verify it
      if (foundUser.passwordHash) {
        const inputHash = await hashPassword(loginPassword);
        if (inputHash === foundUser.passwordHash) {
          onLogin(foundUser);
          return;
        } else {
          setLoginError('Contraseña incorrecta. Por favor intente nuevamente.');
          return;
        }
      } else {
        setLoginError('Esta cuenta no tiene una contraseña válida registrada. Solicite a administración que revise su cuenta.');
        return;
      }
    }

    setLoginError('El correo no está registrado o la contraseña es inválida. Solicite un registro manual y aprobación administrativa.');
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regName.trim() || !regDocument.trim() || !regPhone.trim() || !regEmail.trim() || !regPassword) {
      setRegError('Por favor complete todos los campos obligatorios, incluyendo su contraseña.');
      return;
    }

    if (regPassword.length < 6) {
      setRegError('Por seguridad, la contraseña debe tener al menos 6 caracteres.');
      return;
    }

    // Check if email already exists
    const emailLower = regEmail.toLowerCase().trim();
    const isAlreadyApproved = approvedWorkers.some(w => w.email.toLowerCase() === emailLower);
    const isAlreadyPending = pendingWorkers.some(w => w.email.toLowerCase() === emailLower);

    if (isAlreadyApproved || isAlreadyPending) {
      setRegError('Este correo electrónico ya se encuentra registrado.');
      return;
    }

    // Securely hash the custom password before storing it
    const securePasswordHash = await hashPassword(regPassword);

    if (registerRole === 'admin') {
      // Admin Register
      if (regAdminPassword !== 'administracionpreventiva') {
        setRegError('La contraseña de validación administrativa ingresada es incorrecta.');
        return;
      }
      if (regOffice !== 'Mantenimiento' && regOffice !== 'Administración') {
        setRegError('Para registrarse como administrador, su área debe ser Mantenimiento o Administración.');
        return;
      }

      const newAdmin: UserProfile = {
        name: regName.trim(),
        document: regDocument.trim(),
        phone: regPhone.trim(),
        email: emailLower,
        office: regOffice,
        isAdmin: true,
        isApproved: true,
        passwordHash: securePasswordHash
      };
      onRegisterAdmin(newAdmin);
    } else {
      // Regular office worker register
      if (regOffice === 'Mantenimiento') {
        setRegError('El área "Mantenimiento" está reservada exclusivamente para personal de administración con clave.');
        return;
      }

      const newWorker: UserProfile = {
        name: regName.trim(),
        document: regDocument.trim(),
        phone: regPhone.trim(),
        email: emailLower,
        office: regOffice as any,
        isAdmin: false,
        isApproved: false,
        passwordHash: securePasswordHash
      };
      onRegisterWorker(newWorker);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfafb] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Visual glowing elements for premium feel */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-primary/3 blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-primary/2 blur-[100px]" />

      <div className="w-full max-w-md bg-white border border-[#7a172c]/15 rounded-3xl shadow-premium-lg overflow-hidden relative z-10 flex flex-col">
        
        {/* Top visual brand banner */}
        <div className="bg-gradient-to-br from-[#9e1b34] to-[#7a172c] p-8 text-white relative">
          <div className="absolute top-4 right-4 text-[10px] bg-white/10 px-2.5 py-1 rounded-full uppercase font-bold tracking-wider animate-pulse">
            v1.4.0 Live
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-md border border-white/10 shadow-sm">
              <Wrench size={22} className="text-white" />
            </div>
            <h1 className="text-xl font-black tracking-tight leading-none uppercase">
              Cita con la Vida
            </h1>
          </div>
          <p className="text-xs text-white/80 max-w-xs font-medium">
            Portal oficial de Gestión de Mantenimiento Preventivo e Incidencias Edilicias.
          </p>
        </div>

        {!privacyAccepted ? (
          <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="p-3 bg-red-50/70 border border-[#7a172c]/10 rounded-2xl flex items-start gap-2.5 shadow-3xs">
                <AlertCircle size={16} className="text-primary mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <h3 className="text-xs font-extrabold text-primary uppercase">Consentimiento Requerido</h3>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Para poder ingresar o registrarse, debe leer y autorizar la política de privacidad de datos y permisos de dispositivo.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Términos de Privacidad & Permisos</h4>
                
                <div className="max-h-[160px] overflow-y-auto border border-slate-100 rounded-xl p-3.5 space-y-3 text-[11px] text-slate-600 bg-slate-50/50 leading-relaxed scrollbar-thin">
                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-800">1. Almacenamiento Estricto y Minimizado</p>
                    <p className="text-slate-500">
                      La aplicación recopila y almacena **únicamente** su dirección de correo de Google y la contraseña que defina en el registro. No se recopilarán archivos, contactos ni telemetría.
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-800">2. Sincronización Segura de Cuentas</p>
                    <p className="text-slate-500">
                      Al otorgar este permiso, autoriza a la app a detectar de forma segura las cuentas de Google configuradas en su dispositivo para acelerar el inicio de sesión y evitar errores de tipeo.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-800">3. Tratamiento de Seguridad Local</p>
                    <p className="text-slate-500">
                      Toda contraseña es procesada localmente mediante algoritmos criptográficos antes de almacenarse, garantizando absoluta privacidad.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-800">4. Revocación Directa</p>
                    <p className="text-slate-500">
                      Usted retiene soberanía total. Puede revocar este consentimiento y dar de baja su cuenta en cualquier momento, eliminando permanentemente sus datos registrados.
                    </p>
                  </div>
                </div>
              </div>

              {/* Interactive Consent Checkboxes */}
              <div className="space-y-2 pt-1">
                <label className="flex items-start gap-2.5 p-2.5 hover:bg-slate-50 rounded-xl border border-slate-100 transition-colors cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={consentTermsChecked}
                    onChange={(e) => setConsentTermsChecked(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer accent-primary"
                  />
                  <span className="text-[11px] text-slate-600 font-medium leading-tight group-hover:text-slate-900 select-none">
                    He leído y acepto detalladamente las Políticas de Tratamiento de Datos Minimizado y Privacidad.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 hover:bg-slate-50 rounded-xl border border-slate-100 transition-colors cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={consentDeviceChecked}
                    onChange={(e) => setConsentDeviceChecked(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer accent-primary"
                  />
                  <span className="text-[11px] text-slate-600 font-medium leading-tight group-hover:text-slate-900 select-none">
                    Otorgo permiso de acceso seguro para leer cuentas de Google vinculadas en este dispositivo.
                  </span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={!consentTermsChecked || !consentDeviceChecked}
                onClick={() => {
                  localStorage.setItem('device_privacy_consent_accepted', 'true');
                  setPrivacyAccepted(true);
                }}
                className={`w-full py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-3xs ${
                  consentTermsChecked && consentDeviceChecked
                    ? 'bg-primary hover:bg-primary-hover text-white active:scale-99'
                    : 'bg-slate-100 text-slate-400 border border-slate-200/50 cursor-not-allowed'
                }`}
              >
                <span>Aceptar Políticas y Habilitar Acceso</span>
                <ArrowRight size={13} />
              </button>
              <p className="text-[9px] text-center text-slate-400 mt-2 font-medium">
                Al confirmar, se activará la sincronización segura en el portal.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Tab Selection */}
            <div className="flex border-b border-slate-100 bg-slate-50/50 p-1.5 m-4 rounded-xl">
              <button
                onClick={() => {
                  setActiveMode('login');
                  setLoginError('');
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeMode === 'login'
                    ? 'bg-white text-primary shadow-2xs'
                    : 'text-on-surface-variant hover:bg-white/40'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => {
                  setActiveMode('register');
                  setRegError('');
                }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeMode === 'register'
                    ? 'bg-white text-primary shadow-2xs'
                    : 'text-on-surface-variant hover:bg-white/40'
                }`}
              >
                Registrarse
              </button>
            </div>

            {/* Active View Container */}
            <div className="p-6 pt-2 flex-1 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {activeMode === 'login' ? (
              <motion.form
                key="login-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                onSubmit={handleLoginSubmit}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-on-surface">Ingreso de Personal</h3>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed">
                    Acceda usando su correo institucional o credenciales administrativas autorizadas.
                  </p>
                </div>

                {loginError && (
                  <div className="p-3 bg-red-50 border border-red-200/50 rounded-xl flex items-start gap-2 text-[10px] text-red-800">
                    <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-600" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Correo Electrónico</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-outline-variant rounded-xl focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">Contraseña</label>
                      <span className="text-[9px] text-primary italic font-semibold">(Su clave registrada o "123456")</span>
                    </div>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                      <input
                        type="password"
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-outline-variant rounded-xl focus:ring-1 focus:ring-primary focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer mt-6"
                >
                  <span>Ingresar al Sistema</span>
                  <ArrowRight size={14} />
                </button>

                <div className="relative flex py-1.5 items-center">
                  <div className="flex-grow border-t border-slate-100"></div>
                  <span className="flex-shrink mx-3 text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">O continuar con</span>
                  <div className="flex-grow border-t border-slate-100"></div>
                </div>

                <button
                  type="button"
                  onClick={() => setLoginError('El ingreso debe realizarse con una cuenta registrada y aprobada por administración.')}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/85 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-3xs cursor-pointer active:scale-99"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                  <span>Ingreso con cuenta registrada</span>
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="register-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                onSubmit={handleRegisterSubmit}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-on-surface">Formulario de Registro</h3>
                  <p className="text-[10px] text-on-surface-variant">
                    Seleccione su tipo de registro correspondiente. El personal de oficina requiere aprobación.
                  </p>
                </div>

                {googleSyncedEmail && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200/50 rounded-xl flex items-center gap-2.5 text-[11px] text-emerald-800 shadow-3xs animate-pulse">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-xs shrink-0">✓</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-emerald-900 text-xs">Sincronizado con Google</p>
                      <p className="text-[10px] text-emerald-700 font-mono truncate">{googleSyncedEmail}</p>
                    </div>
                  </div>
                )}

                {/* Role Switcher */}
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setRegisterRole('worker');
                      setRegOffice('Misiones');
                      setRegError('');
                    }}
                    className={`py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      registerRole === 'worker' ? 'bg-white text-primary shadow-3xs' : 'text-on-surface-variant'
                    }`}
                  >
                    Personal de Oficina
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRegisterRole('admin');
                      setRegOffice('Mantenimiento');
                      setRegError('');
                    }}
                    className={`py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                      registerRole === 'admin' ? 'bg-white text-primary shadow-3xs' : 'text-on-surface-variant'
                    }`}
                  >
                    Equipo de Admin
                  </button>
                </div>

                {regError && (
                  <div className="p-3 bg-red-50 border border-red-200/50 rounded-xl flex items-start gap-2 text-[10px] text-red-800">
                    <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-600" />
                    <span>{regError}</span>
                  </div>
                )}

                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider block">Nombre y Apellido</label>
                    <div className="relative">
                      <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Nombre y apellido"
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-outline-variant rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Document */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider block">Documento de Identidad (DNI)</label>
                    <div className="relative">
                      <FileText size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                      <input
                        type="text"
                        required
                        value={regDocument}
                        onChange={(e) => setRegDocument(e.target.value)}
                        placeholder="Número de DNI"
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-outline-variant rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider block">Celular de Contacto</label>
                    <div className="relative">
                      <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                      <input
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="Número de celular"
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-outline-variant rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider block">Correo Electrónico</label>
                    <div className="relative">
                      <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                      <input
                        type="email"
                        required
                        disabled={!!googleSyncedEmail}
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="Su correo electrónico"
                        className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-primary ${
                          googleSyncedEmail ? 'bg-slate-100 border-slate-200 text-slate-500 font-semibold cursor-not-allowed font-mono' : 'bg-white border border-outline-variant'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  {!googleSyncedEmail && (
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider block">Crear Contraseña Propia</label>
                      <div className="relative">
                        <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                        <input
                          type="password"
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-outline-variant rounded-xl focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {/* Office / Area */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider block">
                      {registerRole === 'admin' ? 'Área de Trabajo Administrativa' : 'Oficina Asignada'}
                    </label>
                    <div className="relative">
                      <Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                      <select
                        value={regOffice}
                        onChange={(e) => setRegOffice(e.target.value as any)}
                        className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-outline-variant rounded-xl focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                      >
                        {registerRole === 'admin' ? (
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
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[10px]">&#9662;</span>
                    </div>
                  </div>

                  {/* Admin Password */}
                  {registerRole === 'admin' && (
                    <div className="space-y-1 bg-red-50/50 p-2.5 rounded-xl border border-[#7a172c]/10">
                      <label className="text-[9px] font-bold text-primary uppercase tracking-wider block flex items-center gap-1">
                        <Key size={10} />
                        Contraseña de Validación Administrativa
                      </label>
                      <input
                        type="password"
                        required
                        value={regAdminPassword}
                        onChange={(e) => setRegAdminPassword(e.target.value)}
                        placeholder="Ingrese la clave requerida"
                        className="w-full mt-1 px-3 py-1.5 text-xs bg-white border border-outline-variant rounded-lg focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[#9e1b34] hover:bg-[#7a172c] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer mt-4"
                >
                  <UserCheck size={14} />
                  <span>
                    {googleSyncedEmail 
                      ? 'Finalizar Registro con Google' 
                      : registerRole === 'admin' 
                        ? 'Registrarse como Administrador' 
                        : 'Solicitar Registro de Oficina'}
                  </span>
                </button>

                {!googleSyncedEmail && (
                  <>
                    <div className="relative flex py-1.5 items-center">
                      <div className="flex-grow border-t border-slate-100"></div>
                      <span className="flex-shrink mx-3 text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">O registrarse con</span>
                      <div className="flex-grow border-t border-slate-100"></div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setRegError('El registro es manual. Complete sus datos reales y envíe la solicitud para aprobación.')}
                      className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/85 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-3xs cursor-pointer active:scale-99"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                      </svg>
                      <span>Registro manual obligatorio</span>
                    </button>
                  </>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </>
    )}
  </div>

      {/* Google Account Chooser Overlay Modal */}
      <AnimatePresence>
        {showGoogleModal && (
          <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl w-full max-w-sm border border-slate-200 shadow-2xl overflow-hidden font-sans text-slate-800"
            >
              {/* Header */}
              <div className="p-6 pb-4 text-center border-b border-slate-100 relative">
                <button 
                  onClick={() => {
                    setShowGoogleModal(false);
                    setShowGoogleCustomForm(false);
                  }}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-sm w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-50 transition-all cursor-pointer"
                  type="button"
                >
                  ✕
                </button>
                <div className="flex justify-center mb-2.5">
                  <svg className="w-9 h-9" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                </div>
                <h3 className="text-base font-black tracking-tight text-slate-800">Acceder con Google</h3>
                <p className="text-[10px] text-slate-500 mt-1">para continuar en <span className="font-bold text-[#7a172c]">Cita con la Vida</span></p>
              </div>

              {/* Loading State Overlay */}
              {isGoogleLoading ? (
                <div className="p-8 text-center space-y-4 min-h-[220px] flex flex-col justify-center items-center">
                  <div className="w-12 h-12 relative flex items-center justify-center">
                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                    <div className="absolute inset-0 border-4 border-t-blue-500 border-r-green-500 border-b-yellow-500 border-l-red-500 rounded-full animate-spin" />
                  </div>
                  <p className="text-xs font-bold text-slate-600 animate-pulse px-4">{googleLoadingMsg}</p>
                </div>
              ) : (
                <div className="p-5 space-y-3.5 max-h-[300px] overflow-y-auto">
                  {!showGoogleCustomForm ? (
                    <>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Cuentas detectadas en este dispositivo</p>
                      
                      {/* suggested personalized account based on metadata! */}
                      <button
                        type="button"
                        onClick={() => setRegError('El registro es manual. No se aceptan identidades simuladas o cuentas no verificadas.')}
                        className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all text-left group cursor-pointer"
                      >
                        <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-tr from-[#7a172c] to-[#9e1b34] text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                          M
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-extrabold text-slate-800 truncate group-hover:text-primary">Matías Moya</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">matymoya18@gmail.com</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-100 block text-center">Detectada</span>
                          <span className="text-[8px] text-slate-400 font-bold block mt-0.5 text-center uppercase tracking-wider font-mono">Principal</span>
                        </div>
                      </button>

                      <div className="border-t border-slate-100 my-1.5" />

                      {/* use different account option */}
                      <button
                        type="button"
                        onClick={() => setShowGoogleCustomForm(true)}
                        className="w-full flex items-center justify-center gap-2 py-2 px-4 hover:bg-slate-50 text-xs font-bold text-primary rounded-xl border border-dashed border-primary/20 transition-all cursor-pointer"
                      >
                        <span>Vincular otra cuenta de Google</span>
                      </button>
                    </>
                  ) : (
                    <div className="space-y-3 p-0.5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ingresa tus datos de Google</p>
                      
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Nombre Completo</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Juan Pérez"
                          value={googleCustomName}
                          onChange={e => setGoogleCustomName(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase">Correo de Google (Gmail)</label>
                        <input
                          type="email"
                          required
                          placeholder="usuario@gmail.com"
                          value={googleCustomEmail}
                          onChange={e => setGoogleCustomEmail(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowGoogleCustomForm(false)}
                          className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all text-slate-600 cursor-pointer"
                        >
                          Atrás
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!googleCustomEmail.trim() || !googleCustomName.trim()) {
                              alert('Por favor ingresa tu nombre y correo.');
                              return;
                            }
                            setRegError('El registro es manual. No se aceptan identidades simuladas o cuentas no verificadas.');
                            setShowGoogleModal(false);
                          }}
                          className="flex-grow py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                        >
                          Vincular Cuenta
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="bg-slate-50 p-4 border-t border-slate-100 text-[9px] text-slate-400 leading-relaxed text-center">
                Para continuar, Google compartirá tu nombre, dirección de correo electrónico, idioma y foto de perfil con <span className="font-semibold text-slate-500">Cita con la Vida</span>.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface PendingApprovalScreenProps {
  profile: UserProfile;
  onCancel: () => void;
}

export function PendingApprovalScreen({ profile, onCancel }: PendingApprovalScreenProps) {
  return (
    <div className="min-h-screen bg-[#fdfafb] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-primary/3 blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-primary/2 blur-[100px]" />

      <div className="w-full max-w-md bg-white border border-[#7a172c]/15 rounded-3xl shadow-premium-lg p-8 relative z-10 text-center space-y-6">
        
        {/* Animated pending pulse icon */}
        <div className="mx-auto w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center border border-amber-200 text-amber-600 relative">
          <Clock size={28} className="animate-spin-slow" />
          <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-amber-500 rounded-full border-2 border-white text-[9px] font-bold text-white flex items-center justify-center animate-bounce">
            !
          </span>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-black text-on-surface uppercase tracking-tight leading-none text-[#9e1b34]">
            Registro Pendiente de Aprobación
          </h2>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed">
            Su solicitud de registro como Personal de Oficina para la sede <strong>{profile.office}</strong> ha sido enviada al equipo administrativo de la institución.
          </p>
        </div>

        {/* Display profile details card */}
        <div className="bg-[#fcf5f6] border border-[#7a172c]/10 rounded-2xl p-4 text-left space-y-2.5 text-xs">
          <span className="font-extrabold text-[#7a172c] uppercase tracking-wider text-[9px] block">Detalles del Solicitante</span>
          <div className="grid grid-cols-2 gap-y-1.5 text-[11px]">
            <p className="text-on-surface-variant font-semibold">Nombre:</p>
            <p className="text-on-surface font-bold truncate">{profile.name}</p>
            <p className="text-on-surface-variant font-semibold">DNI Documento:</p>
            <p className="text-on-surface font-semibold font-mono">{profile.document}</p>
            <p className="text-on-surface-variant font-semibold">Oficina:</p>
            <p className="text-on-surface font-semibold">{profile.office}</p>
            <p className="text-on-surface-variant font-semibold">Correo:</p>
            <p className="text-on-surface font-semibold truncate">{profile.email}</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-2 space-y-2.5">
          <button
            onClick={onCancel}
            className="w-full py-2.5 border border-[#7a172c]/20 hover:bg-[#fdfafb] text-[#7a172c] rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Volver / Registrarse con otra cuenta
          </button>
        </div>

      </div>
    </div>
  );
}
