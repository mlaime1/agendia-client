export function formatCurrency(value: string | number): string {
  const amount = typeof value === 'number' ? value : parseFloat(value || '0');
  return amount.toLocaleString('es-AR', { maximumFractionDigits: 0 });
}
