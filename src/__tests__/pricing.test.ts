import { ValidationError } from '../errors';
import { priceOrder } from '../pricing';
import { ORDER_ADDON, PARCEL_RATE_TYPE, PARCEL_SIZE } from '../types';

describe('priceOrder', () => {
  describe('green paths', () => {
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

  describe('boundary cases', () => {
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

  describe('red paths', () => {
    it('throws ValidationError for an empty parcels array', () => {
      expect(() => priceOrder({ parcels: [] })).toThrow(ValidationError);
      expect(() => priceOrder({ parcels: [] })).toThrow(/at least one parcel/);
    });

    it('throws ValidationError for a parcel with no dimensions', () => {
      expect(() => priceOrder({ parcels: [{ dimensions: [], weight: 1 }] })).toThrow(
        ValidationError,
      );
      expect(() => priceOrder({ parcels: [{ dimensions: [], weight: 1 }] })).toThrow(
        /at least one dimension/,
      );
    });

    it('throws ValidationError for a zero dimension', () => {
      expect(() => priceOrder({ parcels: [{ dimensions: [0], weight: 1 }] })).toThrow(
        /greater than zero/,
      );
    });

    it('throws ValidationError for a negative dimension', () => {
      expect(() => priceOrder({ parcels: [{ dimensions: [-1], weight: 1 }] })).toThrow(
        /greater than zero/,
      );
    });

    it('throws ValidationError for NaN', () => {
      expect(() => priceOrder({ parcels: [{ dimensions: [NaN], weight: 1 }] })).toThrow(
        /finite number/,
      );
    });

    it('throws ValidationError for Infinity', () => {
      expect(() =>
        priceOrder({ parcels: [{ dimensions: [Infinity], weight: 1 }] }),
      ).toThrow(/finite number/);
    });

    it('throws ValidationError for a non-numeric dimension passed at runtime', () => {
      expect(() =>
        // @ts-expect-error -- exercising runtime validation for JS callers
        priceOrder({ parcels: [{ dimensions: ['10'], weight: 1 }] }),
      ).toThrow(/finite number/);
    });

    it('reports the offending parcel index in the error message', () => {
      expect(() =>
        priceOrder({
          parcels: [{ dimensions: [5], weight: 1 }, { dimensions: [-1], weight: 1 }],
        }),
      ).toThrow(/index 1/);
    });
  });

  describe('speedy shipping', () => {
    describe('green paths', () => {
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

    describe('boundary cases', () => {
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

  describe('overweight charges', () => {
    describe('green paths', () => {
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

    describe('boundary cases', () => {
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

    describe('red paths', () => {
      it('throws ValidationError for a missing weight passed at runtime', () => {
        expect(() =>
          priceOrder({
            // @ts-expect-error -- exercising runtime validation for JS callers
            parcels: [{ dimensions: [5, 5, 5] }],
          }),
        ).toThrow(/weight: must be a finite number/);
      });

      it('throws ValidationError for zero weight', () => {
        expect(() =>
          priceOrder({ parcels: [{ dimensions: [5, 5, 5], weight: 0 }] }),
        ).toThrow(/weight: must be greater than zero/);
      });

      it('throws ValidationError for negative weight', () => {
        expect(() =>
          priceOrder({ parcels: [{ dimensions: [5, 5, 5], weight: -1 }] }),
        ).toThrow(/weight: must be greater than zero/);
      });

      it('throws ValidationError for NaN weight', () => {
        expect(() =>
          priceOrder({ parcels: [{ dimensions: [5, 5, 5], weight: NaN }] }),
        ).toThrow(/weight: must be a finite number/);
      });

      it('throws ValidationError for Infinity weight', () => {
        expect(() =>
          priceOrder({
            parcels: [{ dimensions: [5, 5, 5], weight: Infinity }],
          }),
        ).toThrow(/weight: must be a finite number/);
      });

      it('reports the offending parcel index in the weight error message', () => {
        expect(() =>
          priceOrder({
            parcels: [
              { dimensions: [5, 5, 5], weight: 1 },
              { dimensions: [5, 5, 5], weight: -1 },
            ],
          }),
        ).toThrow(/Parcel at index 1/);
      });
    });
  });

  describe('heavy parcel pricing', () => {
    describe('green paths', () => {
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

    describe('boundary cases', () => {
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
