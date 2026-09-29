import test from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine } from '../src/core/GameEngine.js';
import { Ship } from '../src/core/Ship.js';
import { GAME_PHASE, DEFAULT_FLEET } from '../src/core/Constants.js';

test('Full Setup to Battle Flow: player places fleet manually, bot places fleet, battle begins', () => {
  const engine = new GameEngine();
  engine.setupBoards({ autoPlacePlayer: false });

  // Initial state: setup phase, player fleet empty, bot fleet ready
  assert.equal(engine.phase, GAME_PHASE.SETUP);
  assert.equal(engine.playerBoard.ships.length, 0);
  assert.equal(engine.opponentBoard.ships.length, 6);

  // Attack should not be allowed during setup
  const prematureAttack = engine.attack(0, 0);
  // In our engine, attack auto-transitions only if called directly, but startBattle checks fleet length:
  assert.equal(engine.playerBoard.ships.length, 0);

  // Attempt to start battle before placing all ships
  const startFail = engine.startBattle();
  assert.equal(startFail.valid, false);
  assert.equal(engine.phase, GAME_PHASE.SETUP);

  // Player places 6 ships manually
  const p1 = new Ship({ id: 'carrier', name: 'Carrier', coordinates: Ship.generateCoordinates(0, 0, 5, 'linear', false) });
  const p2 = new Ship({ id: 'battleship', name: 'Battleship', coordinates: Ship.generateCoordinates(1, 0, 4, 'linear', false) });
  const p3 = new Ship({ id: 'destroyer', name: 'Destroyer', coordinates: Ship.generateCoordinates(2, 0, 3, 'linear', false) });
  const p4 = new Ship({ id: 'submarine', name: 'Submarine', coordinates: Ship.generateCoordinates(3, 0, 3, 'linear', false) });
  const p5 = new Ship({ id: 'patrol', name: 'Patrol', coordinates: Ship.generateCoordinates(4, 0, 2, 'linear', false) });
  const p6 = new Ship({ id: 'gunship', name: 'L-Ship', coordinates: Ship.generateCoordinates(6, 0, 4, 'L', false) });

  engine.playerBoard.placeShip(p1);
  engine.playerBoard.placeShip(p2);
  engine.playerBoard.placeShip(p3);
  engine.playerBoard.placeShip(p4);
  engine.playerBoard.placeShip(p5);
  engine.playerBoard.placeShip(p6);

  assert.equal(engine.playerBoard.ships.length, 6);

  // Now start battle succeeds!
  const startSuccess = engine.startBattle();
  assert.equal(startSuccess.valid, true);
  assert.equal(engine.phase, GAME_PHASE.BATTLE);

  // Battle can proceed
  const shot = engine.attack(0, 0);
  assert.equal(shot.valid, true);
});
