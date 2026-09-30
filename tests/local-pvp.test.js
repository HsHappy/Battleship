import test from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine } from '../src/core/GameEngine.js';
import { Ship } from '../src/core/Ship.js';
import { GAME_PHASE, GAME_MODE, ABILITIES, CELL_STATUS } from '../src/core/Constants.js';

test('Local PvP: initialization sets local_pvp mode and empty boards on setup', () => {
  const engine = new GameEngine({ mode: GAME_MODE.LOCAL_PVP });
  engine.setupBoards();

  assert.equal(engine.mode, GAME_MODE.LOCAL_PVP);
  assert.equal(engine.phase, GAME_PHASE.SETUP);
  assert.equal(engine.playerBoard.ships.length, 0);
  assert.equal(engine.opponentBoard.ships.length, 0); // Opponent board not auto-placed in local PvP
});

test('Local PvP: requires both players to place all 6 ships before battle starts', () => {
  const engine = new GameEngine({ mode: GAME_MODE.LOCAL_PVP });
  engine.setupBoards();

  // Try starting with no ships
  const res1 = engine.startBattle();
  assert.equal(res1.valid, false);
  assert.match(res1.error, /1\. Oyuncu/);

  // Player 1 places all 6 ships
  engine.playerBoard.randomizeFleet(engine.fleetTemplates);
  assert.equal(engine.playerBoard.ships.length, 6);

  // Try starting when Player 2 has not placed ships
  const res2 = engine.startBattle();
  assert.equal(res2.valid, false);
  assert.match(res2.error, /2\. Oyuncu/);

  // Player 2 places all 6 ships
  engine.opponentBoard.randomizeFleet(engine.fleetTemplates);
  assert.equal(engine.opponentBoard.ships.length, 6);

  // Battle can now start
  const res3 = engine.startBattle();
  assert.equal(res3.valid, true);
  assert.equal(engine.phase, GAME_PHASE.BATTLE);
  assert.equal(engine.currentTurn, 'player');
});

test('Local PvP: turn alternation and streak logic between Player 1 and Player 2', () => {
  const engine = new GameEngine({ mode: GAME_MODE.LOCAL_PVP, phase: GAME_PHASE.BATTLE });

  // Place custom target ships
  const p1Ship = new Ship({ id: 's1', name: 'S1', coordinates: [{ r: 0, c: 0 }] });
  const p2Ship = new Ship({ id: 's2', name: 'S2', coordinates: [{ r: 1, c: 1 }, { r: 1, c: 2 }] });

  engine.playerBoard.placeShip(p1Ship);
  engine.opponentBoard.placeShip(p2Ship);

  assert.equal(engine.currentTurn, 'player'); // Player 1's turn

  // 1. Player 1 attacks (1, 1) -> Hit on Player 2's ship! Keeps turn (streak)
  const hitRes = engine.attack(1, 1);
  assert.equal(hitRes.hit, true);
  assert.equal(hitRes.keepsTurn, true);
  assert.equal(engine.currentTurn, 'player');

  // 2. Player 1 attacks (5, 5) -> Miss! Passes turn to Player 2
  const missRes = engine.attack(5, 5);
  assert.equal(missRes.hit, false);
  assert.equal(missRes.keepsTurn, false);
  assert.equal(engine.currentTurn, 'opponent'); // Now Player 2's turn!

  // 3. Player 2 attacks (5, 5) on Player 1's board -> Miss! Round finishes, both get +2 mana
  const p2MissRes = engine.attack(5, 5);
  assert.equal(p2MissRes.hit, false);
  assert.equal(p2MissRes.keepsTurn, false);
  assert.equal(engine.currentTurn, 'player'); // Returns to Player 1!

  // Round completed: mana replenished for both
  assert.equal(engine.roundCount, 2);
  assert.equal(engine.mana.player, 8); // 6 + 2
  assert.equal(engine.mana.opponent, 8); // 6 + 2
});

test('Local PvP: ability usage deducts active player mana and passes turn immediately', () => {
  const engine = new GameEngine({ mode: GAME_MODE.LOCAL_PVP, startingMana: 6, phase: GAME_PHASE.BATTLE });

  const p1Ship = new Ship({ id: 'p1s', name: 'P1Ship', coordinates: [{ r: 8, c: 8 }] });
  const p2Ship = new Ship({ id: 'p2s', name: 'P2Ship', coordinates: [{ r: 2, c: 2 }] });
  engine.playerBoard.placeShip(p1Ship);
  engine.opponentBoard.placeShip(p2Ship);

  // Player 1 uses Radar (cost 2)
  const radarRes = engine.useAbility(ABILITIES.RADAR.id, 2, 2);
  assert.equal(radarRes.valid, true);
  assert.equal(radarRes.result.detected, true);
  assert.equal(engine.mana.player, 4); // 6 - 2
  assert.equal(engine.mana.opponent, 6); // Untouched
  assert.equal(engine.currentTurn, 'opponent'); // Turn switched to Player 2

  // Player 2 uses Bomba (cost 4) targeting Player 1
  const bombRes = engine.useAbility(ABILITIES.BOMB.id, 0, 0);
  assert.equal(bombRes.valid, true);
  // Note: Since Player 2 moved, round completes immediately and both receive +2 mana (Rule 03)
  assert.equal(engine.currentTurn, 'player'); // Turn switched back to Player 1
  assert.equal(engine.mana.opponent, 4); // (6 - 4) + 2 = 4
  assert.equal(engine.mana.player, 6); // 4 + 2 = 6
});

test('Local PvP: game over triggers and declares correct winner', () => {
  const engine = new GameEngine({ mode: GAME_MODE.LOCAL_PVP, phase: GAME_PHASE.BATTLE });
  const p1Ship = new Ship({ id: 'p1s', name: 'P1', coordinates: [{ r: 0, c: 0 }] });
  const p2Ship = new Ship({ id: 'p2s', name: 'P2', coordinates: [{ r: 0, c: 0 }] });
  engine.playerBoard.placeShip(p1Ship);
  engine.opponentBoard.placeShip(p2Ship);

  // Player 1 attacks Player 2's only ship piece
  const res = engine.attack(0, 0);
  assert.equal(res.hit, true);
  assert.equal(res.sunk, true);
  assert.equal(res.gameOver, true);
  assert.equal(res.winner, 'player');
  assert.equal(engine.isOver, true);
});
