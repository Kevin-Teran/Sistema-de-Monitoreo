/**
 * @file AlertsSummaryCharts.tsx
 * @route frontend/src/components/analytics/
 * @description Resumen minimalista de alertas por tipo y severidad.
 */

'use client';

import React from 'react';
import { Card } from '@/components/common/Card';
import { AlertSummary } from '@/types';
import { AlertTriangle, Bell, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '../common/Skeleton';

interface AlertsSummaryChartsProps {
  summary: AlertSummary | null;
  loading: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  TEMPERATURE_HIGH: 'bg-rose-500',
  TEMPERATURE_LOW: 'bg-orange-400',
  PH_HIGH: 'bg-sky-500',
  PH_LOW: 'bg-blue-400',
  OXYGEN_HIGH: 'bg-cyan-500',
  OXYGEN_LOW: 'bg-amber-400',
  SENSOR_DISCONNECTED: 'bg-slate-400',
  SYSTEM_FAILURE: 'bg-red-700',
};

const SEVERITY_COLORS: Record<string, string> = {
  LOW: 'bg-emerald-500',
  INFO: 'bg-sky-500',
  MEDIUM: 'bg-amber-500',
  WARNING: 'bg-amber-500',
  HIGH: 'bg-red-500',
  ERROR: 'bg-red-500',
  CRITICAL: 'bg-red-800',
};

const TYPE_LABELS: Record<string, string> = {
  TEMPERATURE_HIGH: 'Temperatura alta',
  TEMPERATURE_LOW: 'Temperatura baja',
  PH_HIGH: 'pH alto',
  PH_LOW: 'pH bajo',
  OXYGEN_HIGH: 'Oxigeno alto',
  OXYGEN_LOW: 'Oxigeno bajo',
  SENSOR_DISCONNECTED: 'Sensor desconectado',
  SYSTEM_FAILURE: 'Falla del sistema',
};

const SEVERITY_LABELS: Record<string, string> = {
  LOW: 'Baja',
  INFO: 'Informativa',
  MEDIUM: 'Media',
  WARNING: 'Advertencia',
  HIGH: 'Alta',
  ERROR: 'Error',
  CRITICAL: 'Critica',
};

interface AlertRow {
  key: string;
  label: string;
  value: number;
  color: string;
}

const SummaryList = ({ title, rows }: { title: string; rows: AlertRow[] }) => {
  const total = rows.reduce((sum, row) => sum + row.value, 0);

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {total}
        </span>
      </div>

      <div className="space-y-3">
        {rows.map((row) => {
          const percent = total > 0 ? Math.round((row.value / total) * 100) : 0;

          return (
            <div key={row.key} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${row.color}`} />
                  <span className="truncate text-slate-700 dark:text-slate-200">{row.label}</span>
                </div>
                <span className="shrink-0 font-semibold text-slate-600 dark:text-slate-300">
                  {row.value} ({percent}%)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className={`h-full rounded-full ${row.color}`} style={{ width: `${percent}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export const AlertsSummaryCharts: React.FC<AlertsSummaryChartsProps> = ({ summary, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="h-56">
          <Skeleton className="h-full w-full" />
        </Card>
        <Card className="h-56">
          <Skeleton className="h-full w-full" />
        </Card>
      </div>
    );
  }

  const typeRows = summary?.alertsByType?.map((item) => ({
    key: item.type,
    label: TYPE_LABELS[item.type] || item.type.replace(/_/g, ' '),
    value: item._count.type,
    color: TYPE_COLORS[item.type] || 'bg-slate-400',
  })) || [];

  const severityRows = summary?.alertsBySeverity?.map((item) => ({
    key: item.severity,
    label: SEVERITY_LABELS[item.severity] || item.severity,
    value: item._count.severity,
    color: SEVERITY_COLORS[item.severity] || 'bg-slate-400',
  })) || [];

  const totalAlerts = typeRows.reduce((sum, row) => sum + row.value, 0);

  if (totalAlerts === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-emerald-50 p-3 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Sin alertas en este periodo</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No se encontraron eventos para los filtros seleccionados.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-50 p-3 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{totalAlerts} alertas encontradas</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Resumen del periodo seleccionado.</p>
            </div>
          </div>
          {severityRows.some((row) => row.key === 'CRITICAL' || row.key === 'HIGH') && (
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-300">
              <AlertTriangle className="h-4 w-4" />
              Revisar prioridades
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SummaryList title="Por tipo de evento" rows={typeRows} />
        <SummaryList title="Por prioridad" rows={severityRows} />
      </div>
    </div>
  );
};
