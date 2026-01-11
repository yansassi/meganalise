
export enum Platform {
  PAINEL = 'Painel',
  YOUTUBE = 'YouTube',
  INSTAGRAM = 'Instagram',
  TIKTOK = 'TikTok',
  FACEBOOK = 'Facebook',
  EVIDENCIA = 'Evidência',
  CONFIGURACOES = 'Configurações'
}

export interface MetricCardData {
  label: string;
  value: string;
  type: 'green' | 'white' | 'purple' | 'blue' | 'orange';
  icon: string;
  large?: boolean;
}

export interface ChartDataPoint {
  month: string;
  value: number; // Positive or negative
}
