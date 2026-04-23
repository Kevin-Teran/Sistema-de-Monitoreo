/**
 * @file page.tsx
 * @route frontend/src/app/(main)/dashboard
 * @description Página principal del dashboard completamente corregida y optimizada
 * @author Kevin Mariano
 * @version 1.0.0
 * @since 1.0.0
 *@copyright Sistema de Monitoreo  2025
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useDashboard } from '@/hooks/useDashboard';
import { useInfrastructure } from '@/hooks/useInfrastructure';
import {
	DashboardFilters,
	SummaryCards,
	GaugeChart,
	AdminStatCards,
} from '@/components/dashboard';
import { Card } from '@/components/common/Card';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Role, SensorType, UserSettings } from '@/types';
import { getSettings } from '@/services/settingsService';
import { Container } from 'lucide-react';
import { format as formatDate } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';

const LineChart = dynamic(
	() =>
		import('@/components/dashboard/LineChart').then((mod) => mod.LineChart),
	{
		ssr: false,
		loading: () => (
			<div className='h-80 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700' />
		),
	},
);

const TIME_ZONE = 'America/Bogota';

/**
 * @function getInitialDates
 * @description Calcula las fechas iniciales en zona horaria local
 */
const getInitialDates = () => {
	const nowInAppTimeZone = fromZonedTime(new Date(), TIME_ZONE);
	const sevenDaysAgo = new Date(nowInAppTimeZone.getTime() - 7 * 24 * 60 * 60 * 1000);

	return {
		startDate: formatDate(sevenDaysAgo, 'yyyy-MM-dd'),
		endDate: formatDate(nowInAppTimeZone, 'yyyy-MM-dd'),
	};
};

const DashboardPage: React.FC = () => {
	const { user } = useAuth();
	
	const { tanks, fetchDataForUser } = useInfrastructure(
		user?.role === Role.ADMIN,
	);
	
	const {
		summaryData,
		realtimeData,
		historicalData,
		usersList,
		loading,
		error,
		fetchSummary,
		fetchRealtimeData,
		fetchHistoricalData,
		fetchUsersList,
	} = useDashboard();

	const [settings, setSettings] = useState<UserSettings | null>(null);
	const [filters, setFilters] = useState(() => {
		const { startDate, endDate } = getInitialDates();
		return {
			startDate,
			endDate,
			userId: user?.id,
			tankId: undefined as string | undefined,
			sensorType: undefined as SensorType | undefined,
		};
	});

	/**
	 * Inicialización del usuario y configuraciones
	 */
	useEffect(() => {
		if (user) {
			//console.log('👤 [Dashboard] Usuario autenticado:', user.email);
			
			getSettings()
				.then(userSettings => {
					//console.log('⚙️ [Dashboard] Configuraciones cargadas:', userSettings);
					setSettings(userSettings);
				})
				.catch(err => console.error('❌ [Dashboard] Error cargando configuraciones:', err));
			
			if (user.role === Role.ADMIN) {
				//console.log('👑 [Dashboard] Usuario admin, cargando lista de usuarios');
				fetchUsersList();
			}
			
			if (!filters.userId) {
				setFilters((prev) => ({ ...prev, userId: user.id }));
			}
		}
	}, [user, fetchUsersList, filters.userId]);

	/**
	 * Cargar infraestructura cuando cambia el userId
	 */
	useEffect(() => {
		if (filters.userId) {
			//console.log('🏗️ [Dashboard] Cargando infraestructura para usuario:', filters.userId);
			fetchDataForUser(filters.userId);
		}
	}, [filters.userId, fetchDataForUser]);

	/**
	 * Seleccionar el primer tanque automáticamente
	 */
	useEffect(() => {
		if (tanks.length > 0) {
			const currentTankIsValid = tanks.some((t) => t.id === filters.tankId);
			if (!filters.tankId || !currentTankIsValid) {
				setFilters((prev) => ({ ...prev, tankId: tanks[0].id }));
			}
		} else {
			if (filters.tankId) {
				setFilters((prev) => ({ ...prev, tankId: undefined }));
			}
		}
	}, [tanks, filters.tankId]);

	/**
	 * Cargar datos cuando los filtros están completos
	 */
	const memoizedFetchData = useCallback(() => {
		if (!filters.userId || !filters.tankId || !filters.startDate || !filters.endDate) {
			//console.log('⏳ [Dashboard] Filtros incompletos, esperando...', filters);
			return;
		}

		//console.log('🔄 [Dashboard] Cargando datos con filtros:', filters);
		
		fetchSummary(filters);
		fetchRealtimeData(filters);
		fetchHistoricalData(filters);
	}, [filters, fetchSummary, fetchRealtimeData, fetchHistoricalData]);

	useEffect(() => {
		memoizedFetchData();
	}, [memoizedFetchData]);

	/**
	 * Manejar cambios en los filtros
	 */
	const handleFiltersChange = (newFilters: Partial<typeof filters>) => {
		//console.log('🔧 [Dashboard] Actualizando filtros:', newFilters);
		
		setFilters((prev) => {
			const updated = { ...prev, ...newFilters };
			
			if (newFilters.userId && newFilters.userId !== prev.userId) {
				//console.log('👤 [Dashboard] Usuario cambiado, reseteando tankId');
				updated.tankId = undefined;
				updated.sensorType = undefined;
			}
			
			return updated;
		});
	};

	if (!user) {
		return (
			<div className='flex h-screen items-center justify-center'>
				<LoadingSpinner message='Verificando sesión...' />
			</div>
		);
	}

	const isAdmin = user.role === Role.ADMIN;

	const dateRange =
		filters.startDate && filters.endDate
			? { 
				from: fromZonedTime(`${filters.startDate}T00:00:00.000`, TIME_ZONE), 
				to: fromZonedTime(`${filters.endDate}T23:59:59.999`, TIME_ZONE) 
			}
			: undefined;

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.5 }}
			className='w-full'
		>
			{/* Header */}
			<div>
				<h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-3'>
					Dashboard de Monitoreo
				</h1>
				<p className='mt-1 text-gray-500 dark:text-gray-400 mb-8'>
					Bienvenido, {user.name}. Estado de tu sistema en tiempo real.
				</p>
			</div>

			{/* Filtros */}
			<DashboardFilters
				filters={filters}
				onFiltersChange={handleFiltersChange}
				tanksList={tanks}
				usersList={usersList}
				currentUserRole={user.role}
				loading={loading.users}
				
			/>
			<div className='mb-12'></div>
			{/* Mensaje de error global */}
			{error && (
				<div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-900/20">
					<p className="text-red-800 dark:text-red-200">
						⚠️ {error}
					</p>
				</div>
			)}

			{/* Estado de carga inicial */}
			{(loading.summary || loading.historical) && !summaryData && (
				<div className='py-12 text-center'>
					<LoadingSpinner />
				</div>
			)}

			{/* Mensaje cuando no hay tanque seleccionado */}
			{!filters.tankId && !loading.summary ? (
				<div className='rounded-xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-800 dark:bg-amber-900/20'>
					<Container className='mx-auto mb-4 h-16 w-16 text-amber-500' />
					<h3 className='mb-2 text-xl font-semibold text-amber-800 dark:text-amber-200'>
						Selecciona un tanque
					</h3>
					<p className='text-amber-600 dark:text-amber-400'>
						Para visualizar los datos, primero debes seleccionar un tanque.
					</p>
				</div>
			) : (
				<>
					{/* Estadísticas de Admin */}
					{isAdmin && (
						<AdminStatCards
							stats={{
								totalUsers: usersList.length,
								totalTanks: summaryData?.tanksCount,
								totalSensors: summaryData?.sensorsCount,
							}}
							loading={loading.summary}
						/>
					)}

					{/* Tarjetas de resumen */}
					<SummaryCards
						data={summaryData}
						loading={loading.summary}
						currentUserRole={user.role}
					/>

					{/* Lecturas en tiempo real */}
					<section>
						<h2 className='mb-4 text-2xl font-bold text-gray-900 dark:text-white'>
							Lecturas en Tiempo Real
						</h2>
						<GaugeChart
							data={realtimeData}
							settings={settings}
							loading={loading.realtime}
						/>
					</section>

					{/* Gráficos históricos */}
					<section>
						<h2 className='mb-4 text-2xl font-bold text-gray-900 dark:text-white'>
							Tendencias Históricas
						</h2>
						<div className='space-y-8'>
							<Card>
								<LineChart
									data={historicalData?.TEMPERATURE || []}
									title='Temperatura'
									yAxisLabel='°C'
									sensorType={SensorType.TEMPERATURE}
									settings={settings}
									loading={loading.historical}
									isLive={false}
									dateRange={dateRange}
								/>
							</Card>
							<Card>
								<LineChart
									data={historicalData?.PH || []}
									title='pH'
									yAxisLabel='pH'
									sensorType={SensorType.PH}
									settings={settings}
									loading={loading.historical}
									isLive={false}
									dateRange={dateRange}
								/>
							</Card>
							<Card>
								<LineChart
									data={historicalData?.OXYGEN || []}
									title='Oxígeno Disuelto'
									yAxisLabel='mg/L'
									sensorType={SensorType.OXYGEN}
									settings={settings}
									loading={loading.historical}
									isLive={false}
									dateRange={dateRange}
								/>
							</Card>
						</div>
					</section>
				</>
			)}
		</motion.div>
	);
};

export default DashboardPage;
