
import { Device } from './types';

export const MOCK_DEVICES: Device[] = [
  {
    id: 'D-101',
    name: 'Turbina Principale A',
    type: 'Turbina',
    location: 'Settore 4',
    lastChecked: '25/10/2023 08:30',
    status: 'Ottimale',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=400',
    specifications: { maxTemp: 450, maxPressure: 120, minEfficiency: 85 }
  },
  {
    id: 'D-102',
    name: 'Pompa di Raffreddamento 02',
    type: 'Pompa',
    location: 'Settore 2',
    lastChecked: '25/10/2023 09:15',
    status: 'Attenzione',
    imageUrl: 'https://images.unsplash.com/photo-1531266752426-aad4966a757d?auto=format&fit=crop&q=80&w=400',
    specifications: { maxTemp: 80, maxPressure: 45, minEfficiency: 90 }
  },
  {
    id: 'D-103',
    name: 'Ventilatore di Scarico XL',
    type: 'Ventilatore',
    location: 'Settore 5',
    lastChecked: '24/10/2023 16:45',
    status: 'Ottimale',
    imageUrl: 'https://images.unsplash.com/photo-1590950669791-ee07a7892b41?auto=format&fit=crop&q=80&w=400',
    specifications: { maxTemp: 60, maxPressure: 5, minEfficiency: 70 }
  },
  {
    id: 'D-104',
    name: 'Condensatore di Vapore',
    type: 'Scambiatore di Calore',
    location: 'Settore 4',
    lastChecked: '25/10/2023 10:00',
    status: 'Critico',
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400',
    specifications: { maxTemp: 120, maxPressure: 15, minEfficiency: 95 }
  }
];

export const APP_CONFIG = {
  operatorName: 'Alex Johnson',
  stationName: 'Centrale Elettrica Nord'
};
