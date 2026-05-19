import { ValidationError } from '../../errors';
import { priceOrder } from '../../pricing';

describe('priceOrder', () => {
  describe('validation', () => {
    describe('order-level', () => {
      it('throws ValidationError for an empty parcels array', () => {
        expect(() => priceOrder({ parcels: [] })).toThrow(ValidationError);
        expect(() => priceOrder({ parcels: [] })).toThrow(/at least one parcel/);
      });

      it('rejects an empty order even when speedy shipping is requested', () => {
        expect(() =>
          priceOrder({ parcels: [], speedyShipping: true }),
        ).toThrow(ValidationError);
        expect(() =>
          priceOrder({ parcels: [], speedyShipping: true }),
        ).toThrow(/at least one parcel/);
      });
    });

    describe('dimension-level', () => {
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

    describe('weight-level', () => {
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
});
