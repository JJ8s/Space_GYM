"use client";

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');
  const defaultRole = roleParam === 'arrendador' ? 'arrendador' : 'deportista';

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Limpiar sesión al entrar para evitar bucles
  useEffect(() => {
    const forceLogout = async () => {
      await supabase.auth.signOut(); 
    };
    forceLogout();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', authData.user?.id).single();
        const userRole = profile?.role || 'deportista';

        if (userRole === 'arrendador' || userRole === 'administrador') router.push('/business');
        else router.push('/dashboard');

      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email, password,
          options: { data: { role: defaultRole, full_name: email.split('@')[0] } }
        });
        if (signUpError) throw signUpError;

        alert("Cuenta creada exitosamente.");
        if (defaultRole === 'arrendador') router.push('/business');
        else router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || "Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 text-center">
      <h1 className="text-2xl font-bold mb-6">Space Gym {isLogin ? 'Login' : 'Registro'}</h1>
      {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}
      
      <form onSubmit={handleAuth} className="space-y-4">
        <input type="email" required placeholder="Correo" className="w-full p-3 border rounded-xl" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" required placeholder="Contraseña" className="w-full p-3 border rounded-xl" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit" disabled={loading} className="w-full bg-black text-white py-3 rounded-xl font-bold">
          {loading ? 'Procesando...' : (isLogin ? 'Entrar' : 'Registrarse')}
        </button>
      </form>
      
      <button onClick={() => setIsLogin(!isLogin)} className="block w-full mt-4 text-sm text-green-600 hover:underline">
        {isLogin ? 'Crear cuenta nueva' : 'Ya tengo cuenta'}
      </button>
    </div>
  );
}

export default function AuthPage() {
  return <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4"><Suspense fallback={<div>Cargando...</div>}><AuthForm /></Suspense></div>;
}