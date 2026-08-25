import React from 'react';
import { Wrench, Clock3 } from 'lucide-react';

interface MaintenanceScreenProps {
  message: string;
  onAdminAccess?: () => void;
}

export default function MaintenanceScreen({ message, onAdminAccess }: MaintenanceScreenProps) {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <section className="w-full max-w-xl text-center">
        <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-white shadow-premium-lg">
          <Wrench size={36} strokeWidth={1.8} />
        </div>
        <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary">
          Cita con la Vida
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight text-on-background md:text-4xl">
          Sistema en mantenimiento
        </h1>
        <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-on-surface-variant">
          {message || 'Estamos realizando tareas de mantenimiento para mejorar el sistema. Volveremos a estar disponibles en breve.'}
        </p>
        <div className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white px-4 py-2 text-xs font-bold text-on-surface-variant shadow-xs">
          <Clock3 size={15} className="text-primary" />
          <span>Disponible nuevamente en breve</span>
        </div>
        {onAdminAccess && (
          <button
            type="button"
            onClick={onAdminAccess}
            className="mt-8 text-xs font-bold text-primary underline-offset-4 hover:underline"
          >
            Acceso de administrador
          </button>
        )}
      </section>
    </main>
  );
}
