import {
  ORDER_ADDON,
  PARCEL_RATE_TYPE,
  PARCEL_SIZE,
  priceOrder,
  ValidationError,
} from '../index';

describe('public surface', () => {
  it('exports priceOrder', () => {
    expect(typeof priceOrder).toBe('function');
  });

  it('exports ValidationError', () => {
    const error = new ValidationError('test');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ValidationError');
  });

  it('exports PARCEL_SIZE with all four sizes', () => {
    expect(PARCEL_SIZE).toEqual({
      SMALL: 'SMALL',
      MEDIUM: 'MEDIUM',
      LARGE: 'LARGE',
      XL: 'XL',
    });
  });

  it('exports ORDER_ADDON with SPEEDY_SHIPPING', () => {
    expect(ORDER_ADDON).toEqual({
      SPEEDY_SHIPPING: 'SPEEDY_SHIPPING',
    });
  });

  it('exports PARCEL_RATE_TYPE with HEAVY', () => {
    expect(PARCEL_RATE_TYPE).toEqual({
      HEAVY: 'HEAVY',
    });
  });
});
