/**
 * @file ResetPasswordForm.tsx
 * @route frontend/src/components/auth
 * @description Componente de UI para el formulario de restablecimiento de contraseña.
 * Asegura la ruta correcta de activos estáticos, redirige a usuarios autenticados, y maneja mensajes específicos de éxito/error.
 * @author Kevin Mariano
 * @version 1.0.3
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
*/

'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
// Ya no necesitamos Image, usaremos <img>
import getConfig from 'next/config'; 
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext'; 
import { ResetPasswordCredentials } from '@/types';
import { authService } from '@/services/authService';
import { useParams, useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, KeyRound, Sun, Moon, AlertTriangle, X, CheckCircle } from 'lucide-react';

/**
 * @component ResetPasswordForm
 * @description Permite al usuario establecer una nueva contraseña utilizando un token. 
 * Redirige a usuarios ya autenticados y maneja errores de token.
 * @returns {React.ReactElement} El formulario de restablecimiento de contraseña renderizado.
 */
export const ResetPasswordForm: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    
    const { theme, toggleTheme } = useTheme();
    const params = useParams();
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    
    // **CORRECCIÓN DE RUTA:** Usar estado para cargar basePath de forma segura
    const [basePath, setBasePath] = useState(''); 
    
    // Obtener el token de la URL (puede ser undefined si no está en la ruta)
    const token = params.token as string;

    useEffect(() => {
        // 1. Redirigir si ya está autenticado (Seguridad)
        if (isAuthenticated) {
            router.replace('/dashboard');
            return;
        }

        // 2. Lógica para asegurar el basePath (necesario para el logo y el enlace)
        try {
            const config = getConfig() || {};
            const path = config.publicRuntimeConfig?.basePath || '';
            // Garantizar que basePath sea '/acuaponia' si la lectura es '' o '/'
            setBasePath((path === '' || path === '/') ? '/acuaponia' : path);
        } catch (e) {
            // Fallback
            setBasePath('/acuaponia');
        }
    }, [isAuthenticated, router]); 

    /**
     * @description Maneja el envío del formulario, validando contraseñas y realizando la llamada a la API para restablecer la contraseña.
     * @param {FormEvent<HTMLFormElement>} e - Evento de formulario.
     */
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        // **Verificación CRÍTICA del token antes de la llamada a la API**
        if (!token) {
            setError('Error: El enlace de restablecimiento está incompleto o es inválido.');
            return;
        }

        // 1. Validaciones de cliente
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }
        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }
    
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
    
        try {
            const credentials: ResetPasswordCredentials = { 
                token: token,
                newPassword: password
            };
            await authService.resetPassword(credentials); 
            
            setSuccessMessage('Contraseña actualizada con éxito. Serás redirigido a iniciar sesión en 3 segundos...');
            
            setTimeout(() => {
                router.push(`${basePath}/login`); 
            }, 3000);
        } catch (err: any) {
            setError('El enlace de restablecimiento es inválido o ha expirado. Por favor, solicita un nuevo enlace.');
        } finally {
            setLoading(false);
        }
    };

    if (!token && basePath) {
        return (
             <div className="relative flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-gray-900 transition-colors duration-500 dark:bg-gray-900 dark:text-gray-100 w-full">
                <main className="w-full max-w-sm text-center">
                    <h1 className="text-3xl font-bold text-red-600 dark:text-red-400">Enlace Inválido</h1>
                    <p className="mt-4 text-gray-700 dark:text-gray-300">
                        El enlace de restablecimiento está incompleto o es incorrecto. Por favor, solicita uno nuevo.
                    </p>
                    <Link 
                        href={`${basePath}/forgot-password`} 
                        className="mt-6 inline-block text-sm text-green-600 transition-colors hover:text-green-700 dark:hover:text-green-400 font-semibold"
                    >
                        Solicitar un nuevo enlace
                    </Link>
                </main>
            </div>
        );
    }
    
    if (!basePath) {
        return <div className="flex h-screen items-center justify-center text-gray-500">Cargando configuración...</div>;
    }


    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 text-gray-900 transition-colors duration-500 dark:bg-gray-900 dark:text-gray-100 w-full">
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
                    {/**
                    <div className="relative mx-auto mb-3 h-16 w-16">
                          
                          <img
                            src={`${basePath}/logo-sena.png`}
                            alt="Logo del SENA"
                            className="object-contain w-full h-full" 
                            loading="eager"
                        />
                    </div> */}
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Establecer Nueva Contraseña</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Crea una contraseña segura y fácil de recordar</p>
                </header>

                <div className="rounded-xl border border-gray-200 bg-white/80 p-8 shadow-xl backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-800/80">
                    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="password">
                                Nueva Contraseña
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <input 
                                    id="password" 
                                    type={showPassword ? 'text' : 'password'} 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-12 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500" 
                                    placeholder="Mínimo 6 caracteres" 
                                    required 
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                         <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="confirmPassword">
                                Confirmar Contraseña
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <input 
                                    id="confirmPassword" 
                                    type={showPassword ? 'text' : 'password'} 
                                    value={confirmPassword} 
                                    onChange={(e) => setConfirmPassword(e.target.value)} 
                                    className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-12 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500" 
                                    placeholder="Repite la contraseña" 
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
                            <KeyRound className="h-5 w-5" />
                            <span>{loading ? 'Actualizando...' : 'Actualizar Contraseña'}</span>
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