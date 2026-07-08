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
        // Legacy seed user fallback (using '123456' or administration password as default password)
        if (loginPassword === '123456' || loginPassword === 'administracionpreventiva') {
          // Auto-migrate to secure hash on login for security!
          const secureHash = await hashPassword(loginPassword);
          const migratedUser = { ...foundUser, passwordHash: secureHash };
          onLogin(migratedUser);
          return;
        } else {
          setLoginError('Contraseña incorrecta. Ingrese su contraseña registrada (o "123456" si es un usuario preexistente).');
          return;
        }
      }
    }

    // 3. Fallback / Default admin email bypass
    if (loginPassword.trim() === 'administracionpreventiva') {
      // Dynamic admin login
      const adminProfile: UserProfile = {
        name: 'Administrador de Guardia',
        document: '99.999.999',
        phone: '3764-000000',
        email: emailLower,
        office: 'Administración',
        isAdmin: true,
        isApproved: true,
        passwordHash: await hashPassword('administracionpreventiva')
      };
      onLogin(adminProfile);
      return;
    }

    setLoginError('El correo ingresado no está registrado o la contraseña es inválida. Si se acaba de registrar, espere la aprobación de un administrador.');
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
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="Su correo electrónico"
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-outline-variant rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  {/* Password */}
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
                    {registerRole === 'admin' ? 'Registrarse como Administrador' : 'Solicitar Registro de Oficina'}
                  </span>
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
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
