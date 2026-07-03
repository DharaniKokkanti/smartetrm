export interface Broker {
  brokerId: number;
  brokerCode: string;
  brokerName: string;
  brokerType: BrokerType;
  description: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  countryCode: string | null;
  legalDocId: string | null;        // Master agreement / OBA reference, e.g. OBA-ICAP-2024-001
  commissionUomCode: string | null; // UoM for commission rate (BBL, MT, MWH)
  commissionNotes: string | null;   // Fee schedule or special commission terms
  isActive: boolean;
  createdAt: string;
}

export const BROKER_TYPES = ['VOICE', 'ELECTRONIC', 'HYBRID'] as const;
export type BrokerType = (typeof BROKER_TYPES)[number];

export const BROKER_TYPE_META: Record<BrokerType, { label: string; color: string; summary: string }> = {
  VOICE: {
    label: 'Voice',
    color: 'blue',
    summary: 'Traditional telephone IDB desk. Traders call the broker to match bids and offers. Covers physical cargoes, OTC swaps, freight, and bilateral gas/power. Examples: ICAP oil desk, BGC freight, Tradition LNG.',
  },
  ELECTRONIC: {
    label: 'Electronic',
    color: 'green',
    summary: 'Pure electronic matching platform or SEF. Trades matched algorithmically or via order book with no human broker intervention. Examples: ICE IM, Trayport, Spark Commodities.',
  },
  HYBRID: {
    label: 'Hybrid',
    color: 'purple',
    summary: 'Operates both a voice desk and an electronic platform. Broker-assisted trades on voice; straight-through processing on the electronic side. Examples: TP ICAP (Parameta), GFI (Trayport-connected).',
  },
};

export type BrokerInput = Omit<Broker, 'brokerId' | 'createdAt'>;
