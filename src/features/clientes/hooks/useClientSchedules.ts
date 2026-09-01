import { useState, useEffect, useCallback } from 'react';
import { clientsService } from '../../../services/clients';
import type { ServiceSchedule, CreateScheduleDto, UpdateScheduleDto } from '../../../services/types';
import { useAuth } from '../../../state/AuthContext';
import { usePermissions } from '../../../permissions';

interface UseClientSchedulesReturn {
  schedules: ServiceSchedule[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createSchedule: (data: CreateScheduleDto) => Promise<ServiceSchedule>;
  updateSchedule: (scheduleId: string, data: UpdateScheduleDto) => Promise<ServiceSchedule>;
  deleteSchedule: (scheduleId: string) => Promise<void>;
  bulkReplace: (schedules: CreateScheduleDto[]) => Promise<ServiceSchedule[]>;
}

export function useClientSchedules(clientId: string | null): UseClientSchedulesReturn {
  const { userProfile } = useAuth();
  const permissions = usePermissions(userProfile);
  const [schedules, setSchedules] = useState<ServiceSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = useCallback(async () => {
    if (!clientId) {
      setSchedules([]);
      setLoading(false);
      return;
    }
    if (!permissions.canAccessClient(clientId)) {
      setSchedules([]);
      setError('No tienes permiso para acceder a este cliente.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await clientsService.getSchedules(clientId);
      setSchedules(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar horarios');
    } finally {
      setLoading(false);
    }
  }, [clientId, permissions]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const createSchedule = async (data: CreateScheduleDto) => {
    if (!clientId) throw new Error('No hay cliente seleccionado');
    const newSchedule = await clientsService.createSchedule(clientId, data);
    setSchedules((prev) => [...prev, newSchedule]);
    return newSchedule;
  };

  const updateSchedule = async (scheduleId: string, data: UpdateScheduleDto) => {
    if (!clientId) throw new Error('No hay cliente seleccionado');
    const updated = await clientsService.updateSchedule(clientId, scheduleId, data);
    setSchedules((prev) => prev.map((s) => (s.id === scheduleId ? updated : s)));
    return updated;
  };

  const deleteSchedule = async (scheduleId: string) => {
    if (!clientId) throw new Error('No hay cliente seleccionado');
    await clientsService.deleteSchedule(clientId, scheduleId);
    setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
  };

  const bulkReplace = async (newSchedules: CreateScheduleDto[]) => {
    if (!clientId) throw new Error('No hay cliente seleccionado');
    const result = await clientsService.bulkReplaceSchedules(clientId, { schedules: newSchedules });
    setSchedules(result);
    return result;
  };

  return {
    schedules,
    loading,
    error,
    refetch: fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    bulkReplace,
  };
}
