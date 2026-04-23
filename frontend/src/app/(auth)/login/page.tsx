/**
 * @page page.tsx
 * @route frontend/src/app/(auth)/login
 * @description Página que presenta la interfaz de inicio de sesión a los usuarios.
 * Está diseñada para ser visualmente atractiva y funcional.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { LoginForm } from '@/components/auth/LoginForm';
import { Suspense } from 'react';
 
/**
  * @component LoginPage
  * @returns {React.ReactElement} La página de login renderizada.
*/
export default function LoginPage() {
 return (
   <Suspense>
     <LoginForm />
   </Suspense>
 );
}