export const BOARD_SIZE = 10;

export const CELL_STATUS = {
  EMPTY: 'empty',
  MISS: 'miss',
  HIT: 'hit',
  SUNK: 'sunk',
  RADAR_DETECTED: 'radar_detected',
  RADAR_EMPTY: 'radar_empty'
};

export const GAME_PHASE = {
  SETUP: 'setup',
  BATTLE: 'battle',
  GAME_OVER: 'game_over'
};

export const ABILITIES = {
  BOMB: {
    id: 'bomb',
    name: 'Bomba',
    manaCost: 4,
    radius: 1, // 3x3 centered
    description: '3x3 alanda bulunan tüm gemi parçalarını patlatır.'
  },
  RADAR: {
    id: 'radar',
    name: 'Radar',
    manaCost: 2,
    radius: 1, // 3x3 centered
    description: '3x3 alanda herhangi bir gemi parçası olup olmadığını tespit eder.'
  },
  NUKE: {
    id: 'nuke',
    name: 'Nükleer',
    manaCost: 6,
    radius: 0, // Direct hit
    description: 'Bir gemi parçasına denk gelirse o geminin tüm parçalarını anında batırır.'
  }
};

export const GAME_RULES = {
  STARTING_MANA: 6,
  MAX_MANA: 10,
  MANA_PER_ROUND: 2
};

// Default fleet templates inspired by classic + user custom sketches (L-shape, etc.)
export const DEFAULT_FLEET = [
  { id: 'carrier', name: 'Uçak Gemisi', size: 5, shape: 'linear' },
  { id: 'battleship', name: 'Kruvazör', size: 4, shape: 'linear' },
  { id: 'destroyer', name: 'Muhrip', size: 3, shape: 'linear' },
  { id: 'submarine', name: 'Denizaltı', size: 3, shape: 'linear' },
  { id: 'patrol', name: 'Devriye Botu', size: 2, shape: 'linear' },
  // Custom sketch L-ship (Gun/L shape: 4 blocks)
  { id: 'gunship', name: 'L-Hücumbot', size: 4, shape: 'L' }
];
