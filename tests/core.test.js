import test from 'node:test';
import assert from 'node:assert/strict';

import { Ship } from '../src/core/Ship.js';
import { Board } from '../src/core/Board.js';
import { GameEngine } from '../src/core/GameEngine.js';
import { CELL_STATUS, ABILITIES } from '../src/core/Constants.js';

test('Ship: tracks hits and sinks when all segments are damaged', () => {
  const ship = new Ship({
    id: 'patrol',
    name: 'Patrol',
    coordinates: [{ r: 0, c: 0 }, { r: 0, c: 1 }]
  });

  assert.equal(ship.isSunk(), false);
  assert.equal(ship.hit(0, 0), true);
  assert.equal(ship.isSunk(), false);
  assert.equal(ship.hit(0, 1), true);
  assert.equal(ship.isSunk(), true);
});

test('Ship: custom L-shape coordinates generation', () => {
  const coordsH = Ship.generateCoordinates(1, 1, 4, 'L', false);
  assert.equal(coordsH.length, 4);
  assert.deepEqual(coordsH, [
    { r: 1, c: 1 },
    { r: 1, c: 2 },
    { r: 1, c: 3 },
    { r: 2, c: 1 }
  ]);
});

test('Rule 00: Board prevents out-of-bounds or overlapping ship placement', () => {
  const board = new Board(10);
  const ship1 = new Ship({
    id: 's1',
    name: 'S1',
    coordinates: [{ r: 0, c: 0 }, { r: 0, c: 1 }]
  });
  assert.equal(board.placeShip(ship1), true);

  // Overlapping
  const shipOverlap = new Ship({
    id: 's2',
    name: 'S2',
    coordinates: [{ r: 0, c: 1 }, { r: 1, c: 1 }]
  });
  assert.throws(() => board.placeShip(shipOverlap), /Invalid ship placement/);

  // Out of bounds
  const shipOOB = new Ship({
    id: 's3',
    name: 'S3',
    coordinates: [{ r: 9, c: 9 }, { r: 10, c: 9 }]
  });
  assert.throws(() => board.placeShip(shipOOB), /Invalid ship placement/);
});

test('Rule 02 & Rule 04: Normal attack hit maintains streak, miss passes turn', () => {
  const engine = new GameEngine();
  // Manually place 1 ship on opponent board
  const ship = new Ship({
    id: 'target',
    name: 'Target',
    coordinates: [{ r: 2, c: 2 }, { r: 2, c: 3 }]
  });
  engine.opponentBoard.placeShip(ship);

  assert.equal(engine.currentTurn, 'player');

  // 1. Hit -> keeps turn (Rule 04)
  const hitRes = engine.attack(2, 2);
  assert.equal(hitRes.hit, true);
  assert.equal(hitRes.keepsTurn, true);
  assert.equal(engine.currentTurn, 'player');

  // 2. Miss -> passes turn to opponent (Rule 02)
  const missRes = engine.attack(5, 5);
  assert.equal(missRes.hit, false);
  assert.equal(missRes.keepsTurn, false);
  assert.equal(engine.currentTurn, 'opponent');
});

test('Rule 01: Using ability consumes mana and immediately finishes turn', () => {
  const engine = new GameEngine({ startingMana: 4 });
  const ship = new Ship({
    id: 'target',
    name: 'Target',
    coordinates: [{ r: 2, c: 2 }, { r: 2, c: 3 }]
  });
  const ship2 = new Ship({
    id: 'other',
    name: 'Other',
    coordinates: [{ r: 8, c: 8 }]
  });
  engine.opponentBoard.placeShip(ship);
  engine.opponentBoard.placeShip(ship2);

  assert.equal(engine.mana.player, 4);
  assert.equal(engine.currentTurn, 'player');

  // Cast Bomba (cost 4)
  const bombRes = engine.useAbility(ABILITIES.BOMB.id, 2, 2);
  assert.equal(bombRes.valid, true);
  assert.equal(engine.mana.player, 0); // 4 mana deducted
  assert.equal(engine.currentTurn, 'opponent'); // Rule 01: Turn ended immediately
});

test('Rule 03: Mana replenishes by +2 after a complete round (both players take turn)', () => {
  const engine = new GameEngine({ startingMana: 0 });

  assert.equal(engine.mana.player, 0);
  assert.equal(engine.mana.opponent, 0);

  // Player misses -> turn to opponent
  engine.attack(0, 0);
  assert.equal(engine.currentTurn, 'opponent');
  assert.equal(engine.mana.player, 0); // Round not finished yet

  // Opponent misses -> round completes!
  engine.attack(0, 0);
  assert.equal(engine.currentTurn, 'player');
  assert.equal(engine.mana.player, 2); // +2 Mana
  assert.equal(engine.mana.opponent, 2); // +2 Mana
  assert.equal(engine.roundCount, 2);
});

test('Abilities: Bomba damages 3x3 area', () => {
  const board = new Board(10);
  const ship = new Ship({
    id: 's',
    name: 'S',
    coordinates: [{ r: 4, c: 4 }, { r: 4, c: 5 }]
  });
  board.placeShip(ship);

  // Bomb centered at (4, 4)
  const res = board.receiveBomb(4, 4);
  assert.equal(res.valid, true);
  assert.equal(res.hitsCount, 2); // Both segments of ship hit in 3x3
  assert.equal(ship.isSunk(), true);
  assert.equal(res.sunkShips.length, 1);
});

test('Abilities: Radar scans 3x3 area without damaging and detects ship piece location', () => {
  const board = new Board(10);
  const ship = new Ship({
    id: 's',
    name: 'S',
    coordinates: [{ r: 3, c: 3 }]
  });
  board.placeShip(ship);

  // Radar centered at (4, 4) covers (3, 3)
  const res = board.receiveRadar(4, 4);
  assert.equal(res.valid, true);
  assert.equal(res.detected, true);
  assert.equal(res.detectedCount, 1);
  assert.deepEqual(res.detectedCells, [{ r: 3, c: 3 }]);
  assert.equal(board.radarScans.get('3,3'), CELL_STATUS.RADAR_DETECTED);
  assert.equal(board.radarScans.get('4,4'), CELL_STATUS.RADAR_EMPTY);
  assert.equal(ship.isSunk(), false); // Zero damage dealt!
  assert.equal(ship.hits.size, 0);

  // Radar centered at (8, 8) with no ship
  const emptyRes = board.receiveRadar(8, 8);
  assert.equal(emptyRes.valid, true);
  assert.equal(emptyRes.detected, false);
  assert.equal(emptyRes.detectedCount, 0);
  assert.equal(emptyRes.detectedCells.length, 0);
  assert.equal(board.radarScans.get('8,8'), CELL_STATUS.RADAR_EMPTY);
});

test('Abilities: Nükleer hits a piece and instantly sinks the entire ship', () => {
  const board = new Board(10);
  const largeShip = new Ship({
    id: 'carrier',
    name: 'Carrier',
    coordinates: [
      { r: 1, c: 1 },
      { r: 1, c: 2 },
      { r: 1, c: 3 },
      { r: 1, c: 4 },
      { r: 1, c: 5 }
    ]
  });
  board.placeShip(largeShip);

  // Nuke one piece (1, 3)
  const res = board.receiveNuke(1, 3);
  assert.equal(res.valid, true);
  assert.equal(res.hit, true);
  assert.equal(res.sunk, true);
  assert.equal(largeShip.isSunk(), true); // ALL 5 segments destroyed at once!
  assert.equal(largeShip.hits.size, 5);
});

test('Board: randomizeFleet successfully places all ships without overlaps', () => {
  const board = new Board(10);
  const fleet = [
    { id: 'carrier', name: 'Carrier', size: 5, shape: 'linear' },
    { id: 'battleship', name: 'Battleship', size: 4, shape: 'linear' },
    { id: 'destroyer', name: 'Destroyer', size: 3, shape: 'linear' },
    { id: 'submarine', name: 'Submarine', size: 3, shape: 'linear' },
    { id: 'patrol', name: 'Patrol', size: 2, shape: 'linear' },
    { id: 'gunship', name: 'L-Ship', size: 4, shape: 'L' }
  ];

  board.randomizeFleet(fleet);
  assert.equal(board.ships.length, 6);

  // Check no coordinate is shared by two ships
  const occupied = new Set();
  for (const ship of board.ships) {
    for (const coord of ship.coordinates) {
      const key = `${coord.r},${coord.c}`;
      assert.equal(occupied.has(key), false, `Coordinate overlap at ${key}`);
      assert.equal(board.isWithinBounds(coord.r, coord.c), true);
      occupied.add(key);
    }
  }
});

test('Board: removeShip and clearShips properly frees coordinates', () => {
  const board = new Board(10);
  const ship = new Ship({
    id: 'patrol',
    name: 'Patrol',
    coordinates: [{ r: 0, c: 0 }, { r: 0, c: 1 }]
  });

  board.placeShip(ship);
  assert.equal(board.ships.length, 1);
  assert.notEqual(board.getShipAt(0, 0), null);

  // Remove ship
  const removed = board.removeShip('patrol');
  assert.equal(removed.id, 'patrol');
  assert.equal(board.ships.length, 0);
  assert.equal(board.getShipAt(0, 0), null);

  // Clear ships
  board.placeShip(ship);
  assert.equal(board.ships.length, 1);
  board.clearShips();
  assert.equal(board.ships.length, 0);
});

test('GameEngine: startBattle requires all fleet ships before battle starts', () => {
  const engine = new GameEngine({ phase: 'setup' });
  assert.equal(engine.phase, 'setup');

  // Attempt starting with 0 ships placed
  const failRes = engine.startBattle();
  assert.equal(failRes.valid, false);
  assert.equal(engine.phase, 'setup');

  // Randomize player fleet (all 6 placed)
  engine.playerBoard.randomizeFleet(engine.fleetTemplates);
  assert.equal(engine.playerBoard.ships.length, 6);

  // Now start battle
  const startRes = engine.startBattle();
  assert.equal(startRes.valid, true);
  assert.equal(engine.phase, 'battle');
  assert.equal(engine.opponentBoard.ships.length, 6);
});
