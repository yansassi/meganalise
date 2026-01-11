
import { MetricCardData, ChartDataPoint } from './types';

export const METRICS: MetricCardData[] = [
  { label: 'Alcance Total', value: '1.602.232', type: 'green', icon: 'fa-regular fa-eye' },
  { label: 'Visualizações', value: '3.529.149', type: 'white', icon: 'fa-solid fa-arrow-trend-up' },
  { label: 'Interações', value: '9.989', type: 'purple', icon: 'fa-solid fa-heart' },
  { label: 'Seguidores (Saldo)', value: '-59', type: 'blue', icon: 'fa-solid fa-user-group' },
];

export const SECONDARY_METRICS: MetricCardData[] = [
  { label: 'Visitas ao Perfil', value: '85.325', type: 'white', icon: 'fa-solid fa-user-check', large: true },
  { label: 'Cliques no Link', value: '28.259', type: 'orange', icon: 'fa-solid fa-link', large: true },
];

export const GROWTH_DATA: ChartDataPoint[] = [
  { month: 'JAN', value: 30 },
  { month: 'FEV', value: -20 },
  { month: 'MAR', value: -40 },
  { month: 'ABR', value: -65 },
  { month: 'MAI', value: -35 },
  { month: 'JUN', value: 45 },
  { month: 'JUL', value: 50 },
  { month: 'AGO', value: 80 },
  { month: 'SET', value: -25 },
  { month: 'OUT', value: -85 },
  { month: 'NOV', value: -50 },
  { month: 'DEZ', value: 75 },
  // Extra bars to match the visual complexity of the image (more than 12 bars displayed)
  { month: 'JAN', value: 90 },
  { month: 'FEV', value: 55 },
  { month: 'MAR', value: 20 },
  { month: 'ABR', value: -90 },
  { month: 'MAI', value: -60 },
  { month: 'JUN', value: -25 },
];
