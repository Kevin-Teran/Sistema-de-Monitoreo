/**
 * @file ai-assistant.service.ts
 * @route backend/src/ai-assistant
 * @description Lógica de negocio para el asistente de IA 
 * POTENCIADO: Soporte híbrido para clima (Ciudad/Coordenadas) y análisis cruzado con sensores.
 * @author kevin mariano & Deiner
 * @version 2.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { sensors_type, Role, User, Prisma } from '@prisma/client'; 
import axios from 'axios';

type CurrentUser = Pick<User, 'id' | 'role'>;

interface ThresholdSettings {
  temperatureMin: number;
  temperatureMax: number;
  phMin: number;
  phMax: number;
  oxygenMin: number;
  oxygenMax: number;
}

interface LocationSettings {
  latitude?: string | number;
  longitude?: string | number;
  city?: string;
  address?: string;
}

interface UserSettingsData {
  thresholds?: ThresholdSettings;
  location?: LocationSettings | string; 
}

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);
  private readonly groqApiKey: string;
  private readonly groqApiUrl: string;
  private readonly openWeatherMapApiKey: string;

  constructor(private prisma: PrismaService) {
    this.groqApiKey = process.env.GROQ_API_KEY;
    this.groqApiUrl = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
    this.openWeatherMapApiKey = process.env.OPENWEATHERMAP_API_KEY;
    
    if (!this.groqApiKey || this.groqApiKey.length < 10) { 
      this.logger.error('GROQ_API_KEY no está definida o es inválida en el archivo .env');
    }
  }

  /**
   * @description Obtiene datos climáticos detallados soportando ubicación flexible
   * @param location Puede ser coordenadas (objeto) o nombre de ciudad (string)
   */
  private async getWeatherData(location: LocationSettings | string) {
    const DEFAULT_LAT = 4.711; 
    const DEFAULT_LON = -74.0721;
    
    if (!this.openWeatherMapApiKey) {
      return { 
          summary: 'Datos climáticos no disponibles (Falta API Key)',
          temperature: 'N/D', 
          humidity: 'N/D',
          feels_like: 'N/D',
          locationName: 'Ubicación desconocida'
      };
    }

    try {
      let apiUrl = '';
      let queryLat = DEFAULT_LAT;
      let queryLon = DEFAULT_LON;
      let queryCity = '';
      let searchMethod = 'coords';

      if (typeof location === 'string') {
        if (location.includes(',')) {
          const parts = location.split(',');
          queryLat = parseFloat(parts[0]);
          queryLon = parseFloat(parts[1]);
        } else {
          queryCity = location;
          searchMethod = 'city';
        }
      } else if (typeof location === 'object') {
        if (location.city || location.address) {
            queryCity = location.city || location.address || '';
            searchMethod = 'city';
        } else if (location.latitude && location.longitude) {
            queryLat = Number(location.latitude);
            queryLon = Number(location.longitude);
        }
      }

      if (searchMethod === 'city' && queryCity) {
        apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(queryCity)}&appid=${this.openWeatherMapApiKey}&units=metric&lang=es`;
      } else {
        apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${queryLat}&lon=${queryLon}&appid=${this.openWeatherMapApiKey}&units=metric&lang=es`;
      }

      const response = await axios.get(apiUrl);
      const data = response.data;
      
      return {
        summary: `${data.weather[0].description}, Viento: ${data.wind.speed} m/s`,
        temperature: data.main.temp.toFixed(1) + ' °C',
        humidity: data.main.humidity + '%',
        feels_like: data.main.feels_like.toFixed(1) + ' °C',
        locationName: data.name
      };

    } catch (error) {
      this.logger.warn(`No se pudo obtener el clima: ${error.message}`);
      return { 
        summary: 'No disponible temporalmente', 
        temperature: 'N/D', 
        humidity: 'N/D', 
        feels_like: 'N/D',
        locationName: 'Ubicación no detectada'
      };
    }
  }

  private async getSystemContext(user: CurrentUser) {
    try {
      const userTankWhere: Prisma.TankWhereInput = { userId: user.id, status: 'ACTIVE' };

      const userSettingsResult = await this.prisma.user.findUnique({
          where: { id: user.id },
          select: { settings: true },
      });
      
      let userSettings: UserSettingsData = {};
      let userLocation: LocationSettings | string = {};

      if (userSettingsResult?.settings) {
          try {
              const settingsObject: UserSettingsData = JSON.parse(userSettingsResult.settings);
              userSettings = settingsObject;
              userLocation = settingsObject.location || {};
          } catch (e) {
              this.logger.warn("Error al parsear la configuración del usuario:", e);
          }
      }
      
      const activeTanksCount = await this.prisma.tank.count({ where: userTankWhere });
      
      const [temperatureSensorsCount, phSensorsCount, oxygenSensorsCount] = await Promise.all([
        this.prisma.sensor.count({ where: { tank: userTankWhere, status: 'ACTIVE', type: sensors_type.TEMPERATURE } }),
        this.prisma.sensor.count({ where: { tank: userTankWhere, status: 'ACTIVE', type: sensors_type.PH } }),
        this.prisma.sensor.count({ where: { tank: userTankWhere, status: 'ACTIVE', type: sensors_type.OXYGEN } })
      ]);
      
      const totalActiveSensorsCount = temperatureSensorsCount + phSensorsCount + oxygenSensorsCount;
      
      const alertWhere: Prisma.AlertWhereInput = { resolved: false, sensor: { tank: userTankWhere } };
      const unresolvedAlertsCount = await this.prisma.alert.count({ where: alertWhere });
      
      const getSensorHistory = async (type: sensors_type) => {
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
        
        const readings = await this.prisma.sensorData.findMany({
          where: { 
            timestamp: { gte: twelveHoursAgo }, 
            sensor: { type, tank: userTankWhere }
          },
          orderBy: { timestamp: 'desc' },
          take: 50, 
          select: { value: true } 
        });
        
        if (readings.length === 0) return { latest: null, avg: null, min: null, max: null };
        
        const values = readings.map(r => 
            typeof r.value === 'number' ? r.value : (r.value as any).toNumber()
        );
        
        const sum = values.reduce((acc, val) => acc + val, 0);
        return { 
            latest: values[0], 
            avg: sum / values.length, 
            min: Math.min(...values), 
            max: Math.max(...values) 
        };
      };

      const [temperature, ph, oxygen] = await Promise.all([
          getSensorHistory(sensors_type.TEMPERATURE),
          getSensorHistory(sensors_type.PH),
          getSensorHistory(sensors_type.OXYGEN)
      ]);
      
      return { 
          role: user.role,
          userThresholds: userSettings.thresholds || null,
          userLocation, 
          activeTanksCount,
          activeSensorsCount: totalActiveSensorsCount,
          temperatureSensorsCount,
          phSensorsCount,
          oxygenSensorsCount,
          unresolvedAlertsCount,
          temperature, 
          ph, 
          oxygen, 
      };
    } catch (error) {
      this.logger.error('Error al construir el contexto del sistema para la IA:', error);
      throw new InternalServerErrorException('Error al recuperar datos del sistema para el asistente de IA.');
    }
  }

  async getAIResponse(pregunta: string, user: CurrentUser): Promise<string> {
    if (!this.groqApiKey) return "Lo siento, mi configuración interna tiene un problema (Falta API Key de IA).";

    const context = await this.getSystemContext(user);
    
    const weather = await this.getWeatherData(context.userLocation);

    const userThresholds = context.userThresholds;
    const thresholdsPrompt = userThresholds
        ? `
      - T° Min/Max: ${userThresholds.temperatureMin?.toFixed(1) ?? 'N/D'} / ${userThresholds.temperatureMax?.toFixed(1) ?? 'N/D'} °C
      - pH Min/Max: ${userThresholds.phMin?.toFixed(1) ?? 'N/D'} / ${userThresholds.phMax?.toFixed(1) ?? 'N/D'}
      - O₂ Min/Max: ${userThresholds.oxygenMin?.toFixed(1) ?? 'N/D'} / ${userThresholds.oxygenMax?.toFixed(1) ?? 'N/D'} mg/L
      `
        : '\n- Umbrales de Usuario: No configurados (Usa estándares generales).';

    const roleLabel = context.role === Role.ADMIN ? 'ADMINISTRADOR' : 'USUARIO';

    const prompt = `
      == ROL ==
      Eres "asistente de IA", el asistente experto en el Sistema de Monitoreo.
      
      == REGLA DE ORO ==
      Responde SOLO con texto natural en español. NUNCA uses Markdown, JSON, listas con asteriscos, ni formato de código. Sé fluido y amable.
      
      == DATOS DEL USUARIO (PRIVADO) ==
      Usuario: ${roleLabel}
      Estado del Sistema:
      - Tanques: ${context.activeTanksCount} activos.
      - Sensores: ${context.activeSensorsCount} activos (${context.temperatureSensorsCount} T°, ${context.phSensorsCount} pH, ${context.oxygenSensorsCount} O₂).
      - Alertas Pendientes: ${context.unresolvedAlertsCount}.
      
      == CONDICIONES AMBIENTALES (IMPORTANTE PARA EL ANÁLISIS) ==
      Ubicación detectada: ${weather.locationName}
      - Clima: ${weather.summary}
      - Temperatura Ambiente: ${weather.temperature} (Sensación: ${weather.feels_like})
      - Humedad Externa: ${weather.humidity}
      *NOTA:* Usa estos datos para contextualizar. Si hace mucho calor afuera, advierte sobre la temperatura del agua y el oxígeno.
      
      == MEDICIONES DEL AGUA (Últimas 12h) ==
      1. Temperatura Agua: Actual ${context.temperature.latest?.toFixed(1) ?? '?'}°C (Prom: ${context.temperature.avg?.toFixed(1) ?? '?'}°C)
      2. pH: Actual ${context.ph.latest?.toFixed(1) ?? '?'} (Prom: ${context.ph.avg?.toFixed(1) ?? '?'})
      3. Oxígeno: Actual ${context.oxygen.latest?.toFixed(1) ?? '?'} mg/L (Prom: ${context.oxygen.avg?.toFixed(1) ?? '?'} mg/L)
      
      == CONFIGURACIÓN DE UMBRALES ==
      ${thresholdsPrompt}

      == PREGUNTA DEL USUARIO ==
      "${pregunta}"
      
      == INSTRUCCIÓN DE RESPUESTA ==
      Analiza la pregunta cruzando los datos. Si preguntan "¿cómo está mi sistema?", incluye el factor climático en tu análisis (ej: "Tus niveles están bien, pero veo que hace calor en ${weather.locationName}, vigila el oxígeno").
    `;

    try {
      const response = await axios.post(
        this.groqApiUrl,
        {
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.1-8b-instant',
          temperature: 0.7,
        },
        { headers: { 'Authorization': `Bearer ${this.groqApiKey}`, 'Content-Type': 'application/json' } },
      );
      
      return response.data.choices[0]?.message?.content?.trim() || 'No tengo una respuesta en este momento.';
    } catch (error) {
      this.logger.error("Error Groq API:", error.message);
      throw new InternalServerErrorException('asistente de IA está tomando un descanso (Error de conexión IA).');
    }
  }
}