import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'; // <--- 1. IMPORTAR

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Space Gym',
  description: 'Tu espacio deportivo a un clic',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {/* 2. AGREGAR EL COMPONENTE TOASTER AQUÍ */}
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
        {children}
      </body>
    </html>
  )
}