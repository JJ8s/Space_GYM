"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');
  
  // LÓGICA DE ROLES: Aquí es donde diferenciamos los dos logins
  const defaultRole = roleParam === 'arrendador' ? 'arrendador' : 'deportista';
  const isArrendador = defaultRole === 'arrendador';

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Limpieza de sesión al cargar
  useEffect(() => {
    const forceLogout = async () => { await supabase.auth.signOut(); };
    forceLogout();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // --- LOGIN ---
        // 1. Autenticar credenciales
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;

        // 2. Verificar ROL REAL en la base de datos (Seguridad)
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', authData.user?.id).single();
        const userRole = profile?.role || 'deportista';

        // 3. Redirigir según el rol detectado
        toast.success(`Bienvenido de vuelta`);
        if (userRole === 'arrendador' || userRole === 'administrador') router.push('/business');
        else router.push('/dashboard');

      } else {
        // --- REGISTRO ---
        // Aquí usamos 'defaultRole' para crear al usuario con el tipo correcto (Arrendador o Deportista)
        const { error: signUpError } = await supabase.auth.signUp({
          email, password,
          options: { data: { role: defaultRole, full_name: email.split('@')[0] } }
        });
        if (signUpError) throw signUpError;

        toast.success("Cuenta creada exitosamente");
        if (defaultRole === 'arrendador') router.push('/business');
        else router.push('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.message || "Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  // UI ADAPTATIVA: Cambia colores según 'isArrendador'
  return (
    <div className="relative z-10 w-full max-w-md bg-white border-2 border-black p-8 shadow-[12px_12px_0px_0px_#dc2626]">
      
      {/* Cabecera */}
      <div className="text-center mb-8">
        {/* Etiqueta que cambia de color y texto */}
        <div className={`inline-block text-white px-3 py-1 text-xs font-bold uppercase tracking-widest mb-3 transform -skew-x-12 ${isArrendador ? 'bg-black' : 'bg-red-600'}`}>
          {isArrendador ? 'Business Access' : 'Athlete Access'}
        </div>
        <h1 className="text-4xl font-black italic tracking-tighter text-gray-900">
          {isLogin ? 'INICIAR SESIÓN' : 'ÚNETE AL EQUIPO'}
        </h1>
        <p className="text-gray-500 text-sm mt-2 font-medium">
          {isLogin ? 'Continua tu entrenamiento' : 'Empieza tu viaje hoy mismo'}
        </p>
      </div>
      
      {/* Formulario */}
      <form onSubmit={handleAuth} className="space-y-5">
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase text-gray-800 ml-1">Email</label>
          <input 
            type="email" required placeholder="tu@correo.com" 
            className="w-full p-4 bg-gray-50 border-2 border-gray-200 focus:border-black focus:ring-0 outline-none transition-all font-medium placeholder-gray-400" 
            value={email} onChange={e => setEmail(e.target.value)} 
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold uppercase text-gray-800 ml-1">Contraseña</label>
          <input 
            type="password" required placeholder="••••••••" 
            className="w-full p-4 bg-gray-50 border-2 border-gray-200 focus:border-black focus:ring-0 outline-none transition-all font-medium placeholder-gray-400" 
            value={password} onChange={e => setPassword(e.target.value)} 
          />
        </div>

        {/* Botón que cambia de color */}
        <button 
          type="submit" disabled={loading} 
          className={`w-full py-4 text-white font-black text-lg uppercase tracking-wider transition-all transform hover:-translate-y-1 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
            ${isArrendador ? 'bg-black hover:bg-gray-900' : 'bg-red-600 hover:bg-red-700'}
          `}
        >
          {loading ? 'Procesando...' : (isLogin ? 'Entrar Ahora' : 'Crear Cuenta')}
        </button>
      </form>
      
      {/* Footer */}
      <div className="mt-8 text-center pt-6 border-t border-gray-100">
        <p className="text-sm text-gray-600">
          {isLogin ? '¿Aún no tienes cuenta?' : '¿Ya tienes cuenta?'}
        </p>
        <button 
          onClick={() => setIsLogin(!isLogin)} 
          className="mt-2 text-sm font-bold text-black border-b-2 border-red-600 hover:text-red-600 transition-colors uppercase tracking-wide"
        >
          {isLogin ? 'Regístrate Gratis' : 'Inicia Sesión Aquí'}
        </button>
      </div>
    </div>
  );
}