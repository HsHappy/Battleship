import { BOARD_SIZE, ABILITIES, GAME_RULES, DEFAULT_FLEET, GAME_PHASE } from './Constants.js';
import { Board } from './Board.js';

export class GameEngine {
  constructor({
    fleetTemplates = DEFAULT_FLEET,
    startingMana = GAME_RULES.STARTING_MANA,
    maxMana = GAME_RULES.MAX_MANA,
    manaPerRound = GAME_RULES.MANA_PER_ROUND,
    phase = GAME_PHASE.BATTLE
  } = {}) {
    this.fleetTemplates = fleetTemplates;
    this.maxMana = maxMana;
    this.manaPerRound = manaPerRound;
    this.phase = phase;

    this.playerBoard = new Board(BOARD_SIZE);
    this.opponentBoard = new Board(BOARD_SIZE);

    this.currentTurn = 'player'; // 'player' | 'opponent'
    this.turnHistory = [];
    this.roundCount = 1;

    // Track which players took their turn in the current round
    this.playersMovedThisRound = new Set();

    this.mana = {
      player: startingMana,
      opponent: startingMana
    };

    this.winner = null;
    this.isOver = false;
  }

  setupBoards({ autoPlacePlayer = false } = {}) {
    if (autoPlacePlayer) {
      this.playerBoard.randomizeFleet(this.fleetTemplates);
      this.phase = GAME_PHASE.BATTLE;
    } else {
      this.phase = GAME_PHASE.SETUP;
    }
    this.opponentBoard.randomizeFleet(this.fleetTemplates);
  }

  /**
   * Starts the battle phase once player has placed all fleet ships.
   */
  startBattle({ bypassValidation = false } = {}) {
    if (!bypassValidation && this.playerBoard.ships.length !== this.fleetTemplates.length) {
      return {
        valid: false,
        error: `Tüm gemileri yerleştirmelisiniz (${this.playerBoard.ships.length}/${this.fleetTemplates.length})`
      };
    }

    if (this.opponentBoard.ships.length === 0) {
      this.opponentBoard.randomizeFleet(this.fleetTemplates);
    }

    this.phase = GAME_PHASE.BATTLE;
    return { valid: true };
  }

  getCurrentTargetBoard() {
    return this.currentTurn === 'player' ? this.opponentBoard : this.playerBoard;
  }

  getOpponentRole() {
    return this.currentTurn === 'player' ? 'opponent' : 'player';
  }

  /**
   * Completes a turn, checks for round transitions, and regenerates mana (Rule 03).
   */
  endTurn() {
    this.playersMovedThisRound.add(this.currentTurn);

    // If both players have completed a turn sequence, finish round & replenish mana (Rule 03)
    if (this.playersMovedThisRound.has('player') && this.playersMovedThisRound.has('opponent')) {
      this.mana.player = Math.min(this.maxMana, this.mana.player + this.manaPerRound);
      this.mana.opponent = Math.min(this.maxMana, this.mana.opponent + this.manaPerRound);
      this.roundCount++;
      this.playersMovedThisRound.clear();
    }

    this.currentTurn = this.getOpponentRole();
  }

  /**
   * Normal attack on (r, c).
   * Rules 02 & 04:
   * - If hit: player keeps turn (streak).
   * - If miss: turn passes to opponent.
   */
  attack(r, c) {
    if (this.isOver) {
      return { valid: false, error: 'Game is already over' };
    }

    if (this.phase !== GAME_PHASE.BATTLE) {
      return { valid: false, error: 'Oyun henüz başlamadı (Konuşlandırma aşaması)' };
    }

    const targetBoard = this.getCurrentTargetBoard();
    const result = targetBoard.receiveAttack(r, c);

    if (!result.valid) {
      return result;
    }

    // Check game over
    if (targetBoard.allShipsSunk()) {
      this.isOver = true;
      this.phase = GAME_PHASE.GAME_OVER;
      this.winner = this.currentTurn;
      return { ...result, gameOver: true, winner: this.winner };
    }

    if (result.hit) {
      // Rule 04: Keep turn on hit
      return { ...result, keepsTurn: true };
    } else {
      // Rule 02: Pass turn on miss
      this.endTurn();
      return { ...result, keepsTurn: false };
    }
  }

  /**
   * Use a special ability.
   * Rule 01: Once used, player cannot perform another attack or ability; turn finishes immediately!
   */
  useAbility(abilityId, r, c) {
    if (this.isOver) {
      return { valid: false, error: 'Game is already over' };
    }

    if (this.phase !== GAME_PHASE.BATTLE) {
      return { valid: false, error: 'Oyun henüz başlamadı (Konuşlandırma aşaması)' };
    }

    const ability = Object.values(ABILITIES).find(a => a.id === abilityId);
    if (!ability) {
      return { valid: false, error: `Unknown ability: ${abilityId}` };
    }

    if (this.mana[this.currentTurn] < ability.manaCost) {
      return {
        valid: false,
        error: `Insufficient mana: requires ${ability.manaCost}, have ${this.mana[this.currentTurn]}`
      };
    }

    const targetBoard = this.getCurrentTargetBoard();
    let abilityResult;

    if (ability.id === ABILITIES.BOMB.id) {
      abilityResult = targetBoard.receiveBomb(r, c);
    } else if (ability.id === ABILITIES.RADAR.id) {
      abilityResult = targetBoard.receiveRadar(r, c);
    } else if (ability.id === ABILITIES.NUKE.id) {
      abilityResult = targetBoard.receiveNuke(r, c);
    }

    if (!abilityResult.valid) {
      return abilityResult;
    }

    // Deduct mana
    this.mana[this.currentTurn] -= ability.manaCost;

    // Check game over
    if (targetBoard.allShipsSunk()) {
      this.isOver = true;
      this.winner = this.currentTurn;
      return {
        valid: true,
        ability,
        result: abilityResult,
        gameOver: true,
        winner: this.winner
      };
    }

    // Rule 01: Turn ends immediately upon ability use
    this.endTurn();

    return {
      valid: true,
      ability,
      result: abilityResult,
      keepsTurn: false
    };
  }
}
