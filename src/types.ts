export const PARCEL_SIZE = {
  SMALL: 'SMALL',
  MEDIUM: 'MEDIUM',
  LARGE: 'LARGE',
  XL: 'XL',
} as const;

export type ParcelSize = (typeof PARCEL_SIZE)[keyof typeof PARCEL_SIZE];

export const ORDER_ADDON = {
  SPEEDY_SHIPPING: 'SPEEDY_SHIPPING',
} as const;

export type OrderAddon = (typeof ORDER_ADDON)[keyof typeof ORDER_ADDON];

export const PARCEL_RATE_TYPE = {
  HEAVY: 'HEAVY',
} as const;

export type ParcelRateType =
  (typeof PARCEL_RATE_TYPE)[keyof typeof PARCEL_RATE_TYPE];

export type LineItemType = ParcelSize | ParcelRateType | OrderAddon;

export interface Parcel {
  dimensions: number[];
  weight: number;
}

export interface Order {
  parcels: Parcel[];
  speedyShipping?: boolean;
}

export interface PricedLineItem {
  type: LineItemType;
  cost: number;
}

export interface OrderPricingResult {
  lineItems: PricedLineItem[];
  total: number;
}
