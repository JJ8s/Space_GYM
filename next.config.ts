/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'supa.co', // Placeholder
      },
      {
        protocol: 'https',
        // OJO: Aquí permite CUALQUIER dominio de supabase para evitar errores
        hostname: '*.supabase.co', 
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      }
    ],
  },
};

export default nextConfig;