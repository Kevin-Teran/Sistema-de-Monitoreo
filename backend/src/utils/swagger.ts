/**
 * @file swagger.ts
 * @route backend/src/utils
 * @description Configuración e inicialización de Swagger para la documentación de la API.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * Configura y habilita la interfaz de Swagger (OpenAPI) para la aplicación NestJS.
 *
 * Crea un documento de API basado en los decoradores de Swagger en los controladores
 * y lo sirve en la ruta '/api-docs'.
 *
 * @param {INestApplication} app - La instancia de la aplicación NestJS.
 * @returns {void} No retorna ningún valor.
 * @example
 * // En tu archivo main.ts
 * import { setupSwagger } from './utils/swagger';
 *
 * async function bootstrap() {
 * const app = await NestFactory.create(AppModule);
 * setupSwagger(app); // Así se invoca
 * await app.listen(3000);
 * }
 * bootstrap();
 */
export const setupSwagger = (app: INestApplication): void => {
  const config = new DocumentBuilder()
    .setTitle('Acuaponía API')
    .setDescription('Documentación completa de la API para el sistema de Monitoreo.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api-docs', app, document);
};