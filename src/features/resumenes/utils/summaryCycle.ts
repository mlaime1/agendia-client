export function getCycleLabel(periodType: string): string {
  if (periodType === 'weekly') return 'Semanal';
  if (periodType === 'biweekly') return 'Quincenal';
  if (periodType === 'monthly') return 'Mensual';
  if (periodType === 'manual') return 'Manual';
  return periodType;
}
