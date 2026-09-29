import { GameEngine } from '../core/GameEngine.js';
import { CELL_STATUS, ABILITIES, BOARD_SIZE, GAME_PHASE } from '../core/Constants.js';
import { Ship } from '../core/Ship.js';
import { sounds } from './AudioEffects.js';

class App {
  constructor() {
    this.engine = new GameEngine();
    this.selectedAbility = null; // 'bomb' | 'radar' | 'nuke' | null
    this.hoverCenter = null;

    // Placement State
    this.selectedShipTemplate = null;
    this.isVertical = false;
    this.lastHoveredCell = null;

    // DOM Elements
    this.opponentGrid = document.getElementById('opponent-grid');
    this.playerGrid = document.getElementById('player-grid');
    this.manaCountText = document.getElementById('mana-count-text');
    this.manaSlotsContainer = document.getElementById('mana-slots');
    this.turnPill = document.getElementById('turn-pill');
    this.gameBanner = document.getElementById('game-banner');
    this.shipListContainer = document.getElementById('ship-list-container');
    this.shipsAliveCount = document.getElementById('ships-alive-count');
    this.opponentHitsCounter = document.getElementById('opponent-hits-counter');
    this.playerHitsCounter = document.getElementById('player-hits-counter');

    // Panels for mobile tab switching
    this.panelRadar = document.getElementById('panel-radar');
    this.panelFleet = document.getElementById('panel-fleet');
    this.panelShips = document.getElementById('panel-ships');
    this.mobileTabs = document.getElementById('mobile-tabs');

    // Setup Controls Elements
    this.setupControls = document.getElementById('setup-controls');
    this.dockShipList = document.getElementById('dock-ship-list');
    this.setupPlacedCount = document.getElementById('setup-placed-count');
    this.btnRotate = document.getElementById('btn-rotate');
    this.rotateLabel = document.getElementById('rotate-label');
    this.btnRandomFleet = document.getElementById('btn-random-fleet');
    this.btnClearFleet = document.getElementById('btn-clear-fleet');
    this.btnStartBattle = document.getElementById('btn-start-battle');
    this.battleShipList = document.getElementById('battle-ship-list');
    this.radarLockedOverlay = document.getElementById('radar-locked-overlay');

    // Modal
    this.modal = document.getElementById('game-over-modal');
    this.modalTitle = document.getElementById('modal-title');
    this.modalDesc = document.getElementById('modal-desc');
    this.btnRestart = document.getElementById('btn-restart');

    // Abilities & Mana
    this.btnBomb = document.getElementById('btn-ability-bomb');
    this.btnRadar = document.getElementById('btn-ability-radar');
    this.btnNuke = document.getElementById('btn-ability-nuke');
    this.btnManaCharge = document.getElementById('btn-mana-charge');

    this.init();
  }

  init() {
    this.engine.setupBoards({ autoPlacePlayer: false });
    this.setupMobileTabs();
    this.setupAbilityButtons();
    this.setupSoundButton();
    this.setupFleetPlacementControls();
    this.btnRestart.addEventListener('click', () => this.restartGame());

    if (this.btnManaCharge) {
      this.btnManaCharge.addEventListener('click', () => {
        if (this.engine.isOver) return;
        this.engine.mana.player = Math.min(this.engine.maxMana, this.engine.mana.player + 2);
        this.updateHUD();
        sounds.playClick();
        this.setBanner(`⚡ +2 Mana şarj edildi! Mevcut mana: ${this.engine.mana.player} / ${this.engine.maxMana}`);
      });
    }

    this.turnPill.textContent = '🛠️ KONUŞLANDIRMA';
    this.turnPill.classList.remove('opponent');
    this.setBanner('Donanmanı konuşlandır! Gemi seç, çevirmek için "R" tuşuna bas.');

    this.selectNextUnplacedShip();
    this.renderGrids();
    this.renderSetupDock();
    this.updateHUD();
  }

  restartGame() {
    this.engine = new GameEngine();
    this.engine.setupBoards({ autoPlacePlayer: false });
    this.selectedAbility = null;
    this.selectedShipTemplate = null;
    this.isVertical = false;
    if (this.rotateLabel) this.rotateLabel.textContent = 'Yatay';

    [this.btnBomb, this.btnRadar, this.btnNuke].forEach(b => b?.classList.remove('active'));
    this.clearTargetHighlights();

    if (this.setupControls) this.setupControls.style.display = 'flex';
    if (this.battleShipList) this.battleShipList.style.display = 'none';
    if (this.radarLockedOverlay) this.radarLockedOverlay.classList.remove('hidden');

    this.turnPill.textContent = '🛠️ KONUŞLANDIRMA';
    this.turnPill.classList.remove('opponent');
    this.modal.style.display = 'none';

    this.selectNextUnplacedShip();
    this.renderGrids();
    this.renderSetupDock();
    this.updateHUD();
    this.setBanner('Yeni oyun! Donanmanı konuşlandır veya "🎲 Rastgele" seçeneğini kullan.');

    if (window.innerWidth < 900) {
      const fleetBtn = this.mobileTabs.querySelector('[data-tab="fleet"]');
      if (fleetBtn) fleetBtn.click();
    }
  }

  setupSoundButton() {
    const btn = document.getElementById('sound-btn');
    btn.addEventListener('click', () => {
      sounds.muted = !sounds.muted;
      btn.textContent = sounds.muted ? '🔇' : '🔊';
    });
  }

  setupMobileTabs() {
    const buttons = this.mobileTabs.querySelectorAll('.tab-btn');

    const applyTabVisibility = () => {
      if (window.innerWidth >= 900) {
        this.panelRadar.style.display = '';
        this.panelFleet.style.display = '';
        this.panelShips.style.display = '';
        return;
      }
      const activeBtn = this.mobileTabs.querySelector('.tab-btn.active') || buttons[0];
      const tab = activeBtn.dataset.tab;
      this.panelRadar.style.display = tab === 'radar' ? 'flex' : 'none';
      this.panelFleet.style.display = tab === 'fleet' ? 'flex' : 'none';
      this.panelShips.style.display = tab === 'ships' ? 'block' : 'none';
    };

    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        sounds.playClick();
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyTabVisibility();
      });
    });

    window.addEventListener('resize', applyTabVisibility);
    applyTabVisibility();
  }

  setupAbilityButtons() {
    const abilityCards = [
      { el: this.btnBomb, id: ABILITIES.BOMB.id },
      { el: this.btnRadar, id: ABILITIES.RADAR.id },
      { el: this.btnNuke, id: ABILITIES.NUKE.id }
    ];

    abilityCards.forEach(({ el, id }) => {
      if (!el) return;
      el.addEventListener('click', () => {
        const ability = Object.values(ABILITIES).find(a => a.id === id);
        if (!ability) return;

        // If in setup phase, guide the user
        if (this.engine.phase === GAME_PHASE.SETUP) {
          sounds.playMiss();
          el.classList.add('shake');
          setTimeout(() => el.classList.remove('shake'), 400);
          this.setBanner('⚠️ Yetenekler savaş başladığında kullanılır. Önce donanmanı yerleştirip "Savaşa Başla" butonuna tıkla!');
          return;
        }

        // If game is over, ignore
        if (this.engine.isOver) return;

        // If opponent's turn, inform the user
        if (this.engine.currentTurn !== 'player') {
          sounds.playMiss();
          el.classList.add('shake');
          setTimeout(() => el.classList.remove('shake'), 400);
          this.setBanner('⏳ Sıra düşmanda! Düşmanın atışını yapmasını bekleyin.');
          return;
        }

        // Check if player has enough mana
        if (this.engine.mana.player < ability.manaCost) {
          sounds.playMiss();
          el.classList.add('shake');
          setTimeout(() => el.classList.remove('shake'), 400);
          this.setBanner(`💧 Yetersiz Mana! ${ability.name} için ${ability.manaCost} mana gerekli. (Mevcut: ${this.engine.mana.player} Mana)`);
          return;
        }

        sounds.playClick();
        if (this.selectedAbility === id) {
          this.selectedAbility = null;
          el.classList.remove('active');
          this.setBanner('Yetenek iptal edildi. Standart atış yapabilirsin.');
        } else {
          abilityCards.forEach(c => c.el.classList.remove('active'));
          this.selectedAbility = id;
          el.classList.add('active');

          if (id === ABILITIES.BOMB.id) {
            this.setBanner('💣 BOMBA seçildi! Düşman haritasında 3x3 patlama alanının merkezini seç.');
          } else if (id === ABILITIES.RADAR.id) {
            this.setBanner('📡 RADAR seçildi! Düşman haritasında 3x3 tarama alanının merkezini seç.');
          } else if (id === ABILITIES.NUKE.id) {
            this.setBanner('☢️ NÜKLEER seçildi! Düşman haritasında hedef koordinatı seç (Gemiye denk gelirse tek atışta batırır).');
          }
        }
        this.clearTargetHighlights();
      });
    });

    // Keyboard shortcuts: 1 (Bomb), 2 (Radar), 3 (Nuke), Escape (Cancel)
    window.addEventListener('keydown', (e) => {
      if (this.engine.phase !== GAME_PHASE.BATTLE || this.engine.currentTurn !== 'player' || this.engine.isOver) return;

      if (e.key === '1') {
        this.btnBomb?.click();
      } else if (e.key === '2') {
        this.btnRadar?.click();
      } else if (e.key === '3') {
        this.btnNuke?.click();
      } else if (e.key === 'Escape') {
        if (this.selectedAbility) {
          this.selectedAbility = null;
          abilityCards.forEach(c => c.el.classList.remove('active'));
          this.clearTargetHighlights();
          sounds.playClick();
          this.setBanner('Yetenek iptal edildi. Standart atış yapabilirsin.');
        }
      }
    });

    // Right-click anywhere cancels selected ability
    window.addEventListener('contextmenu', (e) => {
      if (this.selectedAbility) {
        e.preventDefault();
        this.selectedAbility = null;
        abilityCards.forEach(c => c.el.classList.remove('active'));
        this.clearTargetHighlights();
        sounds.playClick();
        this.setBanner('Yetenek iptal edildi. Standart atış yapabilirsin.');
      }
    });
  }

  setBanner(msg) {
    this.gameBanner.textContent = msg;
  }

  setupFleetPlacementControls() {
    this.btnRotate.addEventListener('click', () => this.toggleOrientation());
    this.btnRandomFleet.addEventListener('click', () => this.randomizePlayerFleet());
    this.btnClearFleet.addEventListener('click', () => this.clearPlayerFleet());
    this.btnStartBattle.addEventListener('click', () => this.startBattle());

    // Keyboard shortcut: 'R' key to rotate
    window.addEventListener('keydown', (e) => {
      if (this.engine.phase === GAME_PHASE.SETUP && (e.key === 'r' || e.key === 'R')) {
        this.toggleOrientation();
      }
    });
  }

  toggleOrientation() {
    this.isVertical = !this.isVertical;
    if (this.rotateLabel) {
      this.rotateLabel.textContent = this.isVertical ? 'Dikey' : 'Yatay';
    }
    sounds.playRotate();
    if (this.lastHoveredCell) {
      this.handlePlacementHover(this.lastHoveredCell.r, this.lastHoveredCell.c);
    }
  }

  randomizePlayerFleet() {
    this.engine.playerBoard.randomizeFleet(this.engine.fleetTemplates);
    sounds.playShipPlace();
    this.selectedShipTemplate = null;
    this.clearPlacementPreview();
    this.renderGrids();
    this.renderSetupDock();
    this.setBanner('Filo rastgele konuşlandırıldı. Hazırsan savaşı başlat!');
  }

  clearPlayerFleet() {
    this.engine.playerBoard.clearShips();
    sounds.playClick();
    this.clearPlacementPreview();
    this.selectNextUnplacedShip();
    this.renderGrids();
    this.renderSetupDock();
    this.setBanner('Tahta temizlendi. Gemilerini yeniden konuşlandır.');
  }

  startBattle() {
    const res = this.engine.startBattle();
    if (!res.valid) {
      this.setBanner(res.error);
      return;
    }

    sounds.playBattleStart();
    if (this.setupControls) this.setupControls.style.display = 'none';
    if (this.battleShipList) this.battleShipList.style.display = 'block';
    if (this.radarLockedOverlay) this.radarLockedOverlay.classList.add('hidden');

    this.turnPill.textContent = 'SIRA SENDE';
    this.turnPill.classList.remove('opponent');
    this.setBanner('⚔️ Savaş Başladı! Düşman sularına bir koordinat seçerek ateş et.');

    this.renderGrids();
    this.updateHUD();
    this.updateShipList();

    // On mobile screens, automatically switch tab to enemy radar
    if (window.innerWidth < 900) {
      const radarBtn = this.mobileTabs.querySelector('[data-tab="radar"]');
      if (radarBtn) radarBtn.click();
    }
  }

  renderSetupDock() {
    if (!this.dockShipList) return;
    this.dockShipList.innerHTML = '';

    const placedShips = this.engine.playerBoard.ships;
    const placedCount = placedShips.length;
    const totalCount = this.engine.fleetTemplates.length;

    if (this.setupPlacedCount) {
      this.setupPlacedCount.textContent = `${placedCount} / ${totalCount}`;
    }

    if (this.btnStartBattle) {
      if (placedCount === totalCount) {
        this.btnStartBattle.disabled = false;
        this.btnStartBattle.classList.add('ready');
      } else {
        this.btnStartBattle.disabled = true;
        this.btnStartBattle.classList.remove('ready');
      }
    }

    this.engine.fleetTemplates.forEach(template => {
      const isPlaced = placedShips.some(s => s.id === template.id);
      const isSelected = this.selectedShipTemplate && this.selectedShipTemplate.id === template.id;

      const item = document.createElement('div');
      item.classList.add('dock-ship-item');
      if (isPlaced) item.classList.add('placed');
      if (isSelected) item.classList.add('selected');

      const info = document.createElement('div');
      info.style.display = 'flex';
      info.style.alignItems = 'center';
      info.style.gap = '6px';

      const icon = document.createElement('span');
      icon.textContent = template.shape === 'L' ? '⚓' : '🚢';

      const name = document.createElement('span');
      name.textContent = template.name;
      if (isSelected) name.style.color = 'var(--accent-cyan)';

      info.appendChild(icon);
      info.appendChild(name);

      const rightArea = document.createElement('div');
      rightArea.style.display = 'flex';
      rightArea.style.alignItems = 'center';
      rightArea.style.gap = '6px';

      if (isPlaced) {
        const check = document.createElement('span');
        check.classList.add('placed-tag');
        check.textContent = '✓ Yerleşti';
        rightArea.appendChild(check);
      } else {
        const dots = document.createElement('div');
        dots.classList.add('ship-dots');
        for (let i = 0; i < template.size; i++) {
          const dot = document.createElement('div');
          dot.classList.add('ship-dot');
          dots.appendChild(dot);
        }
        rightArea.appendChild(dots);
      }

      item.appendChild(info);
      item.appendChild(rightArea);

      item.addEventListener('click', () => {
        sounds.playClick();
        if (isPlaced) {
          // If already placed, clicking in dock removes it from board so user can re-place
          this.engine.playerBoard.removeShip(template.id);
          this.selectedShipTemplate = template;
          this.clearPlacementPreview();
          this.renderGrids();
          this.renderSetupDock();
          this.setBanner(`${template.name} kaldırıldı ve seçildi. Yeni konumunu haritada belirle.`);
        } else {
          this.selectedShipTemplate = template;
          this.renderSetupDock();
          this.setBanner(`${template.name} seçildi. Haritada yerleştireceğin konumu seç.`);
        }
      });

      this.dockShipList.appendChild(item);
    });
  }

  selectNextUnplacedShip() {
    const placedIds = new Set(this.engine.playerBoard.ships.map(s => s.id));
    const next = this.engine.fleetTemplates.find(t => !placedIds.has(t.id));
    this.selectedShipTemplate = next || null;
  }

  handlePlacementHover(r, c) {
    if (this.engine.phase !== GAME_PHASE.SETUP) return;
    this.lastHoveredCell = { r, c };
    this.clearPlacementPreview();
    if (!this.selectedShipTemplate) return;

    const coords = Ship.generateCoordinates(
      r,
      c,
      this.selectedShipTemplate.size,
      this.selectedShipTemplate.shape,
      this.isVertical
    );

    const isValid = this.engine.playerBoard.isValidPlacement(coords);

    for (const coord of coords) {
      if (this.engine.playerBoard.isWithinBounds(coord.r, coord.c)) {
        const el = this.playerGrid.querySelector(`.cell[data-r="${coord.r}"][data-c="${coord.c}"]`);
        if (el) {
          el.classList.add(isValid ? 'preview-valid' : 'preview-invalid');
        }
      }
    }
  }

  clearPlacementPreview() {
    this.playerGrid.querySelectorAll('.preview-valid, .preview-invalid').forEach(el => {
      el.classList.remove('preview-valid', 'preview-invalid');
    });
  }

  handlePlacementClick(r, c) {
    if (this.engine.phase !== GAME_PHASE.SETUP) return;

    const existingShip = this.engine.playerBoard.getShipAt(r, c);
    if (existingShip) {
      // Relocate: pick up ship
      this.engine.playerBoard.removeShip(existingShip.id);
      sounds.playClick();
      const template = this.engine.fleetTemplates.find(t => t.id === existingShip.id);
      if (template) {
        this.selectedShipTemplate = template;
      }
      this.clearPlacementPreview();
      this.renderGrids();
      this.renderSetupDock();
      this.handlePlacementHover(r, c);
      this.setBanner(`${existingShip.name} kaldırıldı. Yeni bir konuma yerleştirebilirsin.`);
      return;
    }

    if (!this.selectedShipTemplate) {
      this.setBanner('Lütfen önce yerleştirmek istediğin gemiyi tersaneden seç.');
      return;
    }

    const coords = Ship.generateCoordinates(
      r,
      c,
      this.selectedShipTemplate.size,
      this.selectedShipTemplate.shape,
      this.isVertical
    );

    if (!this.engine.playerBoard.isValidPlacement(coords)) {
      sounds.playMiss();
      this.setBanner('Geçersiz konum! Gemiler üst üste gelemez ve tahta dışına taşamaz.');
      return;
    }

    const ship = new Ship({
      id: this.selectedShipTemplate.id,
      name: this.selectedShipTemplate.name,
      coordinates: coords
    });

    this.engine.playerBoard.placeShip(ship);
    sounds.playShipPlace();
    this.clearPlacementPreview();
    this.renderGrids();

    this.selectNextUnplacedShip();
    this.renderSetupDock();

    const placedCount = this.engine.playerBoard.ships.length;
    const totalCount = this.engine.fleetTemplates.length;
    if (placedCount === totalCount) {
      this.setBanner('⚓ Tüm filon hazır komutanım! "Savaşa Başla" butonuna tıklayarak taarruzu başlatın.');
    } else {
      this.setBanner(`${ship.name} konuşlandırıldı (${placedCount}/${totalCount}). Sıradaki gemiyi yerleştir.`);
    }
  }

  renderGrids() {
    this.renderBoard(this.opponentGrid, this.engine.opponentBoard, false);
    this.renderBoard(this.playerGrid, this.engine.playerBoard, true);
  }

  renderBoard(container, board, isPlayerFleet) {
    container.innerHTML = '';

    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.r = r;
        cell.dataset.c = c;

        const shot = board.shots.get(`${r},${c}`);
        const scan = board.radarScans.get(`${r},${c}`);

        if (shot === CELL_STATUS.HIT) {
          cell.classList.add('hit');
          cell.title = 'İsabet (Gemi Vuruldu)';
        } else if (shot === CELL_STATUS.SUNK) {
          cell.classList.add('sunk');
          cell.title = 'Batırıldı';
        } else if (shot === CELL_STATUS.MISS) {
          cell.classList.add('miss');
          cell.title = 'Iska (Boş Su)';
        } else if (scan === CELL_STATUS.RADAR_DETECTED) {
          cell.classList.add('radar-ping');
          cell.title = '📡 Radar: Gemi Parçası Tespit Edildi!';
        } else if (scan === CELL_STATUS.RADAR_EMPTY) {
          cell.classList.add('radar-empty');
          cell.title = '📡 Radar: Temiz Alan (Gemi Yok)';
        } else if (isPlayerFleet && board.getShipAt(r, c)) {
          cell.classList.add('ship');
          cell.title = 'Filomuzun Gemisi (Kaldırmak için tıkla)';
        }

        if (isPlayerFleet) {
          if (this.engine.phase === GAME_PHASE.SETUP) {
            cell.addEventListener('mouseenter', () => this.handlePlacementHover(r, c));
            cell.addEventListener('mouseleave', () => this.clearPlacementPreview());
            cell.addEventListener('click', () => this.handlePlacementClick(r, c));
          }
        } else {
          cell.addEventListener('mouseenter', () => this.handleCellHover(r, c));
          cell.addEventListener('mouseleave', () => this.clearTargetHighlights());
          cell.addEventListener('click', () => this.handlePlayerAction(r, c));
        }

        container.appendChild(cell);
      }
    }
  }

  handleCellHover(centerR, centerC) {
    if (!this.selectedAbility) return;
    this.clearTargetHighlights();

    const targetClass = this.selectedAbility === ABILITIES.BOMB.id
      ? 'targeted-area-bomb'
      : this.selectedAbility === ABILITIES.RADAR.id
        ? 'targeted-area-radar'
        : 'targeted-area-nuke';

    const radius = this.selectedAbility === ABILITIES.NUKE.id ? 0 : 1;
    for (let dr = -radius; dr <= radius; dr++) {
      for (let dc = -radius; dc <= radius; dc++) {
        const r = centerR + dr;
        const c = centerC + dc;
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
          const el = this.opponentGrid.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
          if (el) el.classList.add(targetClass);
        }
      }
    }
  }

  clearTargetHighlights() {
    this.opponentGrid.querySelectorAll('.targeted-area, .targeted-area-bomb, .targeted-area-radar, .targeted-area-nuke').forEach(el => {
      el.classList.remove('targeted-area', 'targeted-area-bomb', 'targeted-area-radar', 'targeted-area-nuke');
    });
  }

  handlePlayerAction(r, c) {
    if (this.engine.phase !== GAME_PHASE.BATTLE) return;
    if (this.engine.currentTurn !== 'player' || this.engine.isOver) return;

    if (this.selectedAbility) {
      // Execute ability
      const abilityId = this.selectedAbility;
      const res = this.engine.useAbility(abilityId, r, c);

      if (!res.valid) {
        sounds.playMiss();
        this.setBanner(`⚠️ ${res.error}`);
        return;
      }

      this.selectedAbility = null;
      document.querySelectorAll('.ability-card').forEach(b => b.classList.remove('active'));
      this.clearTargetHighlights();

      if (abilityId === ABILITIES.BOMB.id) {
        sounds.playHit();
        const sunkInfo = res.result.sunkShips.length > 0
          ? ` (${res.result.sunkShips.map(s => s.name).join(', ')} BATIRILDI!)`
          : '';
        this.setBanner(`💣 BOMBA fırlatıldı! ${res.result.hitsCount} isabet sağlandı.${sunkInfo}`);
      } else if (abilityId === ABILITIES.RADAR.id) {
        sounds.playRadarPing();
        if (res.result.detected) {
          this.setBanner(`📡 RADAR: ${res.result.detectedCount} gemi parçası tespit edildi ve yeşil sinyalle işaretlendi!`);
        } else {
          this.setBanner('📡 RADAR: Taranan bölge temiz, hiçbir düşman gemisi parçası bulunamadı.');
        }
      } else if (abilityId === ABILITIES.NUKE.id) {
        if (res.result.hit) {
          sounds.playNuke();
          this.setBanner(`☢️ NÜKLEER İSABET! ${res.result.ship.name} tek vuruşta tamamen batırıldı!`);
        } else {
          sounds.playMiss();
          this.setBanner('☢️ Nükleer boş suya düştü.');
        }
      }

      this.afterTurn(res);
    } else {
      // Normal attack
      const res = this.engine.attack(r, c);
      if (!res.valid) {
        sounds.playMiss();
        this.setBanner(`⚠️ ${res.error}`);
        return;
      }

      if (res.hit) {
        sounds.playHit();
        if (res.sunk) {
          this.setBanner(`💥 BATTIN! Düşmanın ${res.ship.name} gemisi battı! Tekrar atış hakkı senin.`);
        } else {
          this.setBanner('💥 İSABET! Düşman gemisini vurdun, tekrar ateş et!');
        }
      } else {
        sounds.playMiss();
        this.setBanner('🌊 Karavana! Sıra düşmana geçti.');
      }

      this.afterTurn(res);
    }
  }

  afterTurn(res) {
    this.renderGrids();
    this.updateHUD();
    this.updateShipList();

    if (res.gameOver) {
      this.showGameOver(res.winner);
      return;
    }

    if (this.engine.currentTurn === 'opponent') {
      this.turnPill.textContent = 'DÜŞMAN ATIYOR...';
      this.turnPill.classList.add('opponent');
      setTimeout(() => this.runAITurn(), 800);
    } else {
      this.turnPill.textContent = 'SIRA SENDE';
      this.turnPill.classList.remove('opponent');
    }
  }

  runAITurn() {
    if (this.engine.isOver || this.engine.currentTurn !== 'opponent') return;

    // AI Decision: Check if AI has mana for an ability, or perform targeted/random shot
    const aiMana = this.engine.mana.opponent;

    // 20% chance AI uses Bomb if available
    if (aiMana >= ABILITIES.BOMB.manaCost && Math.random() < 0.25) {
      const r = Math.floor(Math.random() * BOARD_SIZE);
      const c = Math.floor(Math.random() * BOARD_SIZE);
      const res = this.engine.useAbility(ABILITIES.BOMB.id, r, c);
      if (res.valid) {
        sounds.playHit();
        this.setBanner(`⚠️ Düşman BOMBA attı (${String.fromCharCode(65 + r)}${c + 1})!`);
        this.afterAITurn(res);
        return;
      }
    }

    // Standard AI attack: hunt for unattacked cells
    const unattacked = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (!this.engine.playerBoard.shots.has(`${r},${c}`)) {
          unattacked.push({ r, c });
        }
      }
    }

    if (unattacked.length === 0) return;
    const target = unattacked[Math.floor(Math.random() * unattacked.length)];
    const res = this.engine.attack(target.r, target.c);

    if (res.hit) {
      sounds.playHit();
      if (res.sunk) {
        this.setBanner(`🚨 Düşman ${res.ship.name} gemimizi batırdı!`);
      } else {
        this.setBanner(`⚠️ Düşman gemimize isabet ettirdi (${String.fromCharCode(65 + target.r)}${target.c + 1})! Tekrar atıyor...`);
      }
    } else {
      sounds.playMiss();
      this.setBanner(`🛡️ Düşman ıska geçti (${String.fromCharCode(65 + target.r)}${target.c + 1}). Sıra sende!`);
    }

    this.afterAITurn(res);
  }

  afterAITurn(res) {
    this.renderGrids();
    this.updateHUD();
    this.updateShipList();

    if (res.gameOver) {
      this.showGameOver(res.winner);
      return;
    }

    if (this.engine.currentTurn === 'opponent') {
      // AI streak on hit
      setTimeout(() => this.runAITurn(), 800);
    } else {
      this.turnPill.textContent = 'SIRA SENDE';
      this.turnPill.classList.remove('opponent');
    }
  }

  updateHUD() {
    const currentMana = this.engine.mana.player;
    this.manaCountText.textContent = `${currentMana} / ${this.engine.maxMana} (+${this.engine.manaPerRound}/Tur)`;

    const slots = this.manaSlotsContainer.querySelectorAll('.mana-slot');
    slots.forEach((slot, index) => {
      if (index < currentMana) {
        slot.classList.add('filled');
      } else {
        slot.classList.remove('filled');
      }
    });

    // Enable/disable ability buttons
    const checkAbility = (btn, id) => {
      const ability = Object.values(ABILITIES).find(a => a.id === id);
      if (this.engine.phase !== GAME_PHASE.BATTLE || currentMana < ability.manaCost || this.engine.currentTurn !== 'player') {
        btn.classList.add('disabled');
      } else {
        btn.classList.remove('disabled');
      }
    };

    checkAbility(this.btnBomb, ABILITIES.BOMB.id);
    checkAbility(this.btnRadar, ABILITIES.RADAR.id);
    checkAbility(this.btnNuke, ABILITIES.NUKE.id);
  }

  updateShipList() {
    this.shipListContainer.innerHTML = '';
    const opponentShips = this.engine.opponentBoard.ships;
    const aliveCount = opponentShips.filter(s => !s.isSunk()).length;

    this.shipsAliveCount.textContent = `${aliveCount} / ${opponentShips.length}`;
    this.opponentHitsCounter.textContent = `Kalan: ${aliveCount} Gemi`;

    const playerAliveCount = this.engine.playerBoard.ships.filter(s => !s.isSunk()).length;
    this.playerHitsCounter.textContent = `Kalan: ${playerAliveCount} Gemi`;

    opponentShips.forEach(ship => {
      const item = document.createElement('div');
      item.classList.add('ship-item');
      if (ship.isSunk()) item.classList.add('sunk');

      const nameSpan = document.createElement('span');
      nameSpan.textContent = ship.name;

      const blocksDiv = document.createElement('div');
      blocksDiv.classList.add('ship-blocks');

      for (let i = 0; i < ship.coordinates.length; i++) {
        const block = document.createElement('div');
        block.classList.add('ship-block');
        if (i < ship.hits.size) {
          block.classList.add('damaged');
        }
        blocksDiv.appendChild(block);
      }

      item.appendChild(nameSpan);
      item.appendChild(blocksDiv);
      this.shipListContainer.appendChild(item);
    });
  }

  showGameOver(winner) {
    this.modal.style.display = 'flex';
    if (winner === 'player') {
      this.modalTitle.textContent = '🏆 BÜYÜK ZAFER!';
      this.modalTitle.style.color = 'var(--accent-cyan)';
      this.modalDesc.textContent = 'Düşman donanmasının tüm gemilerini batırarak denizlerin hakimi oldunuz!';
    } else {
      this.modalTitle.textContent = '💀 MAĞLUBİYET...';
      this.modalTitle.style.color = 'var(--accent-hit)';
      this.modalDesc.textContent = 'Filomuz batırıldı. Düşman sularında taktiksel bir yenilgi aldınız.';
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
