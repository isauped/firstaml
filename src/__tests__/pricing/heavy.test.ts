import { priceOrder } from '../../pricing';
import { ORDER_ADDON, PARCEL_RATE_TYPE, PARCEL_SIZE } from '../../types';

describe('priceOrder', () => {
  describe('heavy parcel pricing', () => {
    describe('valid orders', () => {
      it('keeps the dimension-based label when normal pricing is cheaper', () => {
        const result = priceOrder({
          parcels: [{ dimensions: [5, 5, 5], weight: 1 }],
        });

        expect(result.lineItems).toEqual([{ type: PARCEL_SIZE.SMALL, cost: 3 }]);
      });

      it('selects HEAVY when it is cheaper than the overweight normal price', () => {
        const result = priceOrder({
          parcels: [{ dimensions: [120, 5, 5], weight: 30 }],
        });

        expect(result.lineItems).toEqual([
          { type: PARCEL_RATE_TYPE.HEAVY, cost: 50 },
        ]);
        expect(result.total).toBe(50);
      });

      it('prices HEAVY at $50 when weight is exactly at the 50kg base limit', () => {
        const result = priceOrder({
          parcels: [{ dimensions: [120, 5, 5], weight: 50 }],
        });

        expect(result.lineItems).toEqual([
          { type: PARCEL_RATE_TYPE.HEAVY, cost: 50 },
        ]);
      });

      it('adds $1 per kg over 50kg', () => {
        const result = priceOrder({
          parcels: [{ dimensions: [120, 5, 5], weight: 51.1 }],
        });

        expect(result.lineItems).toEqual([
          { type: PARCEL_RATE_TYPE.HEAVY, cost: 52 },
        ]);
        expect(result.total).toBe(52);
      });

      it('rounds partial kilograms over 50kg up', () => {
        const result = priceOrder({
          parcels: [{ dimensions: [120, 5, 5], weight: 52.1 }],
        });

        expect(result.lineItems).toEqual([
          { type: PARCEL_RATE_TYPE.HEAVY, cost: 53 },
        ]);
      });

      it('applies speedy shipping after HEAVY is selected', () => {
        const result = priceOrder({
          parcels: [{ dimensions: [120, 5, 5], weight: 30 }],
          speedyShipping: true,
        });

        expect(result.lineItems).toEqual([
          { type: PARCEL_RATE_TYPE.HEAVY, cost: 50 },
          { type: ORDER_ADDON.SPEEDY_SHIPPING, cost: 50 },
        ]);
        expect(result.total).toBe(100);
      });

      it('selects independently per parcel within the same order', () => {
        const result = priceOrder({
          parcels: [
            { dimensions: [5, 5, 5], weight: 1 },
            { dimensions: [120, 5, 5], weight: 30 },
          ],
        });

        expect(result.lineItems).toEqual([
          { type: PARCEL_SIZE.SMALL, cost: 3 },
          { type: PARCEL_RATE_TYPE.HEAVY, cost: 50 },
        ]);
        expect(result.total).toBe(53);
      });
    });

    describe('exact thresholds', () => {
      it('charges no over-50kg surcharge for HEAVY just under 50kg', () => {
        const result = priceOrder({
          parcels: [{ dimensions: [120, 5, 5], weight: 49.999 }],
        });

        expect(result.lineItems[0]?.cost).toBe(50);
        expect(result.lineItems[0]?.type).toBe(PARCEL_RATE_TYPE.HEAVY);
      });

      it('adds a $1 surcharge to HEAVY just over 50kg', () => {
        const result = priceOrder({
          parcels: [{ dimensions: [120, 5, 5], weight: 50.001 }],
        });

        expect(result.lineItems[0]?.cost).toBe(51);
        expect(result.lineItems[0]?.type).toBe(PARCEL_RATE_TYPE.HEAVY);
      });

      it('keeps the dimension-based label when normal is one cent cheaper than HEAVY', () => {
        const result = priceOrder({
          parcels: [{ dimensions: [5, 5, 5], weight: 24 }],
        });

        expect(result.lineItems).toEqual([{ type: PARCEL_SIZE.SMALL, cost: 49 }]);
      });

      it('flips to HEAVY when normal is one step more expensive', () => {
        const result = priceOrder({
          parcels: [{ dimensions: [5, 5, 5], weight: 24.5 }],
        });

        expect(result.lineItems).toEqual([
          { type: PARCEL_RATE_TYPE.HEAVY, cost: 50 },
        ]);
      });
    });
  });
});
