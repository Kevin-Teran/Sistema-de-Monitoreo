/**
 * @file LoginForm.tsx
 * @route frontend/src/components/auth
 * @description Componente de UI para el formulario de inicio de sesión con manejo de tema y autocompletado.
 * @author Kevin Mariano
 * @version 1.0.1
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
*/

'use client';

import React, { useState, FormEvent, useCallback, useEffect } from 'react';
import Link from 'next/link'; 
import getConfig from 'next/config';
import { useRouter } from 'next/navigation'; 
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { User, Lock, Eye, EyeOff, LogIn, Sun, Moon, AlertTriangle, X } from 'lucide-react';

/**
 * @component LoginForm
 * @description Presenta el formulario de inicio de sesión. 
 * Asegura que las rutas estáticas y de navegación respeten el basePath configurado.
 * @returns {React.ReactElement} El formulario de login renderizado.
 */
export const LoginForm: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const { login, loading, isAuthenticated } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();
    
    const [basePath, setBasePath] = useState(''); 
    
    useEffect(() => {
        try {
            const config = getConfig() || {};
            const path = config.publicRuntimeConfig?.basePath || '';
            setBasePath((path === '' || path === '/') ? '/acuaponia' : path);
        } catch (e) {
            setBasePath('/acuaponia');
        }

        if (isAuthenticated) {
            router.replace('/dashboard');
        }
    }, [isAuthenticated, router]);
    
    /**
     * @description Valida que los campos de correo y contraseña no estén vacíos y que el correo sea válido.
     * @returns {boolean} True si el formulario es válido.
     */
    const validateForm = useCallback((): boolean => {
        if (!email.trim() || !password.trim()) {
            setError('Por favor, ingrese su correo y contraseña.');
            return false;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setError('El formato del correo electrónico no es válido.');
            return false;
        }
        setError(null);
        return true;
    }, [email, password]);

    /**
     * @description Maneja el envío del formulario.
     * @param {FormEvent<HTMLFormElement>} e - Evento de formulario.
     */
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (loading || !validateForm()) return;
        try {
            await login({ email, password, rememberMe });
        } catch (err: any) {
            setError(err.message || 'Las credenciales proporcionadas son incorrectas.');
        }
    };
    
    /**
     * @description Creador de handlers para limpiar errores al escribir en un input.
     * @param {React.Dispatch<React.SetStateAction<string>>} setter - Función setter del estado.
     * @returns {React.ChangeEventHandler<HTMLInputElement>} Handler del evento onChange.
     */
    const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setter(e.target.value);
        if (error) setError(null);
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
                    {/*<div className="relative mx-auto mb-3 h-16 w-16">
                        <img
                            src={`${basePath}/logo-sena.png`}
                            alt="Logo del SENA, Servicio Nacional de Aprendizaje de Colombia"
                            loading="eager"
                            className="object-contain w-full h-full" 
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sistema de Monitoreo de Acuaponía</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Servicio Nacional de Aprendizaje (SENA)</p>*/}
                    <div className="flex flex-col items-center justify-center space-y-1">
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                            Sistema de <span className="text-green-600 dark:text-green-500">Monitoreo</span>
                        </h1>
                        <div className="h-1 w-20 rounded-full bg-green-600 dark:bg-green-500"></div>
                    </div>
                </header>

                <div className="rounded-xl border border-gray-200 bg-white/80 p-8 shadow-xl backdrop-blur-sm dark:border-gray-700/50 dark:bg-gray-800/80">
                    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="email">
                                Correo Electrónico
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <input 
                                    id="email" 
                                    type="email" 
                                    value={email} 
                                    onChange={handleInputChange(setEmail)} 
                                    className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500"
                                    placeholder="acuaponiasena@gmail.com" 
                                    required 
                                />
                            </div>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="password">
                                Contraseña
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <input 
                                    id="password" 
                                    type={showPassword ? 'text' : 'password'} 
                                    value={password} 
                                    onChange={handleInputChange(setPassword)} 
                                    className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-12 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-500"
                                    placeholder="Mínimo 6 caracteres" 
                                    required 
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <input id="remember-me" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">Recordar sesión</label>
                        </div>
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
                        <button type="submit" disabled={loading} className="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-green-600 to-green-700 py-3 font-semibold text-white hover:from-green-700 hover:to-green-800 disabled:cursor-not-allowed disabled:opacity-60">
                            <LogIn className="h-5 w-5" />
                            <span>{loading ? 'Ingresando...' : 'Iniciar Sesión'}</span>
                        </button>
                    </form>
                    <div className="mt-4 text-center">
                        <Link 
                            href="/forgot-password"
                            className="text-sm text-gray-600 transition-colors hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400"
                        >
                            ¿Olvidaste tu contraseña?
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