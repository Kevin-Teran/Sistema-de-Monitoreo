/**
 * @file ForgotPasswordForm.tsx
 * @route frontend/src/components/auth
 * @description
 * Componente de UI para el formulario de solicitud de restablecimiento de contraseña.
 * Asegura la ruta correcta de activos estáticos, redirige a usuarios autenticados, y maneja mensajes específicos de éxito/error.
 * @author Kevin Mariano
 * @version 1.0.1
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
*/

'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import getConfig from 'next/config'; 
import { useRouter } from 'next/navigation'; 
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext'; 
import { authService } from '@/services/authService';
import { Mail, Send, Sun, Moon, AlertTriangle, X, CheckCircle } from 'lucide-react';

/**
 * @component ForgotPasswordForm
 * @description Presenta el formulario para solicitar el restablecimiento de contraseña. 
 * Redirige al dashboard si el usuario ya está autenticado y asegura la ruta base de la imagen.
 * @returns {React.ReactElement} El formulario de recuperación de contraseña renderizado.
 */
export const ForgotPasswordForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    
    const { theme, toggleTheme } = useTheme();
    const router = useRouter(); 
    const { isAuthenticated } = useAuth(); 

    const [basePath, setBasePath] = useState(''); 
    
    useEffect(() => {
        if (isAuthenticated) {
            router.replace('/dashboard');
            return;
        }

        try {
            const config = getConfig() || {};
            const path = config.publicRuntimeConfig?.basePath || '';
            setBasePath((path === '' || path === '/') ? '/acuaponia' : path);
        } catch (e) {
            setBasePath('/acuaponia');
        }
    }, [isAuthenticated, router]); 

    /**
     * @description Maneja el envío del formulario, realizando la llamada al servicio para solicitar el enlace de restablecimiento.
     * Implementa mensajes específicos de éxito y error.
     * @param {FormEvent<HTMLFormElement>} e - Evento de formulario.
     */
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!email.trim()) {
            setError('Por favor, ingrese su correo electrónico.');
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('El formato del correo electrónico no es válido.');
            return;
        }
        
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            await authService.forgotPassword(email);
            setSuccessMessage('El enlace de restablecimiento de contraseña ha sido enviado a su correo.');
        } catch (err: any) {
            const errorMessage = err.message || '';
            
            if (errorMessage.includes('not found') || errorMessage.includes('no está asociado')) {
                setError('El correo electrónico no está asociado a ninguna cuenta.');
            } else if (errorMessage.includes('failed to send') || errorMessage.includes('falló el envío')) {
                setError('Ocurrió un error al enviar el correo. Por favor, intente de nuevo.');
            } else {
                setError('Ocurrió un error inesperado. Por favor, intente de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-gray-900 transition-colors duration-500 dark:bg-gray-900 dark:text-gray-100">
            <div className="absolute top-4 right-4 z-10">
                <button
                    onClick={toggleTheme}
                    className="rounded-full bg-gray-200/50 p-2 transition-all hover:bg-gray-300 dark:bg-gray-700/50 dark:hover:bg-gray-600"
                    aria-label="Cambiar tema"
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
            </div>

            <main className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-500 sm:max-w-md sm:px-0">
                <header className="mb-6 text-center">
                    <div className="relative mx-auto mb-3 h-16 w-16">
                         {/*<img
                            src={`${basePath}/logo-sena.png`}
                            alt="Logo del SENA"
                            className="object-contain w-full h-full" 
                            loading="eager"
                        />*/}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recuperar Contraseña</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Ingrese su correo para recibir instrucciones</p>
                </header>

                <div className="rounded-xl border border-gray-200 bg-white/80 p-8 shadow-xl backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-800/80">
                    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="email">
                                Correo Electrónico Registrado
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <input 
                                    id="email" 
                                    type="email" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500" 
                                    placeholder="usuario@gmail.com" 
                                    required 
                                />
                            </div>
                        </div>
                        {/* Renderizado de Mensajes de Error */}
                        {error && (
                            <div className="relative flex items-center justify-between rounded-xl border border-red-400/50 bg-red-100/80 px-4 py-3 text-red-700 dark:bg-red-900/50 dark:text-red-300" role="alert">
                                <div className="flex items-center">
                                    <AlertTriangle className="mr-3 h-5 w-5" />
                                    <span className="block text-sm sm:inline">{error}</span>
                                </div>
                                <button type="button" onClick={() => setError(null)} aria-label="Cerrar alerta">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        )}

                        {/* Renderizado de Mensaje de Éxito */}
                        {successMessage && (
                             <div className="relative flex items-center rounded-xl border border-green-400/50 bg-green-100/80 px-4 py-3 text-green-700 dark:bg-green-900/50 dark:text-green-300" role="alert">
                                <CheckCircle className="mr-3 h-5 w-5" />
                                <span className="block text-sm sm:inline">{successMessage}</span>
                            </div>
                        )}

                        <button type="submit" disabled={loading || !!successMessage} className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-green-600 to-green-700 py-3 font-semibold text-white hover:from-green-700 hover:to-green-800 disabled:cursor-not-allowed disabled:opacity-60">
                            <Send className="h-5 w-5" />
                            <span>{loading ? 'Enviando...' : 'Enviar Enlace'}</span>
                        </button>
                    </form>
                    <div className="mt-4 text-center">
                        <Link 
                            href="/login" 
                            className="text-sm text-gray-600 transition-colors hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400"
                        >
                            Volver a Inicio de Sesión
                        </Link>
                    </div>
                </div>
                 <footer className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
                    <p>© {new Date().getFullYear()} Sistema de Monitoreo - Todos los derechos reservados</p>
                    <p>Desarrollado por Kevin Mariano</p>
                </footer>
            </main>
        </div>
    );
};