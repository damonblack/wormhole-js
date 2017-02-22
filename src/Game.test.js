import Game from './Game';

it('calculates the right size for the wormhole graphic', () => {
  expect(Game.convertWormholeSizeFunction(10)).toEqual(20);
  expect(Game.convertWormholeSizeFunction(500)).toEqual(100);
});