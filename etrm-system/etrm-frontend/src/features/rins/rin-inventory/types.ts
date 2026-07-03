export interface RinInventoryItem {
  inventoryId: number;
  accountId: number;
  accountName: string;
  dCode: string;
  fuelName: string;
  vintageYear: number;
  quantity: number;            // current RIN balance (units)
  avgCostPerRin: number | null; // weighted average cost USD/RIN
  totalValue: number | null;    // quantity × avgCostPerRin
  asOfDate: string;
}
