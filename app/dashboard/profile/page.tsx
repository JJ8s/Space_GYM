"use client";

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { ArrowLeft, Camera, Save, Bell, Phone, User, Calendar, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados del Formulario
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    avatar_url: '',
    notifications_enabled: false,
    last_name_change: null as string | null
  });

  // Estado para la regla de los 60 días
  const [daysRemaining, setDaysRemaining] = useState(0);

  // 1. Cargar Datos del Perfil
  useEffect(() => {
    if (!authLoading && !user) {
        router.push('/auth');
        return;
    }

    const fetchProfile = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data) {
            setFormData({
                full_name: data.full_name || '',
                phone: data.phone || '',
                avatar_url: data.avatar_url || '',
                notifications_enabled: data.notifications_enabled || false,
                last_name_change: data.last_name_change
            });

            // Calcular días restantes para cambiar nombre
            if (data.last_name_change) {
                const lastChange = new Date(data.last_name_change);
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - lastChange.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays < 60) {
                    setDaysRemaining(60 - diffDays);
                } else {
                    setDaysRemaining(0);
                }
            }
        }
      } catch (error) {
        console.error(error);
        toast.error("Error al cargar perfil");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchProfile();
  }, [user, authLoading, router]);

  // 2. Subir Foto (Con corrección Upsert)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const toastId = toast.loading("Subiendo foto...");

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // Subir con upsert: true para evitar errores de duplicados
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, {
                upsert: true 
            });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: urlData.publicUrl })
            .eq('id', user.id);

        if (updateError) throw updateError;

        setFormData(prev => ({ ...prev, avatar_url: urlData.publicUrl }));
        toast.success("Foto actualizada", { id: toastId });

    } catch (error) {
        console.error(error);
        toast.error("Error al subir imagen", { id: toastId });
    }
  };

  // 3. Guardar Cambios (CORREGIDO: Sin updated_at)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    try {
        // CORRECCIÓN AQUÍ: Eliminamos 'updated_at' para evitar el error de columna inexistente
        const updates: any = {
            phone: formData.phone,
            notifications_enabled: formData.notifications_enabled,
        };

        // Solo actualizamos nombre si está permitido
        if (daysRemaining === 0 && formData.full_name.trim() !== "") {
             const { data: current } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
             
             if (current?.full_name !== formData.full_name) {
                 updates.full_name = formData.full_name;
                 updates.last_name_change = new Date().toISOString(); 
             }
        }

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);

        if (error) throw error;

        toast.success("Perfil actualizado correctamente");
        
        if (updates.last_name_change) {
            setDaysRemaining(60);
        }

    } catch (error: any) {
        console.error("Error detallado:", error.message || JSON.stringify(error));
        toast.error("Error al guardar: " + (error.message || "Intenta nuevamente"));
    } finally {
        setSaving(false);
    }
  };

  if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">Cargando perfil...</div>;

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-sans text-gray-800 pb-20">
      
      {/* Header Simple */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
              <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <ArrowLeft size={20} />
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Editar Perfil</h1>
          </div>
      </div>

      <main className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* --- SECCIÓN FOTO --- */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center shadow-sm">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 relative">
                    {formData.avatar_url ? (
                        <Image src={formData.avatar_url} alt="Avatar" fill className="object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                            <User size={48} />
                        </div>
                    )}
                </div>
                {/* Overlay de cámara */}
                <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white" size={32} />
                </div>
                <div className="absolute bottom-0 right-0 bg-black text-white p-2 rounded-full border-2 border-white shadow-md">
                    <Camera size={16} />
                </div>
            </div>
            <p className="text-xs text-gray-500 mt-3 font-medium">Toca para cambiar tu foto</p>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload}
            />
        </div>

        {/* --- FORMULARIO --- */}
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            
            {/* Nombre Completo */}
            <div className="p-6 border-b border-gray-100">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nombre de Perfil</label>
                <div className="relative">
                    <input 
                        type="text" 
                        value={formData.full_name}
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                        disabled={daysRemaining > 0} 
                        className={`w-full p-3 pl-10 rounded-lg border focus:outline-none transition-colors ${daysRemaining > 0 ? 'bg-gray-100 text-gray-500 border-gray-200 cursor-not-allowed' : 'bg-white text-black border-gray-300 focus:border-black'}`}
                    />
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>
                
                {daysRemaining > 0 ? (
                    <div className="flex items-center gap-2 mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                        <Calendar size={14} />
                        <span>Podrás cambiar tu nombre en <b>{daysRemaining} días</b>.</span>
                    </div>
                ) : (
                    <p className="text-[10px] text-gray-400 mt-2">
                        * Solo puedes cambiar tu nombre una vez cada 60 días.
                    </p>
                )}
            </div>

            {/* Teléfono */}
            <div className="p-6 border-b border-gray-100">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Número de Celular</label>
                <div className="relative">
                    <input 
                        type="tel" 
                        placeholder="+56 9 1234 5678"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:border-black focus:outline-none transition-colors"
                    />
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>
            </div>

            {/* Notificaciones */}
            <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                        <Bell size={20} />
                    </div>
                    <div>
                        <p className="font-bold text-sm text-gray-900">Notificaciones</p>
                        <p className="text-xs text-gray-500">Recibir alertas de reservas y promociones</p>
                    </div>
                </div>
                
                {/* Toggle Switch */}
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={formData.notifications_enabled}
                        onChange={(e) => setFormData({...formData, notifications_enabled: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                </label>
            </div>

            {/* Botón Guardar */}
            <div className="p-6 bg-gray-50 border-t border-gray-200">
                <button 
                    type="submit" 
                    disabled={saving}
                    className="w-full bg-black text-white py-3 rounded-xl font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {saving ? (
                        <>
                            <Loader2 className="animate-spin" size={20} /> Guardando...
                        </>
                    ) : (
                        <>
                            <Save size={20} /> Guardar Cambios
                        </>
                    )}
                </button>
            </div>

        </form>

      </main>
    </div>
  );
}