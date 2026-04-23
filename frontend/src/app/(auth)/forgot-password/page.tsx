/**
 * @file page.tsx
 * @route /frontend/src/app/(auth)/forgot-password/
 * @description
 * Página que renderiza el componente del formulario para solicitar el
 * restablecimiento de la contraseña.
 * @author Kevin Mariano
 * @version 12.0.0
 * @since 12.0.0
 */

import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}