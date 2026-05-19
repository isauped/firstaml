export const PARCEL_SIZE = {
  SMALL: 'SMALL',
  MEDIUM: 'MEDIUM',
  LARGE: 'LARGE',
  XL: 'XL',
} as const;

export type ParcelSize = (typeof PARCEL_SIZE)[keyof typeof PARCEL_SIZE];

export interface Parcel {
  dimensions: number[];
}

export interface Order {
  parcels: Parcel[];
}

export interface PricedLineItem {
  type: ParcelSize;
  cost: number;
}

export interface OrderPricingResult {
  lineItems: PricedLineItem[];
  total: number;
}
