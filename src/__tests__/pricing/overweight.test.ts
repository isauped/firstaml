import { priceOrder } from '../../pricing';
import { ORDER_ADDON, PARCEL_SIZE } from '../../types';

describe('priceOrder', () => {
  describe('overweight charges', () => {
    describe('valid orders', () => {
      it('charges nothing extra when a parcel is under its weight limit', () => {
        const result = priceOrder({
          parcels: [{ dimensions: [5, 5, 5], weight: 0.5 }],
        });

        expect(result.lineItems).toEqual([{ type: PARCEL_SIZE.SMALL, cost: 3 }]);
        expect(result.total).toBe(3);
      });

      it('charges nothing extra when a parcel is exactly at its weight limit', () => {
        const result = priceOrder({
          parcels: [{ dimensions: [5, 5, 5], weight: 1 }],
        });

        expect(result.lineItems).toEqual([{ type: PARCEL_SIZE.SMALL, cost: 3 }]);
      });

      it('charges $2 per kg over the limit', () => {
        const result = priceOrder({
          parcels: [{ dimensions: [5, 5, 5], weight: 1.1 }],
        });

        expect(result.lineItems).toEqual([{ type: PARCEL_SIZE.SMALL, cost: 5 }]);
        expect(result.total).toBe(5);
      });

      it('rounds partial kilograms over the limit up', () => {
        const result = priceOrder({
          parcels: [{ dimensions: [5, 5, 5], weight: 2.1 }],
        });

        expect(result.lineItems).toEqual([{ type: PARCEL_SIZE.SMALL, cost: 7 }]);
        expect(result.total).toBe(7);
      });

      it('applies the correct surcharge per parcel across mixed parcels', () => {
        const result = priceOrder({
          parcels: [
            { dimensions: [5, 5, 5], weight: 1.1 },
            { dimensions: [20, 20, 20], weight: 3 },
            { dimensions: [60, 60, 60], weight: 8.5 },
          ],
        });

        expect(result.lineItems).toEqual([
          { type: PARCEL_SIZE.SMALL, cost: 5 },
          { type: PARCEL_SIZE.MEDIUM, cost: 8 },
          { type: PARCEL_SIZE.LARGE, cost: 21 },
        ]);
        expect(result.total).toBe(5 + 8 + 21);
      });

      it('applies speedy shipping after overweight charges', () => {
        const result = priceOrder({
          parcels: [{ dimensions: [5, 5, 5], weight: 2.1 }],
          speedyShipping: true,
        });

        expect(result.lineItems).toEqual([
          { type: PARCEL_SIZE.SMALL, cost: 7 },
          { type: ORDER_ADDON.SPEEDY_SHIPPING, cost: 7 },
        ]);
        expect(result.total).toBe(14);
      });
    });

    describe('exact thresholds', () => {
      it('applies no surcharge to a MEDIUM parcel exactly at its limit', () => {
        const result = priceOrder({
          parcels: [{ dimensions: [20, 20, 20], weight: 3 }],
        });

        expect(result.lineItems[0]?.cost).toBe(8);
      });

      it('applies no surcharge to a LARGE parcel exactly at its limit', () => {
        const result = priceOrder({
          parcels: [{ dimensions: [60, 60, 60], weight: 6 }],
        });

        expect(result.lineItems[0]?.cost).toBe(15);
      });

      it('applies no surcharge to an XL parcel exactly at its limit', () => {
        const result = priceOrder({
          parcels: [{ dimensions: [120, 5, 5], weight: 10 }],
        });

        expect(result.lineItems[0]?.cost).toBe(25);
      });

      it('surcharges a MEDIUM parcel just over its limit', () => {
        const result = priceOrder({
          parcels: [{ dimensions: [20, 20, 20], weight: 3.001 }],
        });

        expect(result.lineItems[0]?.cost).toBe(10);
      });

      it('surcharges a LARGE parcel just over its limit', () => {
        const result = priceOrder({
          parcels: [{ dimensions: [60, 60, 60], weight: 6.001 }],
        });

        expect(result.lineItems[0]?.cost).toBe(17);
      });

      it('surcharges an XL parcel just over its limit', () => {
        const result = priceOrder({
          parcels: [{ dimensions: [120, 5, 5], weight: 10.001 }],
        });

        expect(result.lineItems[0]?.cost).toBe(27);
      });
    });
  });
});
