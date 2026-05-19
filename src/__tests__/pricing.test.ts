import { ValidationError } from '../errors';
import { priceOrder } from '../pricing';
import { ORDER_ADDON, PARCEL_SIZE } from '../types';

describe('priceOrder', () => {
  describe('green paths', () => {
    it('prices a small parcel at $3', () => {
      const result = priceOrder({ parcels: [{ dimensions: [5, 5, 5] }] });

      expect(result.lineItems).toEqual([{ type: PARCEL_SIZE.SMALL, cost: 3 }]);
      expect(result.total).toBe(3);
    });

    it('prices a medium parcel at $8', () => {
      const result = priceOrder({ parcels: [{ dimensions: [20, 20, 20] }] });

      expect(result.lineItems).toEqual([{ type: PARCEL_SIZE.MEDIUM, cost: 8 }]);
      expect(result.total).toBe(8);
    });

    it('prices a large parcel at $15', () => {
      const result = priceOrder({ parcels: [{ dimensions: [60, 60, 60] }] });

      expect(result.lineItems).toEqual([{ type: PARCEL_SIZE.LARGE, cost: 15 }]);
      expect(result.total).toBe(15);
    });

    it('prices an XL parcel at $25', () => {
      const result = priceOrder({ parcels: [{ dimensions: [120, 5, 5] }] });

      expect(result.lineItems).toEqual([{ type: PARCEL_SIZE.XL, cost: 25 }]);
      expect(result.total).toBe(25);
    });

    it('accepts a parcel with a single dimension', () => {
      const result = priceOrder({ parcels: [{ dimensions: [7] }] });

      expect(result.lineItems).toEqual([{ type: PARCEL_SIZE.SMALL, cost: 3 }]);
    });

    it('returns one line item per parcel in input order', () => {
      const result = priceOrder({
        parcels: [
          { dimensions: [5, 5, 5] },
          { dimensions: [120, 5, 5] },
          { dimensions: [20, 20, 20] },
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
          { dimensions: [5, 5, 5] },
          { dimensions: [20, 20, 20] },
          { dimensions: [60, 60, 60] },
          { dimensions: [120, 5, 5] },
        ],
      });

      expect(result.total).toBe(3 + 8 + 15 + 25);
    });
  });

  describe('boundary cases', () => {
    it('treats exactly 10cm as MEDIUM', () => {
      const result = priceOrder({ parcels: [{ dimensions: [10] }] });

      expect(result.lineItems[0]?.type).toBe(PARCEL_SIZE.MEDIUM);
    });

    it('treats exactly 50cm as LARGE', () => {
      const result = priceOrder({ parcels: [{ dimensions: [50] }] });

      expect(result.lineItems[0]?.type).toBe(PARCEL_SIZE.LARGE);
    });

    it('treats exactly 100cm as XL', () => {
      const result = priceOrder({ parcels: [{ dimensions: [100] }] });

      expect(result.lineItems[0]?.type).toBe(PARCEL_SIZE.XL);
    });

    it('classifies a parcel by its largest dimension', () => {
      const result = priceOrder({ parcels: [{ dimensions: [5, 5, 100] }] });

      expect(result.lineItems[0]?.type).toBe(PARCEL_SIZE.XL);
    });
  });

  describe('red paths', () => {
    it('throws ValidationError for an empty parcels array', () => {
      expect(() => priceOrder({ parcels: [] })).toThrow(ValidationError);
      expect(() => priceOrder({ parcels: [] })).toThrow(/at least one parcel/);
    });

    it('throws ValidationError for a parcel with no dimensions', () => {
      expect(() => priceOrder({ parcels: [{ dimensions: [] }] })).toThrow(
        ValidationError,
      );
      expect(() => priceOrder({ parcels: [{ dimensions: [] }] })).toThrow(
        /at least one dimension/,
      );
    });

    it('throws ValidationError for a zero dimension', () => {
      expect(() => priceOrder({ parcels: [{ dimensions: [0] }] })).toThrow(
        /greater than zero/,
      );
    });

    it('throws ValidationError for a negative dimension', () => {
      expect(() => priceOrder({ parcels: [{ dimensions: [-1] }] })).toThrow(
        /greater than zero/,
      );
    });

    it('throws ValidationError for NaN', () => {
      expect(() => priceOrder({ parcels: [{ dimensions: [NaN] }] })).toThrow(
        /finite number/,
      );
    });

    it('throws ValidationError for Infinity', () => {
      expect(() =>
        priceOrder({ parcels: [{ dimensions: [Infinity] }] }),
      ).toThrow(/finite number/);
    });

    it('throws ValidationError for a non-numeric dimension passed at runtime', () => {
      expect(() =>
        // @ts-expect-error -- exercising runtime validation for JS callers
        priceOrder({ parcels: [{ dimensions: ['10'] }] }),
      ).toThrow(/finite number/);
    });

    it('reports the offending parcel index in the error message', () => {
      expect(() =>
        priceOrder({
          parcels: [{ dimensions: [5] }, { dimensions: [-1] }],
        }),
      ).toThrow(/index 1/);
    });
  });

  describe('speedy shipping', () => {
    describe('green paths', () => {
      it('omits the speedy shipping line item when not requested', () => {
        const result = priceOrder({ parcels: [{ dimensions: [5, 5, 5] }] });

        expect(
          result.lineItems.some(
            (item) => item.type === ORDER_ADDON.SPEEDY_SHIPPING,
          ),
        ).toBe(false);
        expect(result.total).toBe(3);
      });

      it('doubles the total for a single-parcel order with speedy shipping', () => {
        const result = priceOrder({
          parcels: [{ dimensions: [5, 5, 5] }],
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
            { dimensions: [5, 5, 5] },
            { dimensions: [20, 20, 20] },
            { dimensions: [60, 60, 60] },
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
          parcels: [{ dimensions: [20, 20, 20] }],
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
          { dimensions: [5, 5, 5] },
          { dimensions: [60, 60, 60] },
          { dimensions: [120, 5, 5] },
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
            { dimensions: [5, 5, 5] },
            { dimensions: [20, 20, 20] },
            { dimensions: [120, 5, 5] },
          ],
          speedyShipping: true,
        });

        const parcelSubtotal = 3 + 8 + 25;
        expect(result.total).toBe(parcelSubtotal * 2);
      });
    });

    describe('boundary cases', () => {
      it('treats speedyShipping: false the same as omitted', () => {
        const result = priceOrder({
          parcels: [{ dimensions: [5, 5, 5] }],
          speedyShipping: false,
        });

        expect(result.lineItems).toEqual([{ type: PARCEL_SIZE.SMALL, cost: 3 }]);
        expect(result.total).toBe(3);
      });

      it('treats omitted speedyShipping as no speedy line item', () => {
        const result = priceOrder({ parcels: [{ dimensions: [5, 5, 5] }] });

        expect(result.lineItems).toHaveLength(1);
      });

      it('places the speedy shipping line item last', () => {
        const result = priceOrder({
          parcels: [
            { dimensions: [5, 5, 5] },
            { dimensions: [20, 20, 20] },
          ],
          speedyShipping: true,
        });

        expect(result.lineItems[result.lineItems.length - 1]?.type).toBe(
          ORDER_ADDON.SPEEDY_SHIPPING,
        );
      });
    });

    describe('red paths', () => {
      it('rejects an empty order even when speedy shipping is requested', () => {
        expect(() =>
          priceOrder({ parcels: [], speedyShipping: true }),
        ).toThrow(ValidationError);
        expect(() =>
          priceOrder({ parcels: [], speedyShipping: true }),
        ).toThrow(/at least one parcel/);
      });
    });
  });
});
