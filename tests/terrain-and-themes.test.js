import test from 'node:test';
import assert from 'node:assert/strict';
import { TerrainGenerator } from '../src/core/TerrainGenerator.js';
import { GameEngine } from '../src/core/GameEngine.js';
import { Board } from '../src/core/Board.js';
import { Ship } from '../src/core/Ship.js';
import {
  MAP_THEMES,
  THEME_SELECTION,
  DEFAULT_FLEET,
  ABILITIES
} from '../src/core/Constants.js';

test('Terrain & Themes: MAP_THEMES definitions are complete', () => {
  assert.ok(MAP_THEMES.OCEAN);
  assert.ok(MAP_THEMES.ARCTIC);
  assert.ok(MAP_THEMES.ARCHIPELAGO);
  assert.ok(MAP_THEMES.REEF);

  assert.equal(MAP_THEMES.OCEAN.id, 'ocean');
  assert.deepEqual(MAP_THEMES.OCEAN.densityRange, [0.0, 0.0]);

  assert.equal(MAP_THEMES.ARCTIC.id, 'arctic');
  assert.ok(MAP_THEMES.ARCTIC.densityRange[1] > 0);

  assert.equal(MAP_THEMES.ARCHIPELAGO.id, 'archipelago');
  assert.ok(MAP_THEMES.ARCHIPELAGO.densityRange[1] > 0);

  assert.equal(MAP_THEMES.REEF.id, 'reef');
  assert.ok(MAP_THEMES.REEF.densityRange[1] > 0);
});

test('TerrainGenerator: resolveTheme handles random, explicit, and unknown ids', () => {
  const resolvedArctic = TerrainGenerator.resolveTheme('arctic');
  assert.equal(resolvedArctic.id, 'arctic');

  const resolvedReef = TerrainGenerator.resolveTheme('reef');
  assert.equal(resolvedReef.id, 'reef');

  const resolvedArchipelago = TerrainGenerator.resolveTheme('archipelago');
  assert.equal(resolvedArchipelago.id, 'archipelago');

  const resolvedOcean = TerrainGenerator.resolveTheme('ocean');
  assert.equal(resolvedOcean.id, 'ocean');

  const resolvedUnknown = TerrainGenerator.resolveTheme('unknown_theme_xyz');
  assert.equal(resolvedUnknown.id, 'ocean');

  const resolvedRandom = TerrainGenerator.resolveTheme(THEME_SELECTION.RANDOM);
  assert.ok(['ocean', 'arctic', 'archipelago', 'reef'].includes(resolvedRandom.id));
});

test('TerrainGenerator: OCEAN produces zero obstacles', () => {
  const result = TerrainGenerator.generateTerrain({
    boardSize: 10,
    themeId: 'ocean',
    fleetTemplates: DEFAULT_FLEET
  });

  assert.equal(result.theme.id, 'ocean');
  assert.equal(result.obstacles.length, 0);
  assert.equal(result.obstacleKeys.size, 0);
});

test('TerrainGenerator: Non-ocean themes produce bounded obstacles with fleet solvability', () => {
  for (const themeId of ['arctic', 'archipelago', 'reef']) {
    const result = TerrainGenerator.generateTerrain({
      boardSize: 10,
      themeId,
      fleetTemplates: DEFAULT_FLEET
    });

    assert.equal(result.theme.id, themeId);
    assert.ok(result.obstacles.length > 0, `${themeId} should generate at least one obstacle`);
    assert.ok(result.obstacles.length <= 20, 'Obstacles should never exceed 20% of 100 cells');

    // All coordinates must be within board bounds
    for (const obs of result.obstacles) {
      assert.ok(obs.r >= 0 && obs.r < 10);
      assert.ok(obs.c >= 0 && obs.c < 10);
    }

    // Must be solvable for fleet placement
    const b = new Board(10);
    b.setObstacles(result.obstacles);
    const placed = b.randomizeFleet(DEFAULT_FLEET);
    assert.equal(placed, true);
    assert.equal(b.ships.length, DEFAULT_FLEET.length);
  }
});

test('GameEngine: Symmetrical obstacle assignment between player and opponent boards', () => {
  const engine = new GameEngine({
    boardSize: 10,
    themeId: 'archipelago',
    fleetTemplates: DEFAULT_FLEET
  });

  assert.equal(engine.theme.id, 'archipelago');
  assert.ok(engine.obstacles.length > 0);

  // Both boards have identical obstacle count
  assert.equal(engine.playerBoard.obstacles.size, engine.opponentBoard.obstacles.size);
  assert.equal(engine.playerBoard.obstacles.size, engine.obstacles.length);

  // Verify each coordinate matches across both boards
  for (const obs of engine.obstacles) {
    const key = `${obs.r},${obs.c}`;
    assert.equal(engine.playerBoard.isObstacle(obs.r, obs.c), true);
    assert.equal(engine.opponentBoard.isObstacle(obs.r, obs.c), true);
    assert.equal(engine.playerBoard.obstacles.has(key), true);
    assert.equal(engine.opponentBoard.obstacles.has(key), true);
  }
});

test('Board: Rejects ship placement over an obstacle cell', () => {
  const board = new Board(10);
  board.setObstacles([{ r: 2, c: 2 }]);

  const coordinates = [
    { r: 2, c: 0 },
    { r: 2, c: 1 },
    { r: 2, c: 2 },
    { r: 2, c: 3 },
    { r: 2, c: 4 }
  ];

  const valid = board.isValidPlacement(coordinates);
  assert.equal(valid, false, 'Carrier placement through obstacle must be invalid');

  const ship = new Ship({
    id: 'carrier',
    name: 'Uçak Gemisi',
    coordinates
  });

  assert.throws(() => {
    board.placeShip(ship);
  }, /Invalid ship placement/);
  assert.equal(board.ships.length, 0);
});

test('Combat Rules: Attacking an obstacle is invalid, does not penalize player, and preserves turn', () => {
  const engine = new GameEngine({
    boardSize: 10,
    themeId: 'reef'
  });

  const obs = engine.obstacles[0];
  assert.ok(obs, 'Obstacle must exist');

  assert.equal(engine.currentTurn, 'player');

  // Attempt standard attack on obstacle
  const attackResult = engine.attack(obs.r, obs.c);
  assert.equal(attackResult.valid, false);
  assert.ok(attackResult.error.includes('Kayalık veya ada'));
  assert.equal(engine.currentTurn, 'player', 'Turn must not change when clicking obstacle');
});

test('Abilities: Nükleer rejected on obstacle, Bomba safely skips obstacle in blast zone', () => {
  const engine = new GameEngine({
    boardSize: 10,
    themeId: 'reef',
    startingMana: 10
  });

  const obs = engine.obstacles[0];
  assert.ok(obs);

  // 1. Nuke on obstacle should be rejected without consuming mana or turn
  const nukeResult = engine.useAbility(ABILITIES.NUKE.id, obs.r, obs.c);
  assert.equal(nukeResult.valid, false);
  assert.ok(nukeResult.error.includes('nükleer atılamaz'));
  assert.equal(engine.mana.player, 10);
  assert.equal(engine.currentTurn, 'player');

  // 2. Bomb centered near obstacle absorbs/skips obstacle safely without crash
  const bombResult = engine.useAbility(ABILITIES.BOMB.id, obs.r, obs.c);
  assert.equal(bombResult.valid, true);
  assert.equal(engine.mana.player, 6); // 10 - 4 = 6
  assert.equal(engine.currentTurn, 'opponent'); // ability ends turn
});
