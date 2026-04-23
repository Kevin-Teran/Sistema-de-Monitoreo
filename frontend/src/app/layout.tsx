/**
 * @file layout.tsx
 * @route frontend/src/app
 * @description Layout raíz que envuelve toda la aplicación.
 * Asegura el orden correcto de los proveedores para un funcionamiento sin errores.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import '../globals.css';
import getConfig from 'next/config'; 
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';

const inter = Inter({ subsets: ['latin'] });
const config = getConfig() || {};
const basePath = config.publicRuntimeConfig?.basePath || ''; 

export const metadata: Metadata = {
  title: 'Sistemas de monitoreo',
  description: 'Sistemas de monitoreo.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}