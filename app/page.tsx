import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar simple */}
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <span className="text-2xl font-bold tracking-tight text-gray-900">SpaceGym</span>
        <Link href="/auth" className="text-sm font-medium text-gray-600 hover:text-gray-900">
          Iniciar Sesión
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="flex-grow flex items-center justify-center p-6">
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          {/* Texto */}
          <div className="space-y-6">
            <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
              Tu espacio deportivo, <span className="text-[#78BE20]">a un clic.</span>
            </h1>
            <p className="text-lg text-gray-600">
              Space Gym conecta a deportistas con los mejores espacios para entrenar. 
              Reserva por horas o días, sin contratos mensuales.
            </p>
            
            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              {/* BOTÓN 1: DEPORTISTA */}
              <Link 
                href="/auth?role=deportista"
                className="px-8 py-4 bg-gray-900 text-white rounded-xl font-semibold text-center hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl flex-1"
              >
                🏃‍♂️ Quiero Entrenar
              </Link>

              {/* BOTÓN 2: ARRENDADOR */}
              <Link 
                href="/auth?role=arrendador"
                className="px-8 py-4 bg-white text-[#78BE20] border-2 border-[#78BE20] rounded-xl font-semibold text-center hover:bg-[#78BE20] hover:text-white transition-all flex-1"
              >
                🏢 Tengo un Gimnasio
              </Link>
            </div>
            <p className="text-xs text-gray-500">
              ¿Eres administrador? Ingresa como arrendador para gestionar tu cuenta.
            </p>
          </div>

          {/* Imagen Decorativa */}
          <div className="relative h-[500px] w-full rounded-3xl overflow-hidden bg-gray-100 shadow-2xl hidden md:block">
            {/* Puedes poner una imagen real aquí con <Image /> */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#78BE20] to-green-800 opacity-90 flex items-center justify-center">
              <span className="text-white text-9xl opacity-20 font-bold">SG</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/60 to-transparent text-white">
              <p className="font-bold text-xl">Gestiona o Reserva</p>
              <p className="text-sm opacity-90">La red más grande de espacios deportivos.</p>
            </div>
          </div>

        </div>
      </main>

      <footer className="p-6 text-center text-gray-400 text-sm">
        © 2024 Space Gym Inc. Todos los derechos reservados.
      </footer>
    </div>
  );
}