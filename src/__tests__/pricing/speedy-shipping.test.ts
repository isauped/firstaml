import { priceOrder } from '../../pricing';
import { ORDER_ADDON, PARCEL_SIZE } from '../../types';

describe('priceOrder', () => {
  describe('speedy shipping', () => {
    describe('valid orders', () => {
      it('omits the speedy shipping line item when not requested', () => {
        const result = priceOrder({ parcels: [{ dimensions: [5, 5, 5], weight: 1 }] });

        expect(
          result.lineItems.some(
            (item) => item.type === ORDER_ADDON.SPEEDY_SHIPPING,
          ),
        ).toBe(false);
        expect(result.total).toBe(3);
      });

      it('doubles the total for a single-parcel order with speedy shipping', () => {
        const result = priceOrder({
          parcels: [{ dimensions: [5, 5, 5], weight: 1 }],
          speedyShipping: true,
        });

        expect(result.lineItems).toEqual([
          { type: PARCEL_SIZE.SMALL, cost: 3 },
          { type: ORDER_ADDON.SPEEDY_SHIPPING, cost: 3 },
        ]);
        expect(result.total).toBe(6);
      });

      it('doubles the total for a multi-parcel order with speedy shipping', () => {
        const result = priceOrder({
          parcels: [
            { dimensions: [5, 5, 5], weight: 1 },
            { dimensions: [20, 20, 20], weight: 1 },
            { dimensions: [60, 60, 60], weight: 1 },
          ],
          speedyShipping: true,
        });

        const parcelSubtotal = 3 + 8 + 15;
        expect(result.lineItems).toEqual([
          { type: PARCEL_SIZE.SMALL, cost: 3 },
          { type: PARCEL_SIZE.MEDIUM, cost: 8 },
          { type: PARCEL_SIZE.LARGE, cost: 15 },
          { type: ORDER_ADDON.SPEEDY_SHIPPING, cost: parcelSubtotal },
        ]);
        expect(result.total).toBe(parcelSubtotal * 2);
      });

      it('represents speedy shipping as its own distinct line item', () => {
        const result = priceOrder({
          parcels: [{ dimensions: [20, 20, 20], weight: 1 }],
          speedyShipping: true,
        });

        const speedyLineItems = result.lineItems.filter(
          (item) => item.type === ORDER_ADDON.SPEEDY_SHIPPING,
        );
        expect(speedyLineItems).toHaveLength(1);
        expect(speedyLineItems[0]?.cost).toBe(8);
      });

      it('leaves parcel line item prices unchanged when speedy shipping is enabled', () => {
        const parcels = [
          { dimensions: [5, 5, 5], weight: 1 },
          { dimensions: [60, 60, 60], weight: 1 },
          { dimensions: [120, 5, 5], weight: 1 },
        ];

        const withoutSpeedy = priceOrder({ parcels });
        const withSpeedy = priceOrder({ parcels, speedyShipping: true });

        const parcelItemsWithSpeedy = withSpeedy.lineItems.filter(
          (item) => item.type !== ORDER_ADDON.SPEEDY_SHIPPING,
        );
        expect(parcelItemsWithSpeedy).toEqual(withoutSpeedy.lineItems);
      });

      it('totals correctly across mixed parcel sizes with speedy shipping', () => {
        const result = priceOrder({
          parcels: [
            { dimensions: [5, 5, 5], weight: 1 },
            { dimensions: [20, 20, 20], weight: 1 },
            { dimensions: [120, 5, 5], weight: 1 },
          ],
          speedyShipping: true,
        });

        const parcelSubtotal = 3 + 8 + 25;
        expect(result.total).toBe(parcelSubtotal * 2);
      });
    });

    describe('exact thresholds', () => {
      it('treats speedyShipping: false the same as omitted', () => {
        const result = priceOrder({
          parcels: [{ dimensions: [5, 5, 5], weight: 1 }],
          speedyShipping: false,
        });

        expect(result.lineItems).toEqual([{ type: PARCEL_SIZE.SMALL, cost: 3 }]);
        expect(result.total).toBe(3);
      });

      it('treats omitted speedyShipping as no speedy line item', () => {
        const result = priceOrder({ parcels: [{ dimensions: [5, 5, 5], weight: 1 }] });

        expect(result.lineItems).toHaveLength(1);
      });

      it('places the speedy shipping line item last', () => {
        const result = priceOrder({
          parcels: [
            { dimensions: [5, 5, 5], weight: 1 },
            { dimensions: [20, 20, 20], weight: 1 },
          ],
          speedyShipping: true,
        });

        expect(result.lineItems[result.lineItems.length - 1]?.type).toBe(
          ORDER_ADDON.SPEEDY_SHIPPING,
        );
      });
    });
  });
});
