/**
 * @file Card.tsx
 * @route frontend/src/components/common
 * @description Componentes modulares y reutilizables para construir tarjetas de UI.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

 import React from 'react';
 import { clsx } from 'clsx';
 
 const Card = React.forwardRef<
   HTMLDivElement,
   React.HTMLAttributes<HTMLDivElement>
 >(({ className, ...props }, ref) => (
   <div
     ref={ref}
     className={clsx(
       'bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-200 dark:border-gray-700',
       className
     )}
     {...props}
   />
 ));
 Card.displayName = 'Card';
 
 const CardHeader = React.forwardRef<
   HTMLDivElement,
   React.HTMLAttributes<HTMLDivElement>
 >(({ className, ...props }, ref) => (
   <div
     ref={ref}
     className={clsx('flex flex-col space-y-1.5 p-6', className)}
     {...props}
   />
 ));
 CardHeader.displayName = 'CardHeader';
 
 const CardTitle = React.forwardRef<
   HTMLParagraphElement,
   React.HTMLAttributes<HTMLHeadingElement>
 >(({ className, ...props }, ref) => (
   <h3
     ref={ref}
     className={clsx(
       'text-lg font-semibold leading-none tracking-tight',
       className
     )}
     {...props}
   />
 ));
 CardTitle.displayName = 'CardTitle';
 
 const CardDescription = React.forwardRef<
   HTMLParagraphElement,
   React.HTMLAttributes<HTMLParagraphElement>
 >(({ className, ...props }, ref) => (
   <p
     ref={ref}
     className={clsx('text-sm text-gray-500 dark:text-gray-400', className)}
     {...props}
   />
 ));
 CardDescription.displayName = 'CardDescription';
 
 const CardContent = React.forwardRef<
   HTMLDivElement,
   React.HTMLAttributes<HTMLDivElement>
 >(({ className, ...props }, ref) => (
   <div ref={ref} className={clsx('p-6 pt-0', className)} {...props} />
 ));
 CardContent.displayName = 'CardContent';
 
 const CardFooter = React.forwardRef<
   HTMLDivElement,
   React.HTMLAttributes<HTMLDivElement>
 >(({ className, ...props }, ref) => (
   <div
     ref={ref}
     className={clsx('flex items-center p-6 pt-0', className)}
     {...props}
   />
 ));
 CardFooter.displayName = 'CardFooter';
 
 export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };