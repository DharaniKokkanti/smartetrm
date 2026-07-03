export interface RinFuelCategory {
  categoryId: number;
  dCode: string;             // D3 | D4 | D5 | D6 | D7
  fuelName: string;          // Cellulosic Biofuel, Biomass-Based Diesel, etc.
  fuelType: string;          // CELLULOSIC | BIOMASS_DIESEL | ADVANCED | CONVENTIONAL | CELLULOSIC_DIESEL
  equivalenceValue: number;  // RINs generated per gallon (D3=3.0, D4=1.5, D5=1.5, D6=1.0, D7=1.7)
  energySources: string | null; // Typical feedstocks — Corn Stover, Soybean Oil, Corn, etc.
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export type RinFuelCategoryInput = Omit<RinFuelCategory, 'categoryId' | 'createdAt'>;
