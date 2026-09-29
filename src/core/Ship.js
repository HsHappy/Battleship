export class Ship {
  /**
   * @param {Object} options
   * @param {string} options.id
   * @param {string} options.name
   * @param {Array<{r: number, c: number}>} options.coordinates
   */
  constructor({ id, name, coordinates = [] }) {
    this.id = id;
    this.name = name;
    this.coordinates = coordinates;
    this.hits = new Set();
  }

  occupies(r, c) {
    return this.coordinates.some(coord => coord.r === r && coord.c === c);
  }

  hit(r, c) {
    if (this.occupies(r, c)) {
      this.hits.add(`${r},${c}`);
      return true;
    }
    return false;
  }

  isSunk() {
    return this.coordinates.length > 0 && this.hits.size === this.coordinates.length;
  }

  hitAll() {
    for (const coord of this.coordinates) {
      this.hits.add(`${coord.r},${coord.c}`);
    }
  }

  /**
   * Creates coordinates for a ship based on origin, size, shape, and orientation.
   */
  static generateCoordinates(originR, originC, size, shape = 'linear', isVertical = false) {
    const coords = [];

    if (shape === 'linear') {
      for (let i = 0; i < size; i++) {
        coords.push({
          r: isVertical ? originR + i : originR,
          c: isVertical ? originC : originC + i
        });
      }
    } else if (shape === 'L') {
      // 4-cell L shape (sketch: 3 long base, 1 wing)
      // e.g.:
      // [X][X][X]
      // [X]
      if (!isVertical) {
        coords.push({ r: originR, c: originC });
        coords.push({ r: originR, c: originC + 1 });
        coords.push({ r: originR, c: originC + 2 });
        coords.push({ r: originR + 1, c: originC });
      } else {
        coords.push({ r: originR, c: originC });
        coords.push({ r: originR + 1, c: originC });
        coords.push({ r: originR + 2, c: originC });
        coords.push({ r: originR, c: originC + 1 });
      }
    }

    return coords;
  }
}
