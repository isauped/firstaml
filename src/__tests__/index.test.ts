import { VERSION } from '../index';

describe('index', () => {
  it('exports a VERSION string', () => {
    expect(typeof VERSION).toBe('string');
  });
});
