"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function SettingsFab() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'main' | 'notifications'>('main');
  const [loading, setLoading] = useState(false);
  
  // Estados del formulario
  const [contactEmail, setContactEmail] = useState('');
  const [settings, setSettings] = useState({ reservas: true, promos: false });

  // Cargar configuración inicial
  useEffect(() => {
    if (isOpen && user) {
      const fetchSettings = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('contact_email, notification_settings')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setContactEmail(data.contact_email || user.email || '');
          // Manejo seguro del JSON
          const savedSettings = typeof data.notification_settings === 'string' 
            ? JSON.parse(data.notification_settings) 
            : data.notification_settings;
            
          setSettings(savedSettings || { reservas: true, promos: false });
        }
      };
      fetchSettings();
    }
  }, [isOpen, user]);

  // Guardar cambios
  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        contact_email: contactEmail,
        notification_settings: settings
      })
      .eq('id', user.id);

    setLoading(false);
    if (!error) {
      alert("Configuración guardada ✅");
      setIsOpen(false); // Cerrar al guardar
    } else {
      console.error(error);
      alert("Error al guardar");
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* MENÚ POP-UP */}
      {isOpen && (
        <div className="mb-4 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          
          {/* VISTA 1: MENÚ PRINCIPAL */}
          {view === 'main' && (
            <div className="p-2">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="font-bold text-gray-800">Configuración</h3>
              </div>
              <button 
                onClick={() => setView('notifications')}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors text-sm text-gray-700"
              >
                <span className="bg-yellow-100 text-yellow-700 p-1.5 rounded-md">🔔</span>
                <div>
                  <p className="font-medium">Notificaciones</p>
                  <p className="text-xs text-gray-400">Alertas y correos</p>
                </div>
                <span className="ml-auto text-gray-400">›</span>
              </button>
            </div>
          )}

          {/* VISTA 2: CONFIGURACIÓN DE NOTIFICACIONES */}
          {view === 'notifications' && (
            <div>
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
                <button onClick={() => setView('main')} className="text-gray-500 hover:text-black">←</button>
                <h3 className="font-bold text-gray-800 text-sm">Notificaciones</h3>
              </div>
              
              <div className="p-5 space-y-5">
                {/* Correo de destino */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Enviar correos a</label>
                  <input 
                    type="email" 
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="tu@correo.com"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Si lo dejas vacío, usaremos tu correo de login.</p>
                </div>

                {/* Toggles (Interruptores) */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Nuevas Reservas</span>
                    <input 
                      type="checkbox" 
                      checked={settings?.reservas ?? true}
                      onChange={(e) => setSettings({...settings, reservas: e.target.checked})}
                      className="w-4 h-4 accent-green-600"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Ofertas y Promos</span>
                    <input 
                      type="checkbox" 
                      checked={settings?.promos ?? false}
                      onChange={(e) => setSettings({...settings, promos: e.target.checked})}
                      className="w-4 h-4 accent-green-600"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full bg-black text-white py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition-all"
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BOTÓN FLOTANTE (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen ? 'bg-gray-200 text-gray-600 rotate-90' : 'bg-black text-white hover:scale-110'
        }`}
      >
        {isOpen ? (
          <span className="text-xl font-bold">✕</span>
        ) : (
          <span className="text-2xl">⚙️</span>
        )}
      </button>
    </div>
  );
}