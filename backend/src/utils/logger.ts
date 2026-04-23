/**
 * @file logger.ts
 * @route backend/src/utils
 * @description 
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { createLogger, format, transports } from 'winston';

/**
 * @description Configuración del logger de la aplicación usando Winston.
 * Proporciona un formato legible en consola durante el desarrollo
 * y un formato más detallado para producción.
 */
export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  transports: [
    // En producción, podrías añadir transportes a archivos o servicios de logging.
    // new transports.File({ filename: 'error.log', level: 'error' }),
    // new transports.File({ filename: 'combined.log' }),
  ],
});

// Si no estamos en producción, añadimos un formato más legible a la consola.
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.timestamp({ format: 'HH:mm:ss' }),
        format.printf(({ timestamp, level, message, stack }) => {
          let log = `${timestamp} ${level}: ${message}`;
          if (stack) {
            log += `\n${stack}`;
          }
          return log;
        }),
      ),
    }),
  );
}