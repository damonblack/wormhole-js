import { getWormholeSize } from './utils';

it('should get it right', function () {
  expect(getWormholeSize(0)).toEqual(0);
  expect(getWormholeSize(250)).toEqual(50);
  expect(getWormholeSize(500)).toEqual(100);
});