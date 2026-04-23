/**
 * @file predictions.controller.ts
 * @route backend/src/predictions
 * @description Controlador para los endpoints de generación de predicciones.
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { PredictionsService } from './predictions.service';
import { GeneratePredictionDto } from './dto/generate-prediction.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Predictions')
@Controller('predictions')
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  /**
   * @description Genera una predicción de datos de sensor basada en parámetros de entrada.
   * @param {GeneratePredictionDto} generatePredictionDto - Datos para generar la predicción.
   * @returns {Promise<any>} Los datos de la predicción generada.
   */
  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generar una nueva predicción de datos' })
  @ApiResponse({
    status: 200,
    description: 'La predicción ha sido generada exitosamente y es devuelta en la respuesta.',
  })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos.' })
  @ApiResponse({ status: 404, description: 'No se encontraron datos históricos para generar la predicción.' })
  generate(@Body() generatePredictionDto: GeneratePredictionDto) {
    return this.predictionsService.generatePrediction(generatePredictionDto);
  }
}