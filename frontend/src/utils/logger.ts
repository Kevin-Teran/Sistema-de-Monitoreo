/**
 * @file logger.ts
 * @route frontend/src/utils/
 * @description Una clase simple de utilidad para el registro de eventos en el frontend.
 * @author Kevin Mariano 
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */
export class Logger {
    private context: string;

    constructor(context: string) {
        this.context = context;
    }

    log(message: string, ...optionalParams: any[]) {
        console.log(`[${this.context}] ${message}`, ...optionalParams);
    }

    error(message: string, ...optionalParams: any[]) {
        console.error(`[${this.context}] ERROR: ${message}`, ...optionalParams);
    }

    warn(message: string, ...optionalParams: any[]) {
        console.warn(`[${this.context}] WARN: ${message}`, ...optionalParams);
    }

    debug(message: string, ...optionalParams: any[]) {
        console.debug(`[${this.context}] DEBUG: ${message}`, ...optionalParams);
    }
}