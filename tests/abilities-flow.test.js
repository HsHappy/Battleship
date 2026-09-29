import test from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine } from '../src/core/GameEngine.js';
import { Ship } from '../src/core/Ship.js';
import { ABILITIES, GAME_PHASE, CELL_STATUS } from '../src/core/Constants.js';

test('Abilities Flow: Starts with 6 mana by default, ready for all skills', () => {
  const engine = new GameEngine();
  assert.equal(engine.mana.player, 6);
  assert.equal(engine.mana.opponent, 6);
});

test('Abilities Flow: Cannot use abilities during SETUP phase', () => {
  const engine = new GameEngine({ phase: GAME_PHASE.SETUP });
  const res = engine.useAbility(ABILITIES.RADAR.id, 5, 5);
  assert.equal(res.valid, false);
  assert.match(res.error, /başlamadı/);
  assert.equal(engine.mana.player, 6); // Mana not consumed
});

test('Abilities Flow: Radar costs 2 mana, pinpoints ship pieces without damage, ends turn', () => {
  const engine = new GameEngine({ startingMana: 6 });
  engine.opponentBoard.ships = [];
  engine.opponentBoard.shots.clear();
  engine.opponentBoard.radarScans.clear();

  const patrol = new Ship({
    id: 'patrol',
    name: 'Devriye Botu',
    coordinates: [{ r: 4, c: 4 }, { r: 4, c: 5 }]
  });
  engine.opponentBoard.placeShip(patrol);

  // Scan centered at (4, 4)
  const res = engine.useAbility(ABILITIES.RADAR.id, 4, 4);
  assert.equal(res.valid, true);
  assert.equal(res.result.detected, true);
  assert.equal(res.result.detectedCount, 2);
  assert.deepEqual(res.result.detectedCells, [{ r: 4, c: 4 }, { r: 4, c: 5 }]);

  // Check board state
  assert.equal(engine.opponentBoard.radarScans.get('4,4'), CELL_STATUS.RADAR_DETECTED);
  assert.equal(engine.opponentBoard.radarScans.get('4,5'), CELL_STATUS.RADAR_DETECTED);
  assert.equal(engine.opponentBoard.radarScans.get('3,3'), CELL_STATUS.RADAR_EMPTY);

  // Ship undamaged
  assert.equal(patrol.hits.size, 0);
  assert.equal(patrol.isSunk(), false);

  // Mana consumed: 6 - 2 = 4
  assert.equal(engine.mana.player, 4);

  // Rule 01: Turn passes to opponent immediately
  assert.equal(engine.currentTurn, 'opponent');
});

test('Abilities Flow: Bomba costs 4 mana, damages 3x3 radius, ends turn', () => {
  const engine = new GameEngine({ startingMana: 6 });
  engine.opponentBoard.ships = [];
  engine.opponentBoard.shots.clear();

  const sub = new Ship({
    id: 'sub',
    name: 'Denizaltı',
    coordinates: [{ r: 2, c: 2 }, { r: 2, c: 3 }, { r: 2, c: 4 }]
  });
  const other = new Ship({
    id: 'other',
    name: 'Uzak Gemi',
    coordinates: [{ r: 9, c: 9 }]
  });
  engine.opponentBoard.placeShip(sub);
  engine.opponentBoard.placeShip(other);

  // Bomb centered at (2, 3) covering (2,2), (2,3), (2,4)
  const res = engine.useAbility(ABILITIES.BOMB.id, 2, 3);
  assert.equal(res.valid, true);
  assert.equal(res.result.hitsCount, 3);
  assert.equal(sub.isSunk(), true);
  assert.equal(res.result.sunkShips.length, 1);

  // Mana consumed: 6 - 4 = 2
  assert.equal(engine.mana.player, 2);
  assert.equal(engine.currentTurn, 'opponent');
});

test('Abilities Flow: Nükleer costs 6 mana, one-shots entire 5-cell Carrier, ends turn', () => {
  const engine = new GameEngine({ startingMana: 6 });
  engine.opponentBoard.ships = [];
  engine.opponentBoard.shots.clear();

  const carrier = new Ship({
    id: 'carrier',
    name: 'Uçak Gemisi',
    coordinates: [
      { r: 0, c: 0 },
      { r: 0, c: 1 },
      { r: 0, c: 2 },
      { r: 0, c: 3 },
      { r: 0, c: 4 }
    ]
  });
  const backup = new Ship({
    id: 'backup',
    name: 'Yedek',
    coordinates: [{ r: 8, c: 8 }]
  });
  engine.opponentBoard.placeShip(carrier);
  engine.opponentBoard.placeShip(backup);

  // Strike one segment (0, 2)
  const res = engine.useAbility(ABILITIES.NUKE.id, 0, 2);
  assert.equal(res.valid, true);
  assert.equal(res.result.hit, true);
  assert.equal(res.result.sunk, true);
  assert.equal(carrier.isSunk(), true);
  assert.equal(carrier.hits.size, 5);

  // All 5 coordinates marked SUNK
  for (let c = 0; c <= 4; c++) {
    assert.equal(engine.opponentBoard.shots.get(`0,${c}`), CELL_STATUS.SUNK);
  }

  // Mana consumed: 6 - 6 = 0
  assert.equal(engine.mana.player, 0);
  assert.equal(engine.currentTurn, 'opponent');
});

test('Abilities Flow: Rejects ability if insufficient mana', () => {
  const engine = new GameEngine({ startingMana: 1 });
  const res = engine.useAbility(ABILITIES.RADAR.id, 0, 0); // costs 2
  assert.equal(res.valid, false);
  assert.match(res.error, /Insufficient mana/);
  assert.equal(engine.mana.player, 1);
  assert.equal(engine.currentTurn, 'player'); // Turn not lost
});

test('Abilities Flow: Nükleer rejects targeting already attacked cell', () => {
  const engine = new GameEngine({ startingMana: 10 });
  engine.opponentBoard.shots.set('3,3', CELL_STATUS.MISS);

  const res = engine.useAbility(ABILITIES.NUKE.id, 3, 3);
  assert.equal(res.valid, false);
  assert.match(res.error, /daha önce atış yapıldı/);
  assert.equal(engine.mana.player, 10); // Mana preserved
});
