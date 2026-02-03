
export type Status = 'Ottimale' | 'Attenzione' | 'Critico' | 'Manutenzione';

export interface Device {
  id: string;
  nfcId?: string; // NFC Tag identifier
  name: string;
  type: string;
  location: string;
  lastChecked: string;
  status: Status;
  imageUrl?: string; // Base64 or URL of the asset image
  specifications: {
    maxTemp: number;
    maxPressure: number;
    minEfficiency: number;
  };
}

export interface CheckEntry {
  deviceId: string;
  timestamp: string;
  temperature: number;
  pressure: number;
  efficiency: number;
  functionalityStatus: 'Passa' | 'Fallito';
  notes: string;
}

export interface Round {
  id: string;
  operatorName: string;
  startTime: string;
  endTime?: string;
  status: 'In Corso' | 'Completato';
  entries: CheckEntry[];
}

export interface DashboardStats {
  totalDevices: number;
  criticalIssues: number;
  avgEfficiency: number;
  pendingChecks: number;
}
