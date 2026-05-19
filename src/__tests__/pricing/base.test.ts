import { priceOrder } from '../../pricing';
import { PARCEL_SIZE } from '../../types';

describe('priceOrder', () => {
  describe('valid orders', () => {
    it('prices a small parcel at $3', () => {
      const result = priceOrder({ parcels: [{ dimensions: [5, 5, 5], weight: 1 }] });

      expect(result.lineItems).toEqual([{ type: PARCEL_SIZE.SMALL, cost: 3 }]);
      expect(result.total).toBe(3);
    });

    it('prices a medium parcel at $8', () => {
      const result = priceOrder({ parcels: [{ dimensions: [20, 20, 20], weight: 1 }] });

      expect(result.lineItems).toEqual([{ type: PARCEL_SIZE.MEDIUM, cost: 8 }]);
      expect(result.total).toBe(8);
    });

    it('prices a large parcel at $15', () => {
      const result = priceOrder({ parcels: [{ dimensions: [60, 60, 60], weight: 1 }] });

      expect(result.lineItems).toEqual([{ type: PARCEL_SIZE.LARGE, cost: 15 }]);
      expect(result.total).toBe(15);
    });

    it('prices an XL parcel at $25', () => {
      const result = priceOrder({ parcels: [{ dimensions: [120, 5, 5], weight: 1 }] });

      expect(result.lineItems).toEqual([{ type: PARCEL_SIZE.XL, cost: 25 }]);
      expect(result.total).toBe(25);
    });

    it('accepts a parcel with a single dimension', () => {
      const result = priceOrder({ parcels: [{ dimensions: [7], weight: 1 }] });

      expect(result.lineItems).toEqual([{ type: PARCEL_SIZE.SMALL, cost: 3 }]);
    });

    it('returns one line item per parcel in input order', () => {
      const result = priceOrder({
        parcels: [
          { dimensions: [5, 5, 5], weight: 1 },
          { dimensions: [120, 5, 5], weight: 1 },
          { dimensions: [20, 20, 20], weight: 1 },
        ],
      });

      expect(result.lineItems).toEqual([
        { type: PARCEL_SIZE.SMALL, cost: 3 },
        { type: PARCEL_SIZE.XL, cost: 25 },
        { type: PARCEL_SIZE.MEDIUM, cost: 8 },
      ]);
    });

    it('totals the cost of all parcels', () => {
      const result = priceOrder({
        parcels: [
          { dimensions: [5, 5, 5], weight: 1 },
          { dimensions: [20, 20, 20], weight: 1 },
          { dimensions: [60, 60, 60], weight: 1 },
          { dimensions: [120, 5, 5], weight: 1 },
        ],
      });

      expect(result.total).toBe(3 + 8 + 15 + 25);
    });
  });

  describe('exact thresholds', () => {
    it('treats exactly 10cm as MEDIUM', () => {
      const result = priceOrder({ parcels: [{ dimensions: [10], weight: 1 }] });

      expect(result.lineItems[0]?.type).toBe(PARCEL_SIZE.MEDIUM);
    });

    it('treats exactly 50cm as LARGE', () => {
      const result = priceOrder({ parcels: [{ dimensions: [50], weight: 1 }] });

      expect(result.lineItems[0]?.type).toBe(PARCEL_SIZE.LARGE);
    });

    it('treats exactly 100cm as XL', () => {
      const result = priceOrder({ parcels: [{ dimensions: [100], weight: 1 }] });

      expect(result.lineItems[0]?.type).toBe(PARCEL_SIZE.XL);
    });

    it('classifies a parcel by its largest dimension', () => {
      const result = priceOrder({ parcels: [{ dimensions: [5, 5, 100], weight: 1 }] });

      expect(result.lineItems[0]?.type).toBe(PARCEL_SIZE.XL);
    });
  });
});
