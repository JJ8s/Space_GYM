"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function BusinessProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    rut_empresa: '',
    razon_social: '',
    telefono_contacto: '',
    direccion_comercial: ''
  });

  // Cargar datos si ya existen
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) {
        setFormData({
            rut_empresa: data.rut_empresa || '',
            razon_social: data.razon_social || '',
            telefono_contacto: data.telefono_contacto || '',
            direccion_comercial: data.direccion_comercial || ''
        });
      }
      setLoading(false);
    };
    loadProfile();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
        // 1. Guardar datos
        const { error } = await supabase.from('profiles').update({
            ...formData,
            is_verified: true // AUTO-VERIFICACIÓN (Para MVP). En el futuro, esto lo haría un admin manualmente.
        }).eq('id', user!.id);

        if (error) throw error;

        toast.success("Perfil de empresa actualizado");
        
        // 2. Redirigir a publicar (porque ahora sí puede)
        setTimeout(() => router.push('/dashboard/publish'), 1000);

    } catch (err) {
        toast.error("Error al guardar datos");
    } finally {
        setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Cargando perfil...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white max-w-lg w-full p-8 rounded-2xl shadow-lg border border-gray-200">
        <h1 className="text-2xl font-black italic mb-2">VERIFICACIÓN DE EMPRESA</h1>
        <p className="text-gray-500 text-sm mb-6">Para garantizar la seguridad en Space Gym, necesitamos validar tu identidad comercial antes de que puedas publicar.</p>

        <form onSubmit={handleSave} className="space-y-4">
            <div>
                <label className="text-xs font-bold text-gray-800 uppercase">RUT Empresa / Personal</label>
                <input 
                    required 
                    value={formData.rut_empresa}
                    onChange={e => setFormData({...formData, rut_empresa: e.target.value})}
                    placeholder="Ej: 76.123.456-K"
                    className="w-full p-3 bg-gray-50 border rounded-xl"
                />
            </div>

            <div>
                <label className="text-xs font-bold text-gray-800 uppercase">Razón Social / Nombre Completo</label>
                <input 
                    required 
                    value={formData.razon_social}
                    onChange={e => setFormData({...formData, razon_social: e.target.value})}
                    placeholder="Ej: Inversiones Gym SpA"
                    className="w-full p-3 bg-gray-50 border rounded-xl"
                />
            </div>

            <div>
                <label className="text-xs font-bold text-gray-800 uppercase">Teléfono de Contacto</label>
                <input 
                    required 
                    type="tel"
                    value={formData.telefono_contacto}
                    onChange={e => setFormData({...formData, telefono_contacto: e.target.value})}
                    placeholder="+56 9 ..."
                    className="w-full p-3 bg-gray-50 border rounded-xl"
                />
            </div>

            <div>
                <label className="text-xs font-bold text-gray-800 uppercase">Dirección Comercial</label>
                <input 
                    required 
                    value={formData.direccion_comercial}
                    onChange={e => setFormData({...formData, direccion_comercial: e.target.value})}
                    placeholder="Calle, Número, Comuna"
                    className="w-full p-3 bg-gray-50 border rounded-xl"
                />
            </div>

            <button disabled={saving} className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-900 transition-all">
                {saving ? 'Verificando...' : 'Guardar y Verificar'}
            </button>
        </form>
      </div>
    </div>
  );
}