/**
 * @file index.ts
 * @route frontend/src/types
 * @description Archivo central para la definición de tipos y enumeraciones de TypeScript
 * utilizados en toda la aplicación frontend. Proporciona tipado estático robusto
 * para mejorar la experiencia de desarrollo y prevenir errores en tiempo de ejecución.
 * @author kevin mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

/**
 * @enum {string} Role
 * @description Enumeración que define los roles disponibles en el sistema de Monitoreo.
 * Controla los permisos y accesos de los usuarios a diferentes funcionalidades.
 * @example
 * // Uso en componentes
 * if (user.role === Role.ADMIN) {
 * return <AdminPanel />;
 * }
 */
export enum Role {
  /** Administrador del sistema con acceso completo */
  ADMIN = 'ADMIN',
  /** Usuario regular con acceso limitado */
  USER = 'USER',
}

/**
 * @enum {string} SensorType
 * @description Tipos de sensores disponibles en el sistema de monitoreo acuapónico.
 * Cada tipo tiene características específicas de medición y rangos de operación.
 * @example
 * const temperatureSensor = {
 * type: SensorType.TEMPERATURE,
 * unit: '°C',
 * range: { min: 0, max: 50 }
 * };
 */
export enum SensorType {
  /** Sensor de temperatura del agua */
  TEMPERATURE = 'TEMPERATURE',
  /** Sensor de pH (acidez/alcalinidad) */
  PH = 'PH',
  /** Sensor de oxígeno disuelto */
  OXYGEN = 'OXYGEN',
}

/**
 * @enum {string} TankStatus
 * @description Estados posibles de los tanques en el sistema acuapónico.
 * Determina el estado operacional y de monitoreo de cada tanque.
 */
export enum TankStatus {
  /** Tanque operativo y monitoreado */
  ACTIVE = 'ACTIVE',
  /** Tanque temporalmente fuera de servicio */
  INACTIVE = 'INACTIVE',
  /** Tanque en proceso de mantenimiento */
  MAINTENANCE = 'MAINTENANCE',
}

/**
 * @enum {string} SensorStatus
 * @description Estados operacionales de los sensores del sistema.
 * Indica la condición actual de funcionamiento de cada sensor.
 */
export enum SensorStatus {
  /** Sensor funcionando correctamente */
  ACTIVE = 'ACTIVE',
  /** Sensor temporalmente desactivado */
  INACTIVE = 'INACTIVE',
  /** Sensor con fallas o errores */
  ERROR = 'ERROR',
  /** Sensor en proceso de calibración */
  CALIBRATING = 'CALIBRATING',
}

/**
 * @enum {string} UserStatus
 * @description Estados de cuenta de los usuarios del sistema.
 */
export enum UserStatus {
  /** Cuenta activa y funcional */
  ACTIVE = 'ACTIVE',
  /** Cuenta temporalmente deshabilitada */
  INACTIVE = 'INACTIVE',
  /** Cuenta suspendida por violación de políticas */
  SUSPENDED = 'SUSPENDED',
}

/**
 * @typedef {object} User
 * @description Interfaz principal que define la estructura de un usuario del sistema.
 * Incluye información básica de identificación, autenticación y autorización.
 * @property {string} id - Identificador único UUID del usuario
 * @property {string} email - Dirección de correo electrónico única
 * @property {string} name - Nombre completo del usuario
 * @property {Role} role - Rol del usuario en el sistema
 * @property {UserStatus} status - Estado actual de la cuenta
 * @property {string} createdAt - Fecha de creación de la cuenta en formato ISO 8601
 * @property {string} [lastLogin] - Fecha del último inicio de sesión (opcional)
 * @property {object} [settings] - Configuraciones personalizadas del usuario (opcional)
 * @example
 * const user: User = {
 * id: 'clx5e2r9s0000a1b2c3d4e5f6',
 * email: 'admin@acuaponia.com',
 * name: 'Juan Administrador',
 * role: Role.ADMIN,
 * status: UserStatus.ACTIVE,
 * createdAt: '2025-01-15T10:30:00.000Z',
 * lastLogin: '2025-01-15T12:45:00.000Z'
 * };
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  lastLogin?: string;
  settings?: Record<string, any>;
}

/**
 * @typedef {object} UserFromApi
 * @description Tipo especializado para usuarios recibidos de la API con información estadística.
 * Extiende la información básica del usuario con conteos de entidades relacionadas.
 * @extends {Pick<User, 'id' | 'name' | 'email' | 'role' | 'status'>}
 * @property {{tanks: number}} _count - Conteo de tanques asociados al usuario
 * @property {string} [lastLogin] - Fecha del último inicio de sesión (opcional)
 * @property {string} createdAt - Fecha de creación de la cuenta
 * @example
 * const apiUser: UserFromApi = {
 * id: 'clx5e2r9s0000a1b2c3d4e5f6',
 * name: 'María Técnico',
 * email: 'maria@acuaponia.com',
 * role: Role.USER,
 * status: UserStatus.ACTIVE,
 * _count: { tanks: 3 },
 * createdAt: '2025-01-10T08:00:00.000Z',
 * lastLogin: '2025-01-15T09:30:00.000Z'
 * };
 */
 export type UserFromApi = Pick<User, 'id' | 'name' | 'email' | 'role' | 'status'> & {
  _count: { tanks: number };
  tanks?: Tank[];
  lastLogin?: string;
  createdAt: string;
};

/**
 * @typedef {object} LoginCredentials
 * @description Estructura de datos para las credenciales de inicio de sesión.
 * @property {string} email - Dirección de correo electrónico del usuario
 * @property {string} password - Contraseña del usuario
 * @property {boolean} [rememberMe] - Opción para mantener la sesión activa (opcional)
 * @example
 * const credentials: LoginCredentials = {
 * email: 'usuario@acuaponia.com',
 * password: 'miPassword123',
 * rememberMe: true
 * };
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * @typedef {object} CreateUserDto
 * @description DTO (Data Transfer Object) para crear un nuevo usuario.
 * Define todos los campos requeridos y opcionales para el registro.
 * @property {string} name - Nombre completo del usuario
 * @property {string} email - Dirección de correo electrónico única
 * @property {string} password - Contraseña inicial (será hasheada en el backend)
 * @property {Role} [role] - Rol del usuario (por defecto USER)
 * @property {UserStatus} [status] - Estado inicial (por defecto ACTIVE)
 * @example
 * const newUser: CreateUserDto = {
 * name: 'Carlos Rodríguez',
 * email: 'carlos@acuaponia.com',
 * password: 'password123',
 * role: Role.USER,
 * status: UserStatus.ACTIVE
 * };
 */
export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role?: Role;
  status?: UserStatus;
}

/**
 * @typedef {object} UpdateUserDto
 * @description DTO para actualizar información de un usuario existente.
 * Todos los campos son opcionales para permitir actualizaciones parciales.
 * @property {string} [name] - Nuevo nombre del usuario
 * @property {string} [email] - Nueva dirección de correo electrónico
 * @property {string} [password] - Nueva contraseña
 * @property {Role} [role] - Nuevo rol del usuario
 * @property {UserStatus} [status] - Nuevo estado del usuario
 * @example
 * const updates: UpdateUserDto = {
 * name: 'Carlos Rodríguez Senior',
 * role: Role.ADMIN
 * };
 */
export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
  status?: UserStatus;
}

/**
 * @typedef {object} Tank
 * @description Interfaz que define la estructura de un tanque acuapónico.
 * @property {string} id - Identificador único del tanque
 * @property {string} name - Nombre descriptivo del tanque
 * @property {string} location - Ubicación física del tanque
 * @property {TankStatus} status - Estado operacional del tanque
 * @property {string} userId - ID del usuario propietario
 * @property {string} createdAt - Fecha de creación del tanque
 * @property {string} updatedAt - Fecha de última actualización
 */
export interface Tank {
  id: string;
  name: string;
  location: string;
  status: TankStatus;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * @typedef {object} CreateTankDto
 * @description DTO para crear un nuevo tanque.
 * @property {string} name - Nombre del tanque
 * @property {string} location - Ubicación del tanque
 * @property {TankStatus} [status] - Estado inicial (opcional)
 * @property {string} [userId] - ID del propietario (opcional, se puede asignar automáticamente)
 */
export interface CreateTankDto {
  name: string;
  location: string;
  status?: TankStatus;
  userId?: string;
}

/**
 * @typedef {object} UpdateTankDto
 * @description DTO para actualizar un tanque existente.
 * @property {string} [name] - Nuevo nombre
 * @property {string} [location] - Nueva ubicación
 * @property {TankStatus} [status] - Nuevo estado
 */
export interface UpdateTankDto {
  name?: string;
  location?: string;
  status?: TankStatus;
}

/**
 * @typedef {object} Sensor
 * @description Interfaz para la estructura de un sensor del sistema.
 * @property {string} id - Identificador único del sensor
 * @property {string} name - Nombre descriptivo del sensor
 * @property {string} hardwareId - ID único del hardware físico
 * @property {SensorType} type - Tipo de sensor
 * @property {string} location - Ubicación del sensor
 * @property {SensorStatus} status - Estado operacional del sensor
 * @property {string} tankId - ID del tanque al que pertenece
 * @property {string} calibrationDate - Fecha de última calibración
 * @property {string} createdAt - Fecha de creación del registro
 * @property {string} updatedAt - Fecha de última actualización
 */
export interface Sensor {
  id: string;
  name: string;
  hardwareId: string;
  type: SensorType;
  location: string;
  status: SensorStatus;
  tankId: string;
  calibrationDate: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * @typedef {object} CreateSensorDto
 * @description DTO para crear un nuevo sensor.
 * @property {string} name - Nombre del sensor
 * @property {string} hardwareId - ID del hardware
 * @property {SensorType} type - Tipo de sensor
 * @property {string} location - Ubicación del sensor
 * @property {string} tankId - ID del tanque asociado
 * @property {string} calibrationDate - Fecha de calibración inicial
 */
export interface CreateSensorDto {
  name: string;
  hardwareId: string;
  type: SensorType;
  location: string;
  tankId: string;
  calibrationDate: string;
}

/**
 * @typedef {object} UpdateSensorDto
 * @description DTO para actualizar un sensor existente.
 * @property {string} [name] - Nuevo nombre
 * @property {SensorStatus} [status] - Nuevo estado
 * @property {string} [calibrationDate] - Nueva fecha de calibración
 */
export interface UpdateSensorDto {
  name?: string;
  status?: SensorStatus;
  calibrationDate?: string;
}

/**
 * @typedef {object} SensorData
 * @description Estructura de datos leídos de los sensores.
 * @property {string} timestamp - Marca de tiempo de la lectura en formato ISO 8601
 * @property {number} temperature - Valor de temperatura en grados Celsius
 * @property {number} ph - Valor de pH del agua
 * @property {number} oxygen - Nivel de oxígeno disuelto en mg/L
 * @example
 * const reading: SensorData = {
 * timestamp: '2025-01-15T14:30:00.000Z',
 * temperature: 24.5,
 * ph: 7.2,
 * oxygen: 8.3
 * };
 */
 export interface SensorData {
  sensorId?: string;
  value?: number;
  timestamp: string;
  temperature?: number;
  ph?: number;
  oxygen?: number;
}

/**
 * @typedef {object} ParameterSummary
 * @description Resumen estadístico de un parámetro específico.
 * @property {number} min - Valor mínimo registrado
 * @property {number} max - Valor máximo registrado
 * @property {number} avg - Valor promedio
 * @property {number} current - Valor actual más reciente
 */
export interface ParameterSummary {
  min: number;
  max: number;
  avg: number;
  current: number;
}

/**
 * @typedef {object} DataSummary
 * @description Resumen estadístico completo de todos los parámetros del sensor.
 * @property {ParameterSummary} temperature - Estadísticas de temperatura
 * @property {ParameterSummary} ph - Estadísticas de pH
 * @property {ParameterSummary} oxygen - Estadísticas de oxígeno
 */
export interface DataSummary {
  temperature: ParameterSummary;
  ph: ParameterSummary;
  oxygen: ParameterSummary;
}

/**
 * @typedef {object} PredictionData
 * @description Datos para análisis predictivo y proyecciones futuras.
 * @property {string} timestamp - Marca de tiempo de la predicción
 * @property {number} [actual] - Valor real medido (para datos históricos)
 * @property {number} predicted - Valor predicho por el algoritmo
 */
export interface PredictionData {
  timestamp: string;
  actual?: number;
  predicted: number;
}

/**
 * @typedef {object} HistoricalDataParams
 * @description Parámetros para consultas de datos históricos.
 * @property {string} startDate - Fecha de inicio en formato ISO 8601
 * @property {string} endDate - Fecha de fin en formato ISO 8601
 * @property {string} [tankId] - ID del tanque a consultar (opcional)
 * @property {string} [sensorId] - ID del sensor a consultar (opcional)
 * @property {SensorType} [sensorType] - Tipo de sensor a filtrar (opcional)
 * @property {number} [limit] - Límite de registros a obtener (opcional)
 */
 export interface HistoricalDataParams {
  startDate: string;
  endDate: string;
  tankId?: string;
  sensorId?: string;
  sensorType?: SensorType;
  limit?: number;
}

/**
 * @typedef {object} ApiResponse<T>
 * @description Estructura estándar de respuestas de la API.
 * @template T - Tipo de datos en la respuesta
 * @property {boolean} success - Indica si la operación fue exitosa
 * @property {string} message - Mensaje descriptivo del resultado
 * @property {T} [data] - Datos de la respuesta (opcional)
 * @property {object} [error] - Información de error (opcional)
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details: string;
  };
}

/**
 * @typedef {object} PaginatedResponse<T>
 * @description Estructura para respuestas paginadas de la API.
 * @template T - Tipo de elementos en la lista
 * @property {T[]} items - Lista de elementos de la página actual
 * @property {number} total - Total de elementos disponibles
 * @property {number} page - Página actual
 * @property {number} pageSize - Tamaño de página
 * @property {number} totalPages - Total de páginas disponibles
 */
export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * @typedef {object} MinMaxThreshold
 * @description Define el rango de valores óptimos o aceptables para un solo parámetro (min y max).
 * @property {number} min - Valor mínimo aceptable.
 * @property {number} max - Valor máximo aceptable.
 */
 export interface MinMaxThreshold {
  min: number;
  max: number;
}

/**
 * @typedef {object} ThresholdSettings
 * @description Configuraciones de umbrales para alertas y notificaciones.
 * @property {number} temperatureMin - Temperatura mínima aceptable
 * @property {number} temperatureMax - Temperatura máxima aceptable
 * @property {number} phMin - pH mínimo aceptable
 * @property {number} phMax - pH máximo aceptable
 * @property {number} oxygenMin - Oxígeno mínimo aceptable
 * @property {number} oxygenMax - Oxígeno máximo aceptable
 */
export interface ThresholdSettings {
  temperature: MinMaxThreshold;
  ph: MinMaxThreshold;
  oxygen: MinMaxThreshold;
}

/**
 * @typedef {object} NotificationSettings
 * @description Configuraciones de notificaciones del usuario.
 * @property {boolean} emailAlerts - Habilitar alertas por email
 * @property {boolean} pushNotifications - Habilitar notificaciones push
 * @property {boolean} smsAlerts - Habilitar alertas por SMS
 * @property {string[]} alertTypes - Tipos de alertas a recibir
 */
export interface NotificationSettings {
  emailAlerts: boolean;
  pushNotifications: boolean;
  smsAlerts: boolean;
  alertTypes: string[];
}

/**
 * @typedef {object} UserSettings
 * @description Configuraciones completas de usuario.
 * @property {ThresholdSettings} thresholds - Umbrales de alerta
 * @property {NotificationSettings} notifications - Configuración de notificaciones
 * @property {string} timezone - Zona horaria del usuario
 * @property {string} language - Idioma preferido
 * @property {'light' | 'dark' | 'auto'} theme - Tema visual preferido
 */
export interface UserSettings {
  thresholds: ThresholdSettings;
  notifications: NotificationSettings;
  timezone: string;
  language: string;
  theme: 'light' | 'dark' | 'auto';
}

/**
 * @typedef {object} ResetPasswordCredentials
 * @description Estructura de datos para la recuperación de contraseña.
 * @property {string} token - Token de recuperación enviado por email
 * @property {string} newPassword - Nueva contraseña a establecer
 * @example
 * const resetData: ResetPasswordCredentials = {
 * token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
 * newPassword: 'nuevaPassword123'
 * };
 */
 export interface ResetPasswordCredentials {
  token: string;
  newPassword: string;
}

/**
 * @typedef {object} TimePoint
 * @description Representa un único punto de datos en una serie de tiempo para los gráficos.
 * @property {string} timestamp - Marca de tiempo de la lectura en formato ISO 8601.
 * @property {number | null} ph - Valor de pH en ese momento.
 * @property {number | null} temperature - Valor de temperatura en °C en ese momento.
 * @property {number | null} tds - Valor de Sólidos Totales Disueltos (TDS) en ppm.
 */
export interface TimePoint {
  timestamp: string;
  ph: number | null;
  temperature: number | null;
  tds: number | null;
}

/**
 * @typedef {object} SummaryValues
 * @description Contiene los valores agregados (mínimo, máximo, promedio) para los parámetros.
 * @property {number | null} ph - Valor agregado para pH.
 * @property {number | null} temperature - Valor agregado para temperatura.
 * @property {number | null} tds - Valor agregado para TDS.
 */
export interface SummaryValues {
  ph: number | null;
  temperature: number | null;
  tds: number | null;
}

/**
 * @typedef {object} SummaryData
 * @description Estructura completa para los datos de resumen mostrados en las tarjetas del dashboard.
 * @property {SummaryValues} avg - Contiene los promedios de todos los parámetros.
 * @property {SummaryValues} max - Contiene los valores máximos registrados.
 * @property {SummaryValues} min - Contiene los valores mínimos registrados.
 */
export interface SummaryData {
  avg: SummaryValues;
  max: SummaryValues;
  min: SummaryValues;
}

/**
 * @typedef {object} LatestData
 * @description Representa la lectura de datos más reciente para los velocímetros (gauges).
 * @property {string} id - ID del punto de dato.
 * @property {number | null} ph - Último valor de pH.
 * @property {number | null} temperature - Último valor de temperatura.
 * @property {number | null} tds - Último valor de TDS.
 * @property {string} timestamp - Marca de tiempo de la lectura.
 * @property {string} sensorId - ID del sensor que tomó la lectura.
 * @property {string} tankId - ID del tanque asociado.
 */
export interface LatestData {
  id: string;
  ph: number | null;
  temperature: number | null;
  tds: number | null;
  timestamp: string;
  sensorId: string;
  tankId: string;
}

/**
 * @typedef {object} DashboardData
 * @description La estructura de datos completa que la API del dashboard devuelve.
 * @property {LatestData | null} latestData - Los datos más recientes (puede ser null si no hay).
 * @property {SummaryData} summary - Los datos agregados para las tarjetas de resumen.
 * @property {TimePoint[]} timeSeries - El array de datos para los gráficos de líneas.
 */
export interface DashboardData {
  latestData: LatestData | null;
  summary: SummaryData;
  timeSeries: TimePoint[];
}

/**
 * @typedef {object} CorrelationFilters
 * @description Define la estructura de los filtros para la consulta de correlación.
 * Corresponde al DTO 'CorrelationFiltersDto' del backend.
 */
export interface CorrelationFilters {
  userId?: string;
  tankId?: string;
  sensorId?: string;
  range?: 'hour' | 'day' | 'week' | 'month' | 'year' | 'custom';
  startDate?: string;
  endDate?: string;
  sensorTypeX: SensorType;
  sensorTypeY: SensorType;
}

/**
 * @typedef {object} KpiData
 * @description Estructura de los datos de KPI que devuelve el backend.
 */
export interface KpiData {
  average: number | null;
  max: number | null;
  min: number | null;
  count: number;
  stdDev: number | null;
}

/**
 * @typedef {object} AlertsSummaryData
 * @description Estructura del resumen de alertas que devuelve el backend.
 */
 export interface AlertsSummaryData {
  alertsByType: Array<{ type: string; _count: { type: number } }>;
  alertsBySeverity: Array<{ severity: string; _count: { severity: number } }>;
}

/**
 * @typedef {object} CorrelationDataPoint
 * @description Estructura de un punto de dato para el gráfico de correlación.
 */
export interface CorrelationDataPoint {
  x: number;
  y: number;
}

/**
 * @typedef {object} DataDateRange
 * @description Estructura para el rango de fechas de datos de un usuario.
 */
 export interface DataDateRange {
  firstDataPoint: string | null;
  lastDataPoint: string | null;
}

/**
 * @typedef {object} Kpi
 * @description Estructura para las métricas KPI de analíticas.
 * @property {number | null} average - Valor promedio
 * @property {number | null} max - Valor máximo
 * @property {number | null} min - Valor mínimo
 * @property {number} count - Cantidad de registros
 * @property {number | null} stdDev - Desviación estándar
 */
 export interface Kpi {
  average: number | null;
  max: number | null;
  min: number | null;
  count: number;
  stdDev: number | null;
}

/**
 * @typedef {object} TimeSeriesData
 * @description Estructura para datos de series temporales.
 * @property {string} timestamp - Marca de tiempo de la lectura
 * @property {number} value - Valor del sensor
 * @property {object} sensor - Información del sensor
 * @property {string} sensor.name - Nombre del sensor
 * @property {SensorType} sensor.type - Tipo de sensor
 */
export interface TimeSeriesData {
  timestamp: string;
  value: number;
  sensor: {
    name: string;
    type: SensorType;
  };
}

/**
 * @typedef {object} AlertSummary
 * @description Estructura para el resumen de alertas agrupadas.
 * @property {Array} alertsByType - Alertas agrupadas por tipo
 * @property {Array} alertsBySeverity - Alertas agrupadas por severidad
 */
export interface AlertSummary {
  alertsByType: Array<{
    type: string;
    _count: { type: number };
  }>;
  alertsBySeverity: Array<{
    severity: string;
    _count: { severity: number };
  }>;
}

/**
 * @typedef {object} CorrelationData
 * @description Estructura para datos de correlación entre sensores.
 * @property {number} x - Valor del sensor X
 * @property {number} y - Valor del sensor Y
 */
export interface CorrelationData {
  x: number;
  y: number;
}

/**
 * @enum {string} AlertType
 * @description Tipos de alertas disponibles en el sistema.
 */
export enum AlertType {
  /** Alerta de temperatura fuera de rango */
  TEMPERATURE_OUT_OF_RANGE = 'TEMPERATURE_OUT_OF_RANGE',
  /** Alerta de pH fuera de rango */
  PH_OUT_OF_RANGE = 'PH_OUT_OF_RANGE',
  /** Alerta de oxígeno fuera de rango */
  OXYGEN_OUT_OF_RANGE = 'OXYGEN_OUT_OF_RANGE',
  /** Alerta de sensor desconectado */
  SENSOR_DISCONNECTED = 'SENSOR_DISCONNECTED',
  /** Alerta de fallo del sistema */
  SYSTEM_FAILURE = 'SYSTEM_FAILURE',
}

/**
 * @enum {string} AlertSeverity
 * @description Niveles de severidad para las alertas.
 */
export enum AlertSeverity {
  /** Información general */
  INFO = 'INFO',
  /** Advertencia - requiere atención */
  WARNING = 'WARNING',
  /** Error - requiere acción inmediata */
  ERROR = 'ERROR',
  /** Crítico - fallo del sistema */
  CRITICAL = 'CRITICAL',
}

/**
 * @typedef {object} Alert
 * @description Estructura completa de una alerta del sistema.
 * @property {string} id - Identificador único de la alerta
 * @property {AlertType} type - Tipo de alerta
 * @property {AlertSeverity} severity - Severidad de la alerta
 * @property {string} message - Mensaje descriptivo de la alerta
 * @property {string} userId - ID del usuario asociado
 * @property {string} [tankId] - ID del tanque asociado (opcional)
 * @property {string} [sensorId] - ID del sensor asociado (opcional)
 * @property {boolean} resolved - Indica si la alerta fue resuelta
 * @property {string} createdAt - Fecha de creación
 * @property {string} [resolvedAt] - Fecha de resolución (opcional)
 * @property {object} [metadata] - Información adicional (opcional)
 */
export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  userId: string;
  tankId?: string;
  sensorId?: string;
  resolved: boolean;
  createdAt: string;
  resolvedAt?: string;
  metadata?: Record<string, any>;
}

/**
 * @typedef {object} CreateAlertDto
 * @description DTO para crear una nueva alerta.
 * @property {AlertType} type - Tipo de alerta
 * @property {AlertSeverity} severity - Severidad de la alerta
 * @property {string} message - Mensaje descriptivo
 * @property {string} userId - ID del usuario
 * @property {string} [tankId] - ID del tanque (opcional)
 * @property {string} [sensorId] - ID del sensor (opcional)
 * @property {object} [metadata] - Información adicional (opcional)
 */
export interface CreateAlertDto {
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  userId: string;
  tankId?: string;
  sensorId?: string;
  metadata?: Record<string, any>;
}

/**
 * @typedef {object} UpdateAlertDto
 * @description DTO para actualizar una alerta existente.
 * @property {boolean} [resolved] - Estado de resolución
 * @property {string} [resolvedAt] - Fecha de resolución
 * @property {object} [metadata] - Información adicional actualizada
 */
export interface UpdateAlertDto {
  resolved?: boolean;
  resolvedAt?: string;
  metadata?: Record<string, any>;
}

/**
 * @typedef {object} AnalyticsDateRange
 * @description Estructura para el rango de fechas de datos disponibles.
 * @property {string | null} firstDataPoint - Primera fecha con datos
 * @property {string | null} lastDataPoint - Última fecha con datos
 */
export interface AnalyticsDateRange {
  firstDataPoint: string | null;
  lastDataPoint: string | null;
}

/**
 * @typedef {object} CorrelationAnalysis
 * @description Análisis estadístico de correlación entre parámetros.
 * @property {CorrelationData[]} data - Puntos de correlación
 * @property {number} coefficient - Coeficiente de correlación de Pearson (-1 a 1)
 * @property {string} strength - Interpretación de la fuerza ('Muy Débil', 'Débil', 'Moderada', 'Fuerte', 'Muy Fuerte')
 * @property {SensorType} sensorTypeX - Tipo de sensor del eje X
 * @property {SensorType} sensorTypeY - Tipo de sensor del eje Y
 * @property {number} dataPoints - Cantidad de puntos analizados
 */
export interface CorrelationAnalysis {
  data: CorrelationData[];
  coefficient: number;
  strength: 'Muy Débil' | 'Débil' | 'Moderada' | 'Fuerte' | 'Muy Fuerte';
  sensorTypeX: SensorType;
  sensorTypeY: SensorType;
  dataPoints: number;
}

/**
 * @typedef {object} AnalyticsFilters
 * @description Filtros disponibles para consultas de analíticas.
 * @property {string} [userId] - ID del usuario
 * @property {string} [tankId] - ID del tanque
 * @property {string} [sensorId] - ID del sensor específico
 * @property {SensorType} [sensorType] - Tipo de sensor
 * @property {string} [range] - Rango de tiempo predefinido
 * @property {string} [startDate] - Fecha de inicio personalizada
 * @property {string} [endDate] - Fecha de fin personalizada
 */
export interface AnalyticsFilters {
  userId?: string;
  tankId?: string;
  sensorId?: string;
  sensorType?: SensorType;
  range?: 'hour' | 'day' | 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
}

/**
 * @typedef {object} SystemHealth
 * @description Estado general de salud del sistema.
 * @property {number} totalSensors - Total de sensores registrados
 * @property {number} activeSensors - Sensores activos
 * @property {number} inactiveSensors - Sensores inactivos
 * @property {number} errorSensors - Sensores con errores
 * @property {number} totalTanks - Total de tanques registrados
 * @property {number} activeTanks - Tanques activos
 * @property {number} totalUsers - Total de usuarios registrados
 * @property {number} activeUsers - Usuarios activos
 * @property {number} totalAlerts - Total de alertas
 * @property {number} unresolvedAlerts - Alertas sin resolver
 * @property {number} criticalAlerts - Alertas críticas
 * @property {string} lastDataReceived - Última vez que se recibieron datos
 * @property {number} uptime - Tiempo de actividad del sistema en segundos
 */
export interface SystemHealth {
  totalSensors: number;
  activeSensors: number;
  inactiveSensors: number;
  errorSensors: number;
  totalTanks: number;
  activeTanks: number;
  totalUsers: number;
  activeUsers: number;
  totalAlerts: number;
  unresolvedAlerts: number;
  criticalAlerts: number;
  lastDataReceived: string;
  uptime: number;
}


/**
 * @typedef {object} ManualEntryDto
 * @description Estructura para el registro manual de datos de un sensor.
 */
 export interface ManualEntryDto {
  sensorId: string;
  value: number;
  timestamp?: Date;
}


/**
 * @enum {string} ReportStatus
 * @description Posibles estados del ciclo de vida de un reporte.
 */
 export enum ReportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/**
 * @typedef {object} Report
 * @description Interfaz que define la estructura de un reporte.
 */
export interface Report {
  id: string;
  title: string;
  userId: string;
  generationDate: string;
  fileUrl: string;
  status: ReportStatus; 
  parameters: string | object;
  createdAt: string;
}

/**
 * @typedef {object} CreateReportDto
 * @description DTO para la creación de un reporte.
 */
export interface CreateReportDto {
  reportName: string;
  userId: string;
  startDate?: string;
  endDate?: string;
  tankId?: string;
  sensorIds?: string[];
}
