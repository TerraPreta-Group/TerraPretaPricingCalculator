const CONVERSION_RATES = {
  sqft_to_acre: 1 / 43560,
  sqm_to_acre: 1 / 4046.86,
  ha_to_acre: 2.47105,
};

const APPLICATION_RATE = 1500; // lb/ac
const PRICE_PER_LB = 1.75; // $/lb
const TOTE_BAG_CAPACITY = 1000; // lbs per tote bag

export type UnitType = "sqft" | "sqm" | "acre" | "ha";

export function convertToAcres(value: number, fromUnit: UnitType): number {
  if (fromUnit === "acre") return value;
  if (fromUnit === "sqft") return value * CONVERSION_RATES.sqft_to_acre;
  if (fromUnit === "sqm") return value * CONVERSION_RATES.sqm_to_acre;
  if (fromUnit === "ha") return value * CONVERSION_RATES.ha_to_acre;
  return 0;
}

export function calculateRequiredProduct(acres: number): number {
  return acres * APPLICATION_RATE;
}

export function calculateCost(lbs: number): number {
  return lbs * PRICE_PER_LB;
}

export function calculateToteBags(lbs: number): number {
  return Math.ceil(lbs / TOTE_BAG_CAPACITY);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}