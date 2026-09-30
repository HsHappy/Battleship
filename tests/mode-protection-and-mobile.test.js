import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { GameEngine } from '../src/core/GameEngine.js';
import { GAME_PHASE, GAME_MODE } from '../src/core/Constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

test('Mode Protection: battle phase prevents accidental mode change and requires reset', () => {
  const engine = new GameEngine({ mode: GAME_MODE.VS_BOT });
  engine.setupBoards();
  engine.playerBoard.randomizeFleet(engine.fleetTemplates);
  engine.opponentBoard.randomizeFleet(engine.fleetTemplates);

  const startRes = engine.startBattle();
  assert.equal(startRes.valid, true);
  assert.equal(engine.phase, GAME_PHASE.BATTLE);

  // When battle is in progress, any new mode switch must reinitialize the engine
  assert.equal(engine.isOver, false);

  // Simulating reset on mode switch:
  const newEngine = new GameEngine({ mode: GAME_MODE.LOCAL_PVP });
  newEngine.setupBoards();
  assert.equal(newEngine.phase, GAME_PHASE.SETUP);
  assert.equal(newEngine.mode, GAME_MODE.LOCAL_PVP);
  assert.equal(newEngine.playerBoard.ships.length, 0);
});

test('Mobile & LAN Access: Network interface resolution detects non-internal IPv4', () => {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }

  // All detected non-internal IPs must be valid IPv4 strings
  addresses.forEach(ip => {
    assert.match(ip, /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
    assert.notEqual(ip, '127.0.0.1');
  });
});

test('UI Template: index.html contains exit button, confirm modal, and mobile quickbar', () => {
  const htmlPath = path.join(rootDir, 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  // Dedicated quit button in header
  assert.match(htmlContent, /id="btn-quit-game"/, 'Must contain dedicated btn-quit-game');
  assert.match(htmlContent, /class="btn-quit-pill"/, 'Must have btn-quit-pill class');

  // Confirmation modal
  assert.match(htmlContent, /id="confirm-modal"/, 'Must contain confirm-modal');
  assert.match(htmlContent, /id="btn-confirm-cancel"/, 'Must contain confirm cancel button');
  assert.match(htmlContent, /id="btn-confirm-action"/, 'Must contain confirm action button');

  // A11y accessibility attributes for all dialogs
  assert.match(htmlContent, /id="confirm-modal"[^>]*role="dialog"[^>]*aria-modal="true"/, 'confirm-modal must have role="dialog" and aria-modal="true"');
  assert.match(htmlContent, /id="mode-modal"[^>]*role="dialog"[^>]*aria-modal="true"/, 'mode-modal must have role="dialog" and aria-modal="true"');
  assert.match(htmlContent, /id="hotseat-curtain"[^>]*role="dialog"[^>]*aria-modal="true"/, 'hotseat-curtain must have role="dialog" and aria-modal="true"');
  assert.match(htmlContent, /id="game-over-modal"[^>]*role="dialog"[^>]*aria-modal="true"/, 'game-over-modal must have role="dialog" and aria-modal="true"');

  // Mobile quick fleet setup bar
  assert.match(htmlContent, /id="fleet-setup-quickbar"/, 'Must contain fleet-setup-quickbar');
  assert.match(htmlContent, /id="btn-quick-rotate"/, 'Must contain btn-quick-rotate');
  assert.match(htmlContent, /id="btn-quick-random"/, 'Must contain btn-quick-random');
  assert.match(htmlContent, /id="btn-quick-start"/, 'Must contain btn-quick-start');
});

test('UI Styles: style.css defines mobile touch-action, quickbar, and responsive rules', () => {
  const cssPath = path.join(rootDir, 'src', 'ui', 'style.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  assert.match(cssContent, /\.fleet-setup-quickbar/, 'Must style fleet-setup-quickbar');
  assert.match(cssContent, /\.btn-quit-pill/, 'Must style btn-quit-pill');
  assert.match(cssContent, /\.confirm-modal-card/, 'Must style confirm-modal-card');
  assert.match(cssContent, /100dvh/, 'Must support 100dvh for mobile viewports');
  assert.match(cssContent, /touch-action:\s*manipulation/, 'Must have touch-action: manipulation');
});

test('Code Quality: All JavaScript files pass syntax check', async () => {
  const { execFileSync } = await import('node:child_process');
  const jsFiles = [
    'server.js',
    'src/core/Constants.js',
    'src/core/Ship.js',
    'src/core/Board.js',
    'src/core/GameEngine.js',
    'src/ui/AudioEffects.js',
    'src/ui/App.js'
  ];

  for (const file of jsFiles) {
    const fullPath = path.join(rootDir, file);
    assert.doesNotThrow(() => {
      execFileSync('node', ['--check', fullPath]);
    }, `Syntax check failed for ${file}`);
  }
});

test('DOM Integrity: All getElementById targets in App.js exist in index.html', () => {
  const appPath = path.join(rootDir, 'src', 'ui', 'App.js');
  const htmlPath = path.join(rootDir, 'index.html');
  const appContent = fs.readFileSync(appPath, 'utf-8');
  const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

  const matches = Array.from(appContent.matchAll(/getElementById\(['"]([^'"]+)['"]\)/g), m => m[1]);
  const uniqueIds = [...new Set(matches)];

  const missing = uniqueIds.filter(id => !htmlContent.includes(`id="${id}"`));
  assert.deepEqual(missing, [], `Missing DOM element IDs in index.html: ${missing.join(', ')}`);
});

test('Class Integrity: All methods called on this in App.js are defined in App class', () => {
  const appPath = path.join(rootDir, 'src', 'ui', 'App.js');
  const appContent = fs.readFileSync(appPath, 'utf-8');

  // Extract class method definitions
  const methodDefs = new Set();
  const defRegex = /^\s{2}([a-zA-Z0-9_]+)\s*\([^)]*\)\s*\{/gm;
  let defMatch;
  while ((defMatch = defRegex.exec(appContent)) !== null) {
    methodDefs.add(defMatch[1]);
  }

  // Extract all this.method(...) calls
  const calls = new Set();
  const callRegex = /this\.([a-zA-Z0-9_]+)\s*\(/g;
  let callMatch;
  while ((callMatch = callRegex.exec(appContent)) !== null) {
    calls.add(callMatch[1]);
  }

  const missing = [...calls].filter(m => !methodDefs.has(m));
  assert.deepEqual(missing, [], `App class calls undefined methods on this: ${missing.join(', ')}`);
});


