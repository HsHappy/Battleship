import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { GameEngine } from '../src/core/GameEngine.js';
import { Board } from '../src/core/Board.js';
import { BOARD_SIZE, BOARD_SIZES, SUPPORTED_BOARD_SIZES, DEFAULT_FLEET, GAME_PHASE, ABILITIES } from '../src/core/Constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

test('Board Size Constants: Supported sizes are correctly configured', () => {
  assert.equal(BOARD_SIZE, 10);
  assert.deepEqual(SUPPORTED_BOARD_SIZES, [8, 10, 12]);
  assert.equal(BOARD_SIZES.SMALL.size, 8);
  assert.equal(BOARD_SIZES.STANDARD.size, 10);
  assert.equal(BOARD_SIZES.LARGE.size, 12);
});

test('Board: size defaults to 10 and respects custom sizes (8, 10, 12)', () => {
  const bDefault = new Board();
  assert.equal(bDefault.size, 10);
  assert.equal(bDefault.isWithinBounds(0, 0), true);
  assert.equal(bDefault.isWithinBounds(9, 9), true);
  assert.equal(bDefault.isWithinBounds(10, 10), false);

  const b8 = new Board(8);
  assert.equal(b8.size, 8);
  assert.equal(b8.isWithinBounds(7, 7), true);
  assert.equal(b8.isWithinBounds(8, 8), false);
  assert.equal(b8.isWithinBounds(-1, 0), false);

  const b12 = new Board(12);
  assert.equal(b12.size, 12);
  assert.equal(b12.isWithinBounds(11, 11), true);
  assert.equal(b12.isWithinBounds(12, 12), false);
});

test('Board Size 8x8: Fleet randomization and bounds validation', () => {
  const b8 = new Board(8);
  const success = b8.randomizeFleet(DEFAULT_FLEET);
  assert.equal(success, true);
  assert.equal(b8.ships.length, DEFAULT_FLEET.length);

  // All coordinates must be strictly within 0..7
  for (const ship of b8.ships) {
    for (const coord of ship.coordinates) {
      assert.ok(coord.r >= 0 && coord.r < 8, `r=${coord.r} out of bounds in 8x8`);
      assert.ok(coord.c >= 0 && coord.c < 8, `c=${coord.c} out of bounds in 8x8`);
    }
  }
});

test('Board Size 12x12: Fleet randomization and edge cell usage', () => {
  const b12 = new Board(12);
  const success = b12.randomizeFleet(DEFAULT_FLEET);
  assert.equal(success, true);
  assert.equal(b12.ships.length, DEFAULT_FLEET.length);

  for (const ship of b12.ships) {
    for (const coord of ship.coordinates) {
      assert.ok(coord.r >= 0 && coord.r < 12, `r=${coord.r} out of bounds in 12x12`);
      assert.ok(coord.c >= 0 && coord.c < 12, `c=${coord.c} out of bounds in 12x12`);
    }
  }
});

test('GameEngine: Instantiates player and opponent boards with configured size', () => {
  const engine8 = new GameEngine({ boardSize: 8 });
  assert.equal(engine8.boardSize, 8);
  assert.equal(engine8.playerBoard.size, 8);
  assert.equal(engine8.opponentBoard.size, 8);

  const engine12 = new GameEngine({ boardSize: 12 });
  assert.equal(engine12.boardSize, 12);
  assert.equal(engine12.playerBoard.size, 12);
  assert.equal(engine12.opponentBoard.size, 12);
});

test('GameEngine 8x8: Setup to Battle and Ability execution', () => {
  const engine = new GameEngine({ boardSize: 8, phase: GAME_PHASE.SETUP });
  engine.setupBoards({ autoPlacePlayer: true, autoPlaceOpponent: true });

  const startRes = engine.startBattle();
  assert.equal(startRes.valid, true);
  assert.equal(engine.phase, GAME_PHASE.BATTLE);

  // Attack inside 8x8
  const attackRes = engine.attack(4, 4);
  assert.equal(attackRes.valid, true);

  // Attack outside 8x8
  const oobAttack = engine.attack(8, 8);
  assert.equal(oobAttack.valid, false);

  // Ability inside 8x8
  if (engine.currentTurn === 'player') {
    const bombRes = engine.useAbility(ABILITIES.BOMB.id, 2, 2);
    assert.equal(bombRes.valid, true);
  }
});

test('UI Template & Styles: Board size controls and CSS variables exist', () => {
  const html = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
  assert.ok(html.includes('id="board-size-badge"'), 'index.html has board-size-badge');
  assert.ok(html.includes('id="setup-size-pills"'), 'index.html has setup-size-pills');
  assert.ok(html.includes('id="radar-col-labels"'), 'index.html has radar-col-labels');
  assert.ok(html.includes('id="radar-row-labels"'), 'index.html has radar-row-labels');
  assert.ok(html.includes('id="fleet-col-labels"'), 'index.html has fleet-col-labels');
  assert.ok(html.includes('id="fleet-row-labels"'), 'index.html has fleet-row-labels');
  assert.ok(html.includes('id="btn-modal-size-8"'), 'index.html has btn-modal-size-8');
  assert.ok(html.includes('id="btn-modal-size-10"'), 'index.html has btn-modal-size-10');
  assert.ok(html.includes('id="btn-modal-size-12"'), 'index.html has btn-modal-size-12');

  const css = fs.readFileSync(path.join(projectRoot, 'src', 'ui', 'style.css'), 'utf8');
  assert.ok(css.includes('--board-size: 10;'), 'style.css defines --board-size');
  assert.ok(css.includes('repeat(var(--board-size'), 'style.css uses repeat(var(--board-size');
  assert.ok(css.includes('.setup-size-bar'), 'style.css defines setup-size-bar');
  assert.ok(css.includes('.size-options-grid'), 'style.css defines size-options-grid');
});
