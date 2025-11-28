import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
      
      {/* 1. FONDO CON PATRÓN (Líneas diagonales) */}
      <div className="absolute inset-0 z-0 opacity-[0.03]" 
           style={{ 
             backgroundImage: 'linear-gradient(135deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)', 
             backgroundSize: '30px 30px' 
           }}>
      </div>

      {/* 2. NAVBAR */}
      <nav className="relative z-10 p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          {/* Logo Icon */}
          <div className="w-8 h-8 bg-red-600 transform -skew-x-12 rounded-sm"></div>
          {/* Logo Text */}
          <span className="text-2xl font-black tracking-tighter text-black italic">
            SPACE<span className="text-red-600">GYM</span>
          </span>
        </div>
        <Link 
          href="/auth" 
          className="text-sm font-bold text-gray-600 hover:text-red-600 transition-colors uppercase tracking-wide"
        >
          Registrate Ahora
        </Link>
      </nav>

      {/* 3. HERO SECTION (Contenido Principal) */}
      <main className="grow flex items-center justify-center p-6">
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          
          {/* --- COLUMNA IZQUIERDA: TEXTO --- */}
          <div className="space-y-8">
            <div className="inline-block bg-gray-100 px-4 py-2 rounded-full border border-gray-200">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                La nueva forma de entrenar
              </span>
            </div>

            <h1 className="text-6xl md:text-7xl font-black text-gray-900 leading-[0.9] tracking-tight">
              ROMPE <br/>
              LA <span className="text-transparent bg-clip-text bg-linear-to-r from-red-600 to-red-800">RUTINA.</span>
            </h1>
            
            <p className="text-xl text-gray-500 font-medium max-w-md border-l-4 border-red-600 pl-6">
              Accede a cientos de gimnasios sin contratos. <br/>
              Paga solo por el día que entrenas.
            </p>
            
            {/* BOTONES DE ACCIÓN */}
            <div className="pt-4 flex flex-col sm:flex-row gap-6">
              
              {/* Botón Deportista: Rojo con Sombra Negra */}
              <Link 
                href="/auth?role=deportista"
                className="group relative px-8 py-4 bg-red-600 text-white rounded-none skew-x-[-10deg] font-bold text-center hover:bg-black transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] flex-1 flex items-center justify-center border-2 border-red-600"
              >
                <div className="skew-x-[10deg]">
                  <span>ENCONTRAR GYM'S</span>
                </div>
              </Link>

              {/* Botón Arrendador: Negro con Sombra Roja */}
              <Link 
                href="/auth?role=arrendador"
                className="group relative px-8 py-4 bg-black text-white rounded-none skew-x-[-10deg] font-bold text-center transition-all shadow-[8px_8px_0px_0px_#dc2626] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] flex-1 flex items-center justify-center border-2 border-black"
              >
                 <div className="skew-x-[10deg]">
                   PUBLICAR TU GYM
                 </div>
              </Link>
            </div>

            <p className="text-xs text-gray-400 font-mono mt-4">
              * Sin matrículas • Sin mensualidades fijas
            </p>
          </div>

          {/* --- COLUMNA DE LA IMAGEN (CORREGIDA) --- */}
          <div className="relative h-[600px] w-full hidden md:block group">
            
            {/* CAPA 0: Sombra Gris (Decoración detrás) */}
            <div className="absolute inset-0 bg-gray-200 transform translate-x-4 translate-y-4 rounded-3xl"></div>
            
            {/* CAPA 1: Contenedor de la Imagen (CORREGIDO: Quitamos 'relative', dejamos solo 'absolute') */}
            <div className="absolute inset-0 bg-black rounded-3xl overflow-hidden shadow-2xl z-10">
              
              {/* CAPA 2: La Imagen */}
              <Image 
                src="/verticalPersonGym.jpg" 
                alt="Atleta posando en SpaceGym"
                fill
                className="object-cover grayscale opacity-60"
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
              />

              {/* CAPA 3: Degradado Rojo */}
              <div className="absolute inset-0 bg-linear-to-t from-red-900/90 via-black/40 to-transparent z-20 mix-blend-multiply"></div>
              
              {/* CAPA 4: Textos */}
              <div className="absolute bottom-10 left-10 z-30">
                <p className="text-white text-5xl font-black italic tracking-tighter leading-none">NO LIMITS</p>
                <p className="text-red-500 text-xl font-bold uppercase tracking-widest">Just Gains</p>
              </div>

              {/* CAPA 5: Decoración Esquina */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-600 z-30 transform translate-x-16 -translate-y-16 rotate-45"></div>
            </div>
          </div>

        </div>
      </main>

      {/* 4. FOOTER */}
      <footer className="relative z-10 p-8 text-center border-t border-gray-100">
        <p className="text-gray-400 text-sm font-medium">
          © 2024 Space Gym Inc. <span className="text-red-600 mx-2">•</span> Power your ambition.
        </p>
      </footer>
    </div>
  );
}