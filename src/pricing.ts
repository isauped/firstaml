import { ValidationError } from './errors';
import { ORDER_ADDON, PARCEL_SIZE } from './types';
import type {
  Order,
  OrderPricingResult,
  Parcel,
  ParcelSize,
  PricedLineItem,
} from './types';

const SMALL_MAX_CM = 10;
const MEDIUM_MAX_CM = 50;
const LARGE_MAX_CM = 100;

const PARCEL_PRICES: Record<ParcelSize, number> = {
  SMALL: 3,
  MEDIUM: 8,
  LARGE: 15,
  XL: 25,
};

export function priceOrder(order: Order): OrderPricingResult {
  validateOrder(order);

  const parcelLineItems: PricedLineItem[] = order.parcels.map((parcel) => {
    const size = classifyParcel(parcel);
    return { type: size, cost: PARCEL_PRICES[size] };
  });

  const parcelSubtotal = parcelLineItems.reduce(
    (sum, item) => sum + item.cost,
    0,
  );

  const lineItems: PricedLineItem[] = order.speedyShipping
    ? [
        ...parcelLineItems,
        { type: ORDER_ADDON.SPEEDY_SHIPPING, cost: parcelSubtotal },
      ]
    : parcelLineItems;

  const total = lineItems.reduce((sum, item) => sum + item.cost, 0);

  return { lineItems, total };
}

function classifyParcel(parcel: Parcel): ParcelSize {
  const largestDimension = Math.max(...parcel.dimensions);

  if (largestDimension < SMALL_MAX_CM) return PARCEL_SIZE.SMALL;
  if (largestDimension < MEDIUM_MAX_CM) return PARCEL_SIZE.MEDIUM;
  if (largestDimension < LARGE_MAX_CM) return PARCEL_SIZE.LARGE;
  return PARCEL_SIZE.XL;
}

function validateOrder(order: Order): void {
  if (order.parcels.length === 0) {
    throw new ValidationError('Order must contain at least one parcel');
  }

  order.parcels.forEach((parcel, parcelIndex) => {
    validateParcel(parcel, parcelIndex);
  });
}

function validateParcel(parcel: Parcel, parcelIndex: number): void {
  if (parcel.dimensions.length === 0) {
    throw new ValidationError(
      `Parcel at index ${String(parcelIndex)} must have at least one dimension`,
    );
  }

  parcel.dimensions.forEach((dimension, dimensionIndex) => {
    validateDimension(dimension, parcelIndex, dimensionIndex);
  });
}

function validateDimension(
  dimension: number,
  parcelIndex: number,
  dimensionIndex: number,
): void {
  if (typeof dimension !== 'number' || !Number.isFinite(dimension)) {
    throw new ValidationError(
      `Parcel at index ${String(parcelIndex)} has invalid dimension at index ${String(dimensionIndex)}: must be a finite number`,
    );
  }

  if (dimension <= 0) {
    throw new ValidationError(
      `Parcel at index ${String(parcelIndex)} has invalid dimension at index ${String(dimensionIndex)}: must be greater than zero`,
    );
  }
}
