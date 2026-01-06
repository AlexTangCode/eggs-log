
export interface Hen {
  id: string;
  name: string;
  breed: string;
  age: string | number;
  color: string;
  createdAt: number;
  health_status?: 'Optimal' | 'Observation' | 'Critical';
}

export interface EggLog {
  id: string;
  henId: string;
  henName: string;
  weight: number; // in grams
  quantity: number; // number of eggs
  timestamp: number;
}

export enum View {
  HOME = 'home',
  STATISTICS = 'statistics',
  HEALTH = 'health',
  HENS = 'hens'
}
