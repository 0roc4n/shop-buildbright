import { TruthyZeroPipe } from './truthy-zero.pipe';

describe('TruthyZeroPipe', () => {
  it('create an instance', () => {
    const pipe = new TruthyZeroPipe();
    expect(pipe).toBeTruthy();
  });
});
