import { MAP_THEMES, THEME_SELECTION, BOARD_SIZE, DEFAULT_FLEET } from './Constants.js';
import { Board } from './Board.js';

export class TerrainGenerator {
  /**
   * Resolves the theme object given a theme ID or 'random'.
   */
  static resolveTheme(themeId = THEME_SELECTION.RANDOM) {
    if (!themeId || themeId === THEME_SELECTION.RANDOM) {
      const themes = Object.values(MAP_THEMES);
      const randomIndex = Math.floor(Math.random() * themes.length);
      return themes[randomIndex];
    }
    const found = Object.values(MAP_THEMES).find(t => t.id === themeId);
    return found || MAP_THEMES.OCEAN;
  }

  /**
   * Generates obstacle cells for a given boardSize and theme.
   * Ensures the fleet can be placed comfortably without deadlock.
   */
  static generateTerrain({
    boardSize = BOARD_SIZE,
    themeId = THEME_SELECTION.RANDOM,
    fleetTemplates = DEFAULT_FLEET,
    maxRetries = 50
  } = {}) {
    const theme = this.resolveTheme(themeId);
    const totalCells = boardSize * boardSize;

    // Calculate target obstacle count based on density
    const [minDensity, maxDensity] = theme.densityRange;
    const targetDensity = minDensity + Math.random() * (maxDensity - minDensity);
    let targetObstacleCount = Math.round(totalCells * targetDensity);

    // Hard safety clamp: Never allow obstacles to take more than 20% of the board
    targetObstacleCount = Math.min(targetObstacleCount, Math.floor(totalCells * 0.20));

    if (targetObstacleCount === 0) {
      return {
        theme,
        obstacles: [],
        obstacleKeys: new Set()
      };
    }

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const obstacles = new Set();

      // Cluster generation for Archipelago, scatter/clump for Arctic/Reef
      let placedCount = 0;
      let clusterAttempts = 0;

      while (placedCount < targetObstacleCount && clusterAttempts < 200) {
        clusterAttempts++;
        const clusterSize = theme.id === MAP_THEMES.ARCHIPELAGO.id
          ? Math.floor(Math.random() * 3) + 1 // 1 to 3 cells per island
          : (theme.id === MAP_THEMES.ARCTIC.id ? (Math.random() < 0.6 ? 2 : 1) : 1);

        const seedR = Math.floor(Math.random() * boardSize);
        const seedC = Math.floor(Math.random() * boardSize);

        const candidates = [{ r: seedR, c: seedC }];
        if (clusterSize > 1) {
          const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0]];
          for (let i = 1; i < clusterSize; i++) {
            const dir = dirs[Math.floor(Math.random() * dirs.length)];
            const nr = seedR + dir[0];
            const nc = seedC + dir[1];
            if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize) {
              candidates.push({ r: nr, c: nc });
            }
          }
        }

        for (const cand of candidates) {
          const key = `${cand.r},${cand.c}`;
          if (!obstacles.has(key) && placedCount < targetObstacleCount) {
            obstacles.add(key);
            placedCount++;
          }
        }
      }

      // Convert Set of keys to coordinates array
      const coords = Array.from(obstacles).map(key => {
        const [r, c] = key.split(',').map(Number);
        return { r, c };
      });

      // Solvability check: Ensure all ships can still be successfully placed
      const testBoard = new Board(boardSize);
      testBoard.setObstacles(coords);

      try {
        const fleetPlaced = testBoard.randomizeFleet(fleetTemplates);
        if (fleetPlaced && testBoard.ships.length === fleetTemplates.length) {
          return {
            theme,
            obstacles: coords,
            obstacleKeys: obstacles
          };
        }
      } catch (err) {
        // Retry with a new seed
      }
    }

    // Fallback: If heavy density struggled on small board, return empty or light terrain
    return {
      theme,
      obstacles: [],
      obstacleKeys: new Set()
    };
  }
}
