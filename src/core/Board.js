import { BOARD_SIZE, CELL_STATUS } from './Constants.js';
import { Ship } from './Ship.js';

export class Board {
  constructor(size = BOARD_SIZE) {
    this.size = size;
    this.ships = [];
    this.shots = new Map(); // "r,c" => CELL_STATUS
    this.radarScans = new Map(); // "r,c" => CELL_STATUS
    this.obstacles = new Set(); // "r,c" => obstacle cell
  }

  setObstacles(coords) {
    this.obstacles.clear();
    if (!coords) return;
    if (coords instanceof Set) {
      this.obstacles = new Set(coords);
      return;
    }
    for (const c of coords) {
      if (typeof c === 'string') {
        this.obstacles.add(c);
      } else if (c && typeof c.r === 'number' && typeof c.c === 'number') {
        this.obstacles.add(`${c.r},${c.c}`);
      }
    }
  }

  isObstacle(r, c) {
    return this.obstacles.has(`${r},${c}`);
  }

  isWithinBounds(r, c) {
    return r >= 0 && r < this.size && c >= 0 && c < this.size;
  }

  getShipAt(r, c) {
    return this.ships.find(ship => ship.occupies(r, c)) || null;
  }

  /**
   * Rule 00: Check if placement is valid (in-bounds, not on obstacle, and no overlap).
   */
  isValidPlacement(coordinates, ignoreShipId = null) {
    for (const { r, c } of coordinates) {
      if (!this.isWithinBounds(r, c)) {
        return false;
      }
      if (this.isObstacle(r, c)) {
        return false;
      }
      // Check overlap with existing placed ships (ignoring itself if moving)
      const existing = this.getShipAt(r, c);
      if (existing !== null && existing.id !== ignoreShipId) {
        return false;
      }
    }
    return true;
  }

  placeShip(ship) {
    if (!this.isValidPlacement(ship.coordinates, ship.id)) {
      throw new Error(`Invalid ship placement for ship ${ship.id} (${ship.name})`);
    }
    // Remove if already placed previously
    this.removeShip(ship.id);
    this.ships.push(ship);
    return true;
  }

  removeShip(shipId) {
    const index = this.ships.findIndex(s => s.id === shipId);
    if (index !== -1) {
      const [removed] = this.ships.splice(index, 1);
      return removed;
    }
    return null;
  }

  clearShips() {
    this.ships = [];
    this.shots.clear();
    this.radarScans.clear();
  }

  /**
   * Standard single cell attack.
   */
  receiveAttack(r, c) {
    if (!this.isWithinBounds(r, c)) {
      return { valid: false, error: 'Out of bounds' };
    }

    if (this.isObstacle(r, c)) {
      return { valid: false, error: 'Kayalık veya ada bölgesine atış yapılamaz!' };
    }

    const key = `${r},${c}`;
    if (this.shots.has(key)) {
      return { valid: false, error: 'Already attacked this coordinate' };
    }

    const ship = this.getShipAt(r, c);
    if (ship) {
      ship.hit(r, c);
      if (ship.isSunk()) {
        // Mark all ship segments as SUNK
        for (const coord of ship.coordinates) {
          this.shots.set(`${coord.r},${coord.c}`, CELL_STATUS.SUNK);
        }
        return { valid: true, hit: true, sunk: true, ship, coord: { r, c } };
      }

      this.shots.set(key, CELL_STATUS.HIT);
      return { valid: true, hit: true, sunk: false, ship, coord: { r, c } };
    }

    this.shots.set(key, CELL_STATUS.MISS);
    return { valid: true, hit: false, sunk: false, coord: { r, c } };
  }

  /**
   * Bomba Ability: 3x3 area damage.
   */
  receiveBomb(centerR, centerC) {
    if (!this.isWithinBounds(centerR, centerC)) {
      return { valid: false, error: 'Center out of bounds' };
    }

    const affectedCells = [];
    const sunkShips = new Set();
    let hitsCount = 0;

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = centerR + dr;
        const c = centerC + dc;
        if (!this.isWithinBounds(r, c)) continue;
        if (this.isObstacle(r, c)) continue; // Natural barrier absorbs blast

        const key = `${r},${c}`;
        const currentShot = this.shots.get(key);
        if (currentShot === CELL_STATUS.HIT || currentShot === CELL_STATUS.SUNK) {
          continue; // Already processed
        }

        const ship = this.getShipAt(r, c);
        if (ship) {
          ship.hit(r, c);
          hitsCount++;
          if (ship.isSunk()) {
            sunkShips.add(ship);
            for (const coord of ship.coordinates) {
              this.shots.set(`${coord.r},${coord.c}`, CELL_STATUS.SUNK);
            }
          } else {
            this.shots.set(key, CELL_STATUS.HIT);
          }
          affectedCells.push({ r, c, status: ship.isSunk() ? CELL_STATUS.SUNK : CELL_STATUS.HIT });
        } else {
          this.shots.set(key, CELL_STATUS.MISS);
          affectedCells.push({ r, c, status: CELL_STATUS.MISS });
        }
      }
    }

    return {
      valid: true,
      affectedCells,
      hitsCount,
      sunkShips: Array.from(sunkShips)
    };
  }

  /**
   * Radar Ability: 3x3 scan for ship presence without dealing damage.
   * Accurately marks exact ship piece locations as RADAR_DETECTED and clear water as RADAR_EMPTY.
   */
  receiveRadar(centerR, centerC) {
    if (!this.isWithinBounds(centerR, centerC)) {
      return { valid: false, error: 'Center out of bounds' };
    }

    const scannedCells = [];
    const detectedCells = [];

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = centerR + dr;
        const c = centerC + dc;
        if (!this.isWithinBounds(r, c)) continue;

        scannedCells.push({ r, c });
        const ship = this.getShipAt(r, c);

        // Detect and pinpoint exact ship piece location if ship exists and is not sunk
        if (ship && !ship.isSunk()) {
          detectedCells.push({ r, c });
          this.radarScans.set(`${r},${c}`, CELL_STATUS.RADAR_DETECTED);
        } else {
          // If this cell was NOT previously detected as a ship in another scan, mark as empty
          if (this.radarScans.get(`${r},${c}`) !== CELL_STATUS.RADAR_DETECTED) {
            this.radarScans.set(`${r},${c}`, CELL_STATUS.RADAR_EMPTY);
          }
        }
      }
    }

    const detected = detectedCells.length > 0;

    return {
      valid: true,
      detected,
      detectedCount: detectedCells.length,
      detectedCells,
      center: { r: centerR, c: centerC },
      scannedCells
    };
  }

  /**
   * Nükleer Ability: If it hits a ship piece, the entire ship sinks instantly!
   */
  receiveNuke(r, c) {
    if (!this.isWithinBounds(r, c)) {
      return { valid: false, error: 'Out of bounds' };
    }

    if (this.isObstacle(r, c)) {
      return { valid: false, error: 'Kayalık veya ada bölgesine nükleer atılamaz!' };
    }

    const key = `${r},${c}`;
    if (this.shots.has(key)) {
      return { valid: false, error: 'Bu koordinata daha önce atış yapıldı! Başka bir koordinat seçin.' };
    }

    const ship = this.getShipAt(r, c);

    if (ship) {
      // Rule: Chain reaction destroys all parts of the targeted ship
      ship.hitAll();
      for (const coord of ship.coordinates) {
        this.shots.set(`${coord.r},${coord.c}`, CELL_STATUS.SUNK);
      }
      return { valid: true, hit: true, sunk: true, ship, coord: { r, c } };
    }

    this.shots.set(key, CELL_STATUS.MISS);
    return { valid: true, hit: false, sunk: false, coord: { r, c } };
  }

  allShipsSunk() {
    return this.ships.length > 0 && this.ships.every(ship => ship.isSunk());
  }

  /**
   * Generates a random fleet placement without overlaps.
   */
  randomizeFleet(fleetTemplates) {
    this.ships = [];
    this.shots.clear();
    this.radarScans.clear();

    for (const template of fleetTemplates) {
      let placed = false;
      let attempts = 0;
      const maxAttempts = 1000;

      while (!placed && attempts < maxAttempts) {
        attempts++;
        const isVertical = Math.random() < 0.5;
        const originR = Math.floor(Math.random() * this.size);
        const originC = Math.floor(Math.random() * this.size);

        const coords = Ship.generateCoordinates(originR, originC, template.size, template.shape, isVertical);
        if (this.isValidPlacement(coords)) {
          const ship = new Ship({
            id: template.id,
            name: template.name,
            coordinates: coords
          });
          this.placeShip(ship);
          placed = true;
        }
      }

      if (!placed) {
        // Fallback retry whole board if cramped
        return this.randomizeFleet(fleetTemplates);
      }
    }

    return true;
  }
}
