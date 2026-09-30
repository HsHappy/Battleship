import { GameEngine } from '../core/GameEngine.js';
import { Board } from '../core/Board.js';
import { CELL_STATUS, ABILITIES, BOARD_SIZE, GAME_PHASE, GAME_MODE, THEME_SELECTION, MAP_THEMES } from '../core/Constants.js';
import { Ship } from '../core/Ship.js';
import { sounds } from './AudioEffects.js';

class App {
  constructor() {
    this.mode = GAME_MODE.VS_BOT;
    this.boardSize = BOARD_SIZE;
    this.selectedTheme = THEME_SELECTION.RANDOM;
    const initialTheme = this.mode === GAME_MODE.VS_BOT ? THEME_SELECTION.RANDOM : this.selectedTheme;
    this.engine = new GameEngine({ mode: this.mode, boardSize: this.boardSize, themeId: initialTheme });
    this.selectedAbility = null; // 'bomb' | 'radar' | 'nuke' | null
    this.hoverCenter = null;

    // Placement State
    this.setupPlayer = 'player'; // In local PvP: 'player' (P1) then 'opponent' (P2)
    this.selectedShipTemplate = null;
    this.isVertical = false;
    this.lastHoveredCell = null;
    this.isTransitioning = false;

    // DOM Elements - Grids & Layout
    this.opponentGrid = document.getElementById('opponent-grid');
    this.playerGrid = document.getElementById('player-grid');
    this.radarBoardTitle = document.getElementById('radar-board-title');
    this.fleetBoardTitle = document.getElementById('fleet-board-title');
    this.manaCountText = document.getElementById('mana-count-text');
    this.manaSlotsContainer = document.getElementById('mana-slots');
    this.turnPill = document.getElementById('turn-pill');
    this.gameBanner = document.getElementById('game-banner');
    this.shipListContainer = document.getElementById('ship-list-container');
    this.battleShipListTitle = document.getElementById('battle-ship-list-title');
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
    this.setupPlayerTitle = document.getElementById('setup-player-title');
    this.dockShipList = document.getElementById('dock-ship-list');
    this.setupPlacedCount = document.getElementById('setup-placed-count');
    this.btnRotate = document.getElementById('btn-rotate');
    this.rotateLabel = document.getElementById('rotate-label');
    this.btnRandomFleet = document.getElementById('btn-random-fleet');
    this.btnClearFleet = document.getElementById('btn-clear-fleet');
    this.btnStartBattle = document.getElementById('btn-start-battle');
    this.battleShipList = document.getElementById('battle-ship-list');
    this.radarLockedOverlay = document.getElementById('radar-locked-overlay');

    // Quit & Confirm Modal Elements
    this.btnQuitGame = document.getElementById('btn-quit-game');
    this.confirmModal = document.getElementById('confirm-modal');
    this.confirmModalTitle = document.getElementById('confirm-modal-title');
    this.confirmModalDesc = document.getElementById('confirm-modal-desc');
    this.btnConfirmCancel = document.getElementById('btn-confirm-cancel');
    this.btnConfirmAction = document.getElementById('btn-confirm-action');
    this.onConfirmCallback = null;

    // Quick Fleet Setup Bar Elements (Mobile First)
    this.fleetSetupQuickbar = document.getElementById('fleet-setup-quickbar');
    this.quickShipIndicator = document.getElementById('quick-ship-indicator');
    this.quickPlacedIndicator = document.getElementById('quick-placed-indicator');
    this.btnQuickRotate = document.getElementById('btn-quick-rotate');
    this.quickRotateLabel = document.getElementById('quick-rotate-label');
    this.btnQuickRandom = document.getElementById('btn-quick-random');
    this.btnQuickClear = document.getElementById('btn-quick-clear');
    this.btnQuickStart = document.getElementById('btn-quick-start');

    // Mode Selector Elements
    this.btnModeSelect = document.getElementById('btn-mode-select');
    this.modeIcon = document.getElementById('mode-icon');
    this.modeText = document.getElementById('mode-text');
    this.modeModal = document.getElementById('mode-modal');
    this.btnChooseBot = document.getElementById('btn-choose-bot');
    this.btnChooseHotseat = document.getElementById('btn-choose-hotseat');
    this.btnCloseModeModal = document.getElementById('btn-close-mode-modal');
    this.btnGameOverChangeMode = document.getElementById('btn-gameover-change-mode');

    // Hotseat Privacy Curtain Elements
    this.hotseatCurtain = document.getElementById('hotseat-curtain');
    this.hotseatTitle = document.getElementById('hotseat-title');
    this.hotseatDesc = document.getElementById('hotseat-desc');
    this.btnHotseatReady = document.getElementById('btn-hotseat-ready');
    this.onHotseatReadyCallback = null;

    // Game Over Modal
    this.modal = document.getElementById('game-over-modal');
    this.modalTitle = document.getElementById('modal-title');
    this.modalDesc = document.getElementById('modal-desc');
    this.btnRestart = document.getElementById('btn-restart');

    // Abilities & Mana
    this.btnBomb = document.getElementById('btn-ability-bomb');
    this.btnRadar = document.getElementById('btn-ability-radar');
    this.btnNuke = document.getElementById('btn-ability-nuke');
    this.btnManaCharge = document.getElementById('btn-mana-charge');

    // Board Size & Labels
    this.boardSize = BOARD_SIZE;
    this.boardSizeBadge = document.getElementById('board-size-badge');
    this.setupSizePills = document.getElementById('setup-size-pills');
    this.radarColLabels = document.getElementById('radar-col-labels');
    this.radarRowLabels = document.getElementById('radar-row-labels');
    this.fleetColLabels = document.getElementById('fleet-col-labels');
    this.fleetRowLabels = document.getElementById('fleet-row-labels');
    this.btnModalSize8 = document.getElementById('btn-modal-size-8');
    this.btnModalSize10 = document.getElementById('btn-modal-size-10');
    this.btnModalSize12 = document.getElementById('btn-modal-size-12');

    // Theme & Obstacles Elements
    this.themeBadge = document.getElementById('theme-badge');
    this.themeModalNote = document.getElementById('theme-modal-note');
    this.btnThemeRandom = document.getElementById('btn-theme-random');
    this.btnThemeOcean = document.getElementById('btn-theme-ocean');
    this.btnThemeArctic = document.getElementById('btn-theme-arctic');
    this.btnThemeArchipelago = document.getElementById('btn-theme-archipelago');
    this.btnThemeReef = document.getElementById('btn-theme-reef');

    this.init();
  }

  init() {
    const effectiveTheme = this.mode === GAME_MODE.VS_BOT ? THEME_SELECTION.RANDOM : this.selectedTheme;
    this.engine = new GameEngine({
      mode: this.mode,
      boardSize: this.boardSize,
      themeId: effectiveTheme
    });
    this.engine.setupBoards({
      autoPlacePlayer: false,
      autoPlaceOpponent: (this.mode !== GAME_MODE.LOCAL_PVP)
    });
    this.setupPlayer = 'player';

    this.setupMobileTabs();
    this.setupAbilityButtons();
    this.setupSoundButton();
    this.setupFleetPlacementControls();
    this.setupModeSelector();
    this.setupSizeSelector();
    this.setupThemeSelector();
    this.setupQuitFlow();
    this.setupHotseatCurtain();

    this.applyBoardSizeStyles();
    this.applyThemeStyles();
    this.renderCoordinateLabels();
    this.updateBoardSizeUI();
    this.updateThemeUI();

    if (window.innerWidth < 900) {
      this.switchMobileTab('fleet');
    }

    this.btnRestart.addEventListener('click', () => this.restartGame());
    if (this.btnGameOverChangeMode) {
      this.btnGameOverChangeMode.addEventListener('click', () => {
        this.modal.style.display = 'none';
        this.openModeModal();
      });
    }

    if (this.btnManaCharge) {
      this.btnManaCharge.addEventListener('click', () => {
        if (this.engine.phase !== GAME_PHASE.BATTLE || this.engine.isOver) {
          sounds.playMiss();
          this.setBanner('⚠️ Mana savaşa başlandığında kullanılır. Önce donanmanı yerleştirip savaşı başlat!');
          return;
        }
        const currentActive = this.mode === GAME_MODE.LOCAL_PVP ? this.engine.currentTurn : 'player';
        this.engine.mana[currentActive] = Math.min(this.engine.maxMana, this.engine.mana[currentActive] + 2);
        this.updateHUD();
        sounds.playClick();
        const playerLabel = this.mode === GAME_MODE.LOCAL_PVP
          ? (currentActive === 'player' ? '1. Oyuncu' : '2. Oyuncu')
          : 'Oyuncu';
        this.setBanner(`⚡ ${playerLabel} için +2 Mana şarj edildi! Mevcut mana: ${this.engine.mana[currentActive]} / ${this.engine.maxMana}`);
      });
    }

    this.updateModePill();
    this.selectNextUnplacedShip();
    this.renderGrids();
    this.renderSetupDock();
    this.updateHUD();
    this.updateTurnPill();
    this.updateHeaderBannerForSetup();
  }

  setupModeSelector() {
    if (this.btnModeSelect) {
      this.btnModeSelect.addEventListener('click', () => {
        sounds.playClick();
        // If battle in progress, guard with confirmation modal!
        if (this.engine.phase === GAME_PHASE.BATTLE && !this.engine.isOver) {
          this.showConfirmModal({
            title: '⚠️ SAVAŞ DEVAM EDİYOR',
            desc: 'Oyun modunu değiştirmek mevcut savaşı sonlandıracaktır. Çıkıp mod değiştirmek istiyor musunuz?',
            cancelText: '⚔️ Savaşa Devam Et',
            actionText: '🎮 Mod Değiştir',
            onConfirm: () => {
              this.restartGame();
              this.openModeModal();
            }
          });
          return;
        }

        // If in setup phase with ships placed, confirm before switching mode
        if (this.engine.phase === GAME_PHASE.SETUP) {
          const placedCount = this.getActiveSetupBoard().ships.length;
          if (placedCount > 0) {
            this.showConfirmModal({
              title: 'MOD DEĞİŞTİRİLSİN Mİ?',
              desc: 'Mod değiştirildiğinde mevcut gemi yerleşimleri sıfırlanacaktır. Devam etmek istiyor musunuz?',
              cancelText: 'Vazgeç',
              actionText: '🎮 Mod Değiştir',
              onConfirm: () => {
                this.openModeModal();
              }
            });
            return;
          }
        }

        this.openModeModal();
      });
    }

    if (this.btnCloseModeModal) {
      this.btnCloseModeModal.addEventListener('click', () => {
        sounds.playClick();
        this.closeModeModal();
      });
    }

    if (this.btnChooseBot) {
      this.btnChooseBot.addEventListener('click', () => {
        sounds.playClick();
        this.btnChooseBot.classList.add('active');
        this.btnChooseHotseat.classList.remove('active');
        this.setMode(GAME_MODE.VS_BOT);
        this.closeModeModal();
      });
    }

    if (this.btnChooseHotseat) {
      this.btnChooseHotseat.addEventListener('click', () => {
        sounds.playClick();
        this.btnChooseHotseat.classList.add('active');
        this.btnChooseBot.classList.remove('active');
        this.setMode(GAME_MODE.LOCAL_PVP);
        this.closeModeModal();
      });
    }
  }

  setupSizeSelector() {
    if (this.setupSizePills) {
      this.setupSizePills.querySelectorAll('.btn-size-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          sounds.playClick();
          const size = Number(btn.dataset.size);
          this.setBoardSize(size);
        });
      });
    }

    const modalSizeBtns = [
      { el: this.btnModalSize8, size: 8 },
      { el: this.btnModalSize10, size: 10 },
      { el: this.btnModalSize12, size: 12 }
    ];

    modalSizeBtns.forEach(({ el, size }) => {
      if (!el) return;
      el.addEventListener('click', () => {
        sounds.playClick();
        this.setBoardSize(size);
      });
    });
  }

  setBoardSize(newSize) {
    if (this.boardSize === newSize) return;

    // If battle in progress, guard with confirmation modal!
    if (this.engine.phase === GAME_PHASE.BATTLE && !this.engine.isOver) {
      this.showConfirmModal({
        title: '⚠️ SAVAŞ DEVAM EDİYOR',
        desc: `Harita boyutunu ${newSize}×${newSize} olarak değiştirmek mevcut savaşı sonlandıracaktır. Emin misiniz?`,
        cancelText: '⚔️ Savaşa Devam Et',
        actionText: '🗺️ Boyutu Değiştir',
        onConfirm: () => {
          this.boardSize = newSize;
          this.applyBoardSizeStyles();
          this.renderCoordinateLabels();
          this.updateBoardSizeUI();
          this.restartGame();
          this.closeModeModal();
        }
      });
      return;
    }

    // If in setup phase with ships placed, confirm before switching size
    if (this.engine.phase === GAME_PHASE.SETUP) {
      const placedCount = this.getActiveSetupBoard().ships.length;
      if (placedCount > 0) {
        this.showConfirmModal({
          title: 'HARİTA BOYUTU DEĞİŞTİRİLSİN Mİ?',
          desc: `Harita ${newSize}×${newSize} olarak değiştirildiğinde mevcut gemi yerleşimleriniz sıfırlanacaktır. Devam etmek istiyor musunuz?`,
          cancelText: 'Vazgeç',
          actionText: '🗑️ Sıfırla ve Değiştir',
          onConfirm: () => {
            this.boardSize = newSize;
            this.applyBoardSizeStyles();
            this.renderCoordinateLabels();
            this.updateBoardSizeUI();
            this.restartGame();
            this.closeModeModal();
          }
        });
        return;
      }
    }

    this.boardSize = newSize;
    this.applyBoardSizeStyles();
    this.renderCoordinateLabels();
    this.updateBoardSizeUI();
    this.restartGame();
    this.closeModeModal();
  }

  applyBoardSizeStyles() {
    document.documentElement.style.setProperty('--board-size', this.boardSize);
  }

  renderCoordinateLabels() {
    const colContainers = [this.radarColLabels, this.fleetColLabels];
    const rowContainers = [this.radarRowLabels, this.fleetRowLabels];

    colContainers.forEach(container => {
      if (!container) return;
      container.innerHTML = '';
      for (let c = 1; c <= this.boardSize; c++) {
        const div = document.createElement('div');
        div.textContent = c;
        container.appendChild(div);
      }
    });

    rowContainers.forEach(container => {
      if (!container) return;
      container.innerHTML = '';
      for (let r = 0; r < this.boardSize; r++) {
        const div = document.createElement('div');
        div.textContent = String.fromCharCode(65 + r);
        container.appendChild(div);
      }
    });
  }

  updateBoardSizeUI() {
    if (this.boardSizeBadge) {
      this.boardSizeBadge.textContent = `${this.boardSize}×${this.boardSize}`;
    }

    // Update setup pills
    if (this.setupSizePills) {
      this.setupSizePills.querySelectorAll('.btn-size-pill').forEach(btn => {
        if (Number(btn.dataset.size) === this.boardSize) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    }

    // Update modal size option buttons
    const modalBtns = [
      { el: this.btnModalSize8, size: 8 },
      { el: this.btnModalSize10, size: 10 },
      { el: this.btnModalSize12, size: 12 }
    ];
    modalBtns.forEach(({ el, size }) => {
      if (!el) return;
      if (size === this.boardSize) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }

  setupThemeSelector() {
    const themeButtons = [
      { el: this.btnThemeRandom, id: THEME_SELECTION.RANDOM },
      { el: this.btnThemeOcean, id: MAP_THEMES.OCEAN.id },
      { el: this.btnThemeArctic, id: MAP_THEMES.ARCTIC.id },
      { el: this.btnThemeArchipelago, id: MAP_THEMES.ARCHIPELAGO.id },
      { el: this.btnThemeReef, id: MAP_THEMES.REEF.id }
    ];

    themeButtons.forEach(({ el, id }) => {
      if (!el) return;
      el.addEventListener('click', () => {
        if (this.mode === GAME_MODE.VS_BOT) {
          sounds.playMiss();
          this.setBanner('🤖 Bota karşı önemli maçlarda harita teması zorunlu rastgele seçilir.');
          return;
        }
        sounds.playClick();
        this.setTheme(id);
      });
    });
  }

  setTheme(themeId) {
    if (this.selectedTheme === themeId) return;

    // If battle in progress, guard with confirmation modal!
    if (this.engine.phase === GAME_PHASE.BATTLE && !this.engine.isOver) {
      this.showConfirmModal({
        title: '⚠️ SAVAŞ DEVAM EDİYOR',
        desc: 'Harita temasını değiştirmek mevcut savaşı sonlandıracaktır. Emin misiniz?',
        cancelText: '⚔️ Savaşa Devam Et',
        actionText: '🗺️ Temayı Değiştir',
        onConfirm: () => {
          this.selectedTheme = themeId;
          this.restartGame();
          this.closeModeModal();
        }
      });
      return;
    }

    // If in setup phase with ships placed, confirm before switching theme
    if (this.engine.phase === GAME_PHASE.SETUP) {
      const placedCount = this.getActiveSetupBoard().ships.length;
      if (placedCount > 0) {
        this.showConfirmModal({
          title: 'HARİTA TEMASI DEĞİŞTİRİLSİN Mİ?',
          desc: 'Tema değiştirildiğinde engel dağılımı yenilenecek ve konuşlandırılan gemileriniz sıfırlanacaktır. Devam etmek istiyor musunuz?',
          cancelText: 'Vazgeç',
          actionText: '🗑️ Sıfırla ve Değiştir',
          onConfirm: () => {
            this.selectedTheme = themeId;
            this.restartGame();
            this.closeModeModal();
          }
        });
        return;
      }
    }

    this.selectedTheme = themeId;
    this.restartGame();
    this.closeModeModal();
  }

  applyThemeStyles() {
    const themeClasses = ['theme-ocean', 'theme-arctic', 'theme-archipelago', 'theme-reef'];
    document.body.classList.remove(...themeClasses);
    if (this.engine && this.engine.theme) {
      document.body.classList.add(`theme-${this.engine.theme.id}`);
    }
  }

  updateThemeUI() {
    if (this.themeBadge && this.engine && this.engine.theme) {
      this.themeBadge.textContent = `${this.engine.theme.icon} ${this.engine.theme.name}`;
      this.themeBadge.title = `Harita Teması: ${this.engine.theme.name} (${this.engine.theme.desc})`;
    }

    const themeButtons = [
      { el: this.btnThemeRandom, id: THEME_SELECTION.RANDOM },
      { el: this.btnThemeOcean, id: MAP_THEMES.OCEAN.id },
      { el: this.btnThemeArctic, id: MAP_THEMES.ARCTIC.id },
      { el: this.btnThemeArchipelago, id: MAP_THEMES.ARCHIPELAGO.id },
      { el: this.btnThemeReef, id: MAP_THEMES.REEF.id }
    ];

    if (this.mode === GAME_MODE.VS_BOT) {
      if (this.themeModalNote) {
        this.themeModalNote.textContent = '🤖 Bota karşı önemli maçlarda harita teması zorunlu rastgeledir.';
      }
      themeButtons.forEach(({ el, id }) => {
        if (!el) return;
        if (id === THEME_SELECTION.RANDOM) {
          el.classList.add('active');
          el.disabled = false;
        } else {
          el.classList.remove('active');
          el.disabled = true;
        }
      });
    } else {
      if (this.themeModalNote) {
        this.themeModalNote.textContent = 'Özel maçlarda temayı özgürce seçebilirsiniz:';
      }
      themeButtons.forEach(({ el, id }) => {
        if (!el) return;
        el.disabled = false;
        if (id === this.selectedTheme) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      });
    }
  }

  setupQuitFlow() {
    if (this.btnQuitGame) {
      this.btnQuitGame.addEventListener('click', () => {
        sounds.playClick();
        if (this.engine.phase === GAME_PHASE.BATTLE && !this.engine.isOver) {
          this.showConfirmModal({
            title: '🏳️ SAVAŞTAN ÇIKILSIN MI?',
            desc: 'Mevcut savaş sonlandırılacak ve oyun sıfırlanacaktır. Çıkmak istediğinize emin misiniz?',
            cancelText: '⚔️ Savaşa Devam Et',
            actionText: '🏳️ Evet, Oyundan Çık',
            onConfirm: () => {
              this.restartGame();
              this.setBanner('Savaştan çıkıldı. Yeni oyuna hazır.');
            }
          });
        } else if (this.engine.phase === GAME_PHASE.SETUP) {
          const placedCount = this.getActiveSetupBoard().ships.length;
          if (placedCount > 0) {
            this.showConfirmModal({
              title: 'TERSANE SIFIRLANSIN MI?',
              desc: 'Tersanedeki gemi konuşlandırmanız sıfırlanacaktır. Devam etmek istiyor musunuz?',
              cancelText: 'Vazgeç',
              actionText: '🗑️ Sıfırla',
              onConfirm: () => {
                this.clearPlayerFleet();
              }
            });
          } else {
            this.openModeModal();
          }
        } else {
          this.restartGame();
        }
      });
    }

    if (this.btnConfirmCancel) {
      this.btnConfirmCancel.addEventListener('click', () => {
        sounds.playClick();
        this.closeConfirmModal();
      });
    }

    if (this.btnConfirmAction) {
      this.btnConfirmAction.addEventListener('click', () => {
        sounds.playClick();
        const cb = this.onConfirmCallback;
        this.closeConfirmModal();
        if (typeof cb === 'function') {
          cb();
        }
      });
    }
  }

  showConfirmModal({ title, desc, cancelText = 'Vazgeç', actionText = 'Onayla', onConfirm }) {
    if (!this.confirmModal) return;
    if (this.confirmModalTitle) this.confirmModalTitle.textContent = title;
    if (this.confirmModalDesc) this.confirmModalDesc.textContent = desc;
    if (this.btnConfirmCancel) this.btnConfirmCancel.textContent = cancelText;
    if (this.btnConfirmAction) this.btnConfirmAction.textContent = actionText;
    this.onConfirmCallback = onConfirm;
    this.confirmModal.style.display = 'flex';
  }

  closeConfirmModal() {
    if (this.confirmModal) {
      this.confirmModal.style.display = 'none';
      this.onConfirmCallback = null;
    }
  }

  openModeModal() {
    sounds.playClick();
    if (this.mode === GAME_MODE.VS_BOT) {
      this.btnChooseBot.classList.add('active');
      this.btnChooseHotseat.classList.remove('active');
    } else {
      this.btnChooseHotseat.classList.add('active');
      this.btnChooseBot.classList.remove('active');
    }
    this.updateBoardSizeUI();
    this.updateThemeUI();
    this.modeModal.style.display = 'flex';
  }

  closeModeModal() {
    if (this.modeModal) {
      this.modeModal.style.display = 'none';
    }
  }

  setMode(newMode) {
    if (this.mode === newMode) return;
    this.mode = newMode;
    this.updateModePill();
    this.restartGame();
  }

  updateModePill() {
    if (this.mode === GAME_MODE.LOCAL_PVP) {
      if (this.modeIcon) this.modeIcon.textContent = '👥';
      if (this.modeText) this.modeText.textContent = '2 Oyuncu (Sırayla)';
    } else {
      if (this.modeIcon) this.modeIcon.textContent = '🤖';
      if (this.modeText) this.modeText.textContent = 'Bota Karşı';
    }
    if (this.boardSizeBadge) {
      this.boardSizeBadge.textContent = `${this.boardSize}×${this.boardSize}`;
    }
  }

  setupHotseatCurtain() {
    if (this.btnHotseatReady) {
      this.btnHotseatReady.addEventListener('click', () => {
        sounds.playClick();
        if (this.hotseatCurtain) this.hotseatCurtain.style.display = 'none';
        if (typeof this.onHotseatReadyCallback === 'function') {
          const cb = this.onHotseatReadyCallback;
          this.onHotseatReadyCallback = null;
          cb();
        }
      });
    }
  }

  showHotseatCurtain({ title, desc, btnText = '👁️ Sırayı Al & Devam Et', onReady }) {
    if (!this.hotseatCurtain) {
      if (onReady) onReady();
      return;
    }
    if (this.hotseatTitle) this.hotseatTitle.textContent = title;
    if (this.hotseatDesc) this.hotseatDesc.textContent = desc;
    if (this.btnHotseatReady) this.btnHotseatReady.textContent = btnText;
    this.onHotseatReadyCallback = () => {
      if (onReady) onReady();
      // On mobile, automatically show the relevant tab
      if (window.innerWidth < 900) {
        if (this.engine.phase === GAME_PHASE.SETUP) {
          this.switchMobileTab('fleet');
        } else {
          this.switchMobileTab('radar');
        }
      }
    };
    this.hotseatCurtain.style.display = 'flex';
  }

  restartGame() {
    const effectiveTheme = this.mode === GAME_MODE.VS_BOT ? THEME_SELECTION.RANDOM : this.selectedTheme;
    this.engine = new GameEngine({
      mode: this.mode,
      boardSize: this.boardSize,
      themeId: effectiveTheme
    });
    this.engine.setupBoards({
      autoPlacePlayer: false,
      autoPlaceOpponent: (this.mode !== GAME_MODE.LOCAL_PVP)
    });
    this.setupPlayer = 'player';
    this.selectedAbility = null;
    this.selectedShipTemplate = null;
    this.isVertical = false;
    this.isTransitioning = false;
    if (this.rotateLabel) this.rotateLabel.textContent = 'Yatay';
    if (this.quickRotateLabel) this.quickRotateLabel.textContent = 'Yatay';

    [this.btnBomb, this.btnRadar, this.btnNuke].forEach(b => b?.classList.remove('active'));
    this.clearTargetHighlights();

    if (this.setupControls) this.setupControls.style.display = 'flex';
    if (this.fleetSetupQuickbar) this.fleetSetupQuickbar.style.display = 'flex';
    if (this.battleShipList) this.battleShipList.style.display = 'none';
    if (this.radarLockedOverlay) this.radarLockedOverlay.classList.remove('hidden');
    if (this.hotseatCurtain) this.hotseatCurtain.style.display = 'none';
    if (this.confirmModal) this.confirmModal.style.display = 'none';

    this.modal.style.display = 'none';
    this.updateModePill();
    this.updateBoardSizeUI();
    this.applyThemeStyles();
    this.updateThemeUI();
    this.selectNextUnplacedShip();
    this.renderGrids();
    this.renderSetupDock();
    this.updateHUD();
    this.updateTurnPill();
    this.updateHeaderBannerForSetup();

    if (window.innerWidth < 900) {
      this.switchMobileTab('fleet');
    }
  }

  updateHeaderBannerForSetup() {
    if (this.mode === GAME_MODE.LOCAL_PVP) {
      if (this.setupPlayer === 'player') {
        this.setBanner('1. Oyuncu: Donanmanı konuşlandır! Gemi seç, çevirmek için "R" tuşuna bas.');
      } else {
        this.setBanner('2. Oyuncu: Donanmanı konuşlandır! Gemi seç, çevirmek için "R" tuşuna bas.');
      }
    } else {
      this.setBanner('Donanmanı konuşlandır! Gemi seç, çevirmek için "R" tuşuna bas.');
    }
  }

  getActiveSetupBoard() {
    if (this.mode === GAME_MODE.LOCAL_PVP && this.setupPlayer === 'opponent') {
      return this.engine.opponentBoard;
    }
    return this.engine.playerBoard;
  }

  getActiveAttackingBoard(role = this.engine.currentTurn) {
    if (this.mode === GAME_MODE.LOCAL_PVP) {
      return role === 'player' ? this.engine.opponentBoard : this.engine.playerBoard;
    }
    return this.engine.opponentBoard;
  }

  getActiveDefendingBoard(role = this.engine.currentTurn) {
    if (this.mode === GAME_MODE.LOCAL_PVP) {
      return role === 'player' ? this.engine.playerBoard : this.engine.opponentBoard;
    }
    return this.engine.playerBoard;
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

  switchMobileTab(tabName) {
    if (!this.mobileTabs) return;
    const targetBtn = this.mobileTabs.querySelector(`[data-tab="${tabName}"]`);
    if (targetBtn) {
      const buttons = this.mobileTabs.querySelectorAll('.tab-btn');
      buttons.forEach(b => b.classList.remove('active'));
      targetBtn.classList.add('active');
      if (window.innerWidth < 900) {
        this.panelRadar.style.display = tabName === 'radar' ? 'flex' : 'none';
        this.panelFleet.style.display = tabName === 'fleet' ? 'flex' : 'none';
        this.panelShips.style.display = tabName === 'ships' ? 'block' : 'none';
      }
    }
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
          this.setBanner('⚠️ Yetenekler savaş başladığında kullanılır. Önce donanmanı yerleştirip savaşı başlat!');
          return;
        }

        // If game is over, ignore
        if (this.engine.isOver) return;

        // In bot mode, if opponent's turn, inform the user
        if (this.mode === GAME_MODE.VS_BOT && this.engine.currentTurn !== 'player') {
          sounds.playMiss();
          el.classList.add('shake');
          setTimeout(() => el.classList.remove('shake'), 400);
          this.setBanner('⏳ Sıra düşmanda! Düşmanın atışını yapmasını bekleyin.');
          return;
        }

        const currentActive = this.engine.currentTurn;
        // Check if active player has enough mana
        if (this.engine.mana[currentActive] < ability.manaCost) {
          sounds.playMiss();
          el.classList.add('shake');
          setTimeout(() => el.classList.remove('shake'), 400);
          this.setBanner(`💧 Yetersiz Mana! ${ability.name} için ${ability.manaCost} mana gerekli. (Mevcut: ${this.engine.mana[currentActive]} Mana)`);
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
            this.setBanner('💣 BOMBA seçildi! Hedef haritasında 3x3 patlama alanının merkezini seç.');
          } else if (id === ABILITIES.RADAR.id) {
            this.setBanner('📡 RADAR seçildi! Hedef haritasında 3x3 tarama alanının merkezini seç.');
          } else if (id === ABILITIES.NUKE.id) {
            this.setBanner('☢️ NÜKLEER seçildi! Hedef haritasında koordinat seç (Gemiye denk gelirse tek atışta batırır).');
          }
        }
        this.clearTargetHighlights();
      });
    });

    // Keyboard shortcuts: 1 (Bomb), 2 (Radar), 3 (Nuke), Escape (Cancel)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.confirmModal && this.confirmModal.style.display !== 'none') {
          this.closeConfirmModal();
          return;
        }
        if (this.modeModal && this.modeModal.style.display !== 'none') {
          this.closeModeModal();
          return;
        }
      }

      if (this.engine.phase !== GAME_PHASE.BATTLE || this.engine.isOver) return;
      if (this.mode === GAME_MODE.VS_BOT && this.engine.currentTurn !== 'player') return;

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
    this.btnRotate?.addEventListener('click', () => this.toggleOrientation());
    this.btnRandomFleet?.addEventListener('click', () => this.randomizePlayerFleet());
    this.btnClearFleet?.addEventListener('click', () => this.clearPlayerFleet());
    this.btnStartBattle?.addEventListener('click', () => this.handleSetupContinue());

    if (this.btnQuickRotate) {
      this.btnQuickRotate.addEventListener('click', () => this.toggleOrientation());
    }
    if (this.btnQuickRandom) {
      this.btnQuickRandom.addEventListener('click', () => this.randomizePlayerFleet());
    }
    if (this.btnQuickClear) {
      this.btnQuickClear.addEventListener('click', () => this.clearPlayerFleet());
    }
    if (this.btnQuickStart) {
      this.btnQuickStart.addEventListener('click', () => this.handleSetupContinue());
    }

    // Keyboard shortcut: 'R' key to rotate
    window.addEventListener('keydown', (e) => {
      if (this.engine.phase === GAME_PHASE.SETUP && (e.key === 'r' || e.key === 'R')) {
        this.toggleOrientation();
      }
    });
  }

  toggleOrientation() {
    this.isVertical = !this.isVertical;
    const label = this.isVertical ? 'Dikey' : 'Yatay';
    if (this.rotateLabel) this.rotateLabel.textContent = label;
    if (this.quickRotateLabel) this.quickRotateLabel.textContent = label;
    sounds.playRotate();
    if (this.lastHoveredCell) {
      this.handlePlacementHover(this.lastHoveredCell.r, this.lastHoveredCell.c);
    }
  }

  randomizePlayerFleet() {
    const board = this.getActiveSetupBoard();
    board.randomizeFleet(this.engine.fleetTemplates);
    sounds.playShipPlace();
    this.selectedShipTemplate = null;
    this.clearPlacementPreview();
    this.renderGrids();
    this.renderSetupDock();

    const playerLabel = this.mode === GAME_MODE.LOCAL_PVP
      ? (this.setupPlayer === 'player' ? '1. Oyuncu' : '2. Oyuncu')
      : 'Filo';
    this.setBanner(`${playerLabel} rastgele konuşlandırıldı. Hazırsan devam et!`);
  }

  clearPlayerFleet() {
    const board = this.getActiveSetupBoard();
    board.clearShips();
    sounds.playClick();
    this.clearPlacementPreview();
    this.selectNextUnplacedShip();
    this.renderGrids();
    this.renderSetupDock();
    this.setBanner('Tahta temizlendi. Gemilerini yeniden konuşlandır.');
  }

  handleSetupContinue() {
    if (this.mode === GAME_MODE.LOCAL_PVP) {
      if (this.setupPlayer === 'player') {
        if (this.engine.playerBoard.ships.length !== this.engine.fleetTemplates.length) {
          this.setBanner(`1. Oyuncu tüm gemileri yerleştirmelidir (${this.engine.playerBoard.ships.length}/${this.engine.fleetTemplates.length})`);
          return;
        }

        // Show Hotseat privacy curtain to pass device to Player 2
        this.showHotseatCurtain({
          title: '🔒 CİHAZI 2. OYUNCUYA DEVREDİN',
          desc: '1. Oyuncunun donanması başarıyla hazırlandı. Sıra 2. Oyuncuda! Ekrandaki gemi konumlarını görmemek için cihazı devredin.',
          btnText: '👁️ 2. Oyuncu Tersanesini Aç',
          onReady: () => {
            this.setupPlayer = 'opponent';
            this.selectedShipTemplate = null;
            this.selectNextUnplacedShip();
            this.renderGrids();
            this.renderSetupDock();
            this.updateTurnPill();
            this.updateHeaderBannerForSetup();
          }
        });
      } else {
        // Player 2 finished placement -> Start Battle
        if (this.engine.opponentBoard.ships.length !== this.engine.fleetTemplates.length) {
          this.setBanner(`2. Oyuncu tüm gemileri yerleştirmelidir (${this.engine.opponentBoard.ships.length}/${this.engine.fleetTemplates.length})`);
          return;
        }

        const res = this.engine.startBattle();
        if (!res.valid) {
          this.setBanner(res.error);
          return;
        }

        // Show Hotseat curtain to pass device back to Player 1 for Round 1
        this.showHotseatCurtain({
          title: '⚔️ SAVAŞ BAŞLIYOR!',
          desc: 'Her iki tarafın da donanması konuşlandırıldı. Cihazı ilk atışı yapacak olan 1. Oyuncuya verin.',
          btnText: '🎮 1. Oyuncu Olarak Başla',
          onReady: () => {
            this.enterBattlePhase();
          }
        });
      }
    } else {
      // Vs Bot mode
      const res = this.engine.startBattle();
      if (!res.valid) {
        this.setBanner(res.error);
        return;
      }
      this.enterBattlePhase();
    }
  }

  enterBattlePhase() {
    sounds.playBattleStart();
    if (this.setupControls) this.setupControls.style.display = 'none';
    if (this.fleetSetupQuickbar) this.fleetSetupQuickbar.style.display = 'none';
    if (this.battleShipList) this.battleShipList.style.display = 'block';
    if (this.radarLockedOverlay) this.radarLockedOverlay.classList.add('hidden');

    this.renderGrids();
    this.updateHUD();
    this.updateShipList();
    this.updateTurnPill();

    const bannerMsg = this.mode === GAME_MODE.LOCAL_PVP
      ? '⚔️ Savaş Başladı! 1. Oyuncu: Hedef koordinatı seçerek ateş et.'
      : '⚔️ Savaş Başladı! Düşman sularına bir koordinat seçerek ateş et.';
    this.setBanner(bannerMsg);

    if (window.innerWidth < 900) {
      this.switchMobileTab('radar');
    }
  }

  updateTurnPill(perspectiveRole = null) {
    if (this.engine.phase === GAME_PHASE.SETUP) {
      this.turnPill.className = 'turn-pill';
      if (this.mode === GAME_MODE.LOCAL_PVP) {
        this.turnPill.textContent = this.setupPlayer === 'player'
          ? '🛠️ 1. OYUNCU TERSANESİ'
          : '🛠️ 2. OYUNCU TERSANESİ';
        this.turnPill.classList.add(this.setupPlayer === 'player' ? 'player-1' : 'player-2');
      } else {
        this.turnPill.textContent = '🛠️ KONUŞLANDIRMA';
      }
      return;
    }

    const currentRole = perspectiveRole || this.engine.currentTurn;
    if (this.mode === GAME_MODE.LOCAL_PVP) {
      this.turnPill.className = 'turn-pill';
      if (currentRole === 'player') {
        this.turnPill.textContent = '🎯 SIRA: 1. OYUNCU';
        this.turnPill.classList.add('player-1');
      } else {
        this.turnPill.textContent = '🎯 SIRA: 2. OYUNCU';
        this.turnPill.classList.add('player-2');
      }
    } else {
      this.turnPill.className = 'turn-pill';
      if (this.engine.currentTurn === 'opponent') {
        this.turnPill.textContent = 'DÜŞMAN ATIYOR...';
        this.turnPill.classList.add('opponent');
      } else {
        this.turnPill.textContent = 'SIRA SENDE';
      }
    }
  }

  renderSetupDock() {
    if (!this.dockShipList) return;
    this.dockShipList.innerHTML = '';

    const board = this.getActiveSetupBoard();
    const placedShips = board.ships;
    const placedCount = placedShips.length;
    const totalCount = this.engine.fleetTemplates.length;

    if (this.setupPlayerTitle) {
      if (this.mode === GAME_MODE.LOCAL_PVP) {
        this.setupPlayerTitle.textContent = this.setupPlayer === 'player'
          ? '⚓ 1. OYUNCU TERSANESİ'
          : '⚓ 2. OYUNCU TERSANESİ';
      } else {
        this.setupPlayerTitle.textContent = '⚓ TERSANE';
      }
    }

    if (this.setupPlacedCount) {
      this.setupPlacedCount.textContent = `${placedCount} / ${totalCount}`;
    }

    if (this.quickPlacedIndicator) {
      this.quickPlacedIndicator.textContent = `${placedCount} / ${totalCount}`;
    }

    if (this.quickShipIndicator) {
      if (placedCount === totalCount) {
        this.quickShipIndicator.textContent = '✅ Donanma Hazır!';
      } else if (this.selectedShipTemplate) {
        this.quickShipIndicator.textContent = `🚢 Seçili: ${this.selectedShipTemplate.name} (${this.selectedShipTemplate.size})`;
      } else {
        this.quickShipIndicator.textContent = '⚓ Gemi Seçin';
      }
    }

    if (this.btnStartBattle) {
      const isComplete = placedCount === totalCount;
      this.btnStartBattle.disabled = !isComplete;
      if (isComplete) {
        this.btnStartBattle.classList.add('ready');
      } else {
        this.btnStartBattle.classList.remove('ready');
      }

      if (this.mode === GAME_MODE.LOCAL_PVP) {
        this.btnStartBattle.textContent = this.setupPlayer === 'player'
          ? '➡️ 2. OYUNCUYA GEÇ'
          : '⚔️ SAVAŞA BAŞLA';
      } else {
        this.btnStartBattle.textContent = '⚔️ SAVAŞA BAŞLA';
      }
    }

    if (this.btnQuickStart) {
      const isComplete = placedCount === totalCount;
      this.btnQuickStart.disabled = !isComplete;
      if (isComplete) {
        this.btnQuickStart.classList.add('ready');
      } else {
        this.btnQuickStart.classList.remove('ready');
      }

      if (this.mode === GAME_MODE.LOCAL_PVP) {
        this.btnQuickStart.textContent = this.setupPlayer === 'player'
          ? '➡️ 2. Oyuncuya'
          : '⚔️ Savaş';
      } else {
        this.btnQuickStart.textContent = '⚔️ Savaş';
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
          board.removeShip(template.id);
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
    const board = this.getActiveSetupBoard();
    const placedIds = new Set(board.ships.map(s => s.id));
    const next = this.engine.fleetTemplates.find(t => !placedIds.has(t.id));
    this.selectedShipTemplate = next || null;
  }

  handlePlacementHover(r, c) {
    if (this.engine.phase !== GAME_PHASE.SETUP) return;
    this.lastHoveredCell = { r, c };
    this.clearPlacementPreview();
    if (!this.selectedShipTemplate) return;

    const board = this.getActiveSetupBoard();
    const coords = Ship.generateCoordinates(
      r,
      c,
      this.selectedShipTemplate.size,
      this.selectedShipTemplate.shape,
      this.isVertical
    );

    const isValid = board.isValidPlacement(coords);

    for (const coord of coords) {
      if (board.isWithinBounds(coord.r, coord.c)) {
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

    const board = this.getActiveSetupBoard();
    const existingShip = board.getShipAt(r, c);
    if (existingShip) {
      board.removeShip(existingShip.id);
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

    if (!board.isValidPlacement(coords)) {
      sounds.playMiss();
      this.setBanner('Geçersiz konum! Gemiler üst üste gelemez ve tahta dışına taşamaz.');
      return;
    }

    const ship = new Ship({
      id: this.selectedShipTemplate.id,
      name: this.selectedShipTemplate.name,
      coordinates: coords
    });

    board.placeShip(ship);
    sounds.playShipPlace();
    this.clearPlacementPreview();
    this.renderGrids();

    this.selectNextUnplacedShip();
    this.renderSetupDock();

    const placedCount = board.ships.length;
    const totalCount = this.engine.fleetTemplates.length;
    if (placedCount === totalCount) {
      if (this.mode === GAME_MODE.LOCAL_PVP && this.setupPlayer === 'player') {
        this.setBanner('⚓ 1. Oyuncu filosu hazır! "2. Oyuncuya Geç" butonuna tıklayın.');
      } else if (this.mode === GAME_MODE.LOCAL_PVP && this.setupPlayer === 'opponent') {
        this.setBanner('⚓ 2. Oyuncu filosu hazır! "Savaşa Başla" butonuna tıklayarak savaşı başlatın.');
      } else {
        this.setBanner('⚓ Tüm filon hazır komutanım! "Savaşa Başla" butonuna tıklayarak taarruzu başlatın.');
      }
    } else {
      this.setBanner(`${ship.name} konuşlandırıldı (${placedCount}/${totalCount}). Sıradaki gemiyi yerleştir.`);
    }
  }

  renderGrids(perspectiveRole = null) {
    if (this.engine.phase === GAME_PHASE.SETUP) {
      // In setup, right board shows the currently active setup fleet
      const setupBoard = this.getActiveSetupBoard();
      this.renderBoard(this.playerGrid, setupBoard, true);
      // Left board displays map terrain obstacles without revealing unattacked ships
      this.renderBoard(this.opponentGrid, this.engine.opponentBoard, false);

      if (this.fleetBoardTitle) {
        if (this.mode === GAME_MODE.LOCAL_PVP) {
          this.fleetBoardTitle.textContent = this.setupPlayer === 'player'
            ? '🛡️ 1. Oyuncu Donanması'
            : '🛡️ 2. Oyuncu Donanması';
        } else {
          this.fleetBoardTitle.textContent = '🛡️ Filomuz (Savunma)';
        }
      }
      return;
    }

    // In Battle phase:
    const currentRole = perspectiveRole || this.engine.currentTurn;
    // Left Grid: Current target board (attacks made against opponent)
    const attackBoard = this.getActiveAttackingBoard(currentRole);
    this.renderBoard(this.opponentGrid, attackBoard, false);

    // Right Grid: Current player's own fleet (defense)
    const defenseBoard = this.getActiveDefendingBoard(currentRole);
    this.renderBoard(this.playerGrid, defenseBoard, true);

    // Update board titles according to perspective
    if (this.radarBoardTitle && this.fleetBoardTitle) {
      if (this.mode === GAME_MODE.LOCAL_PVP) {
        if (currentRole === 'player') {
          this.radarBoardTitle.textContent = '🎯 2. Oyuncu Suları (Hedef)';
          this.fleetBoardTitle.textContent = '🛡️ 1. Oyuncu Donanması';
        } else {
          this.radarBoardTitle.textContent = '🎯 1. Oyuncu Suları (Hedef)';
          this.fleetBoardTitle.textContent = '🛡️ 2. Oyuncu Donanması';
        }
      } else {
        this.radarBoardTitle.textContent = '🎯 Düşman Suları (Radar)';
        this.fleetBoardTitle.textContent = '🛡️ Filomuz (Savunma)';
      }
    }
  }

  renderBoard(container, board, isDefenseFleet) {
    container.innerHTML = '';

    for (let r = 0; r < board.size; r++) {
      for (let c = 0; c < board.size; c++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.r = r;
        cell.dataset.c = c;

        const shot = board.shots.get(`${r},${c}`);
        const scan = board.radarScans.get(`${r},${c}`);

        if (board.isObstacle(r, c)) {
          cell.classList.add('obstacle');
          const obstacleName = this.engine?.theme?.obstacleName || 'Doğal Engel';
          cell.title = `🗺️ ${obstacleName} (${this.engine?.theme?.name || 'Doğal'}) - Geçit Vermez`;
          cell.addEventListener('click', (e) => {
            e.stopPropagation();
            sounds.playMiss();
            this.setBanner(`⚠️ ${obstacleName} doğal bir engeldir. Atış yapılamaz!`);
          });
          container.appendChild(cell);
          continue;
        }

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
        } else if (isDefenseFleet && board.getShipAt(r, c)) {
          cell.classList.add('ship');
          cell.title = this.engine.phase === GAME_PHASE.SETUP
            ? 'Filomuzun Gemisi (Kaldırmak için tıkla)'
            : 'Filomuzun Gemisi';
        }

        if (isDefenseFleet) {
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
        if (r >= 0 && r < this.boardSize && c >= 0 && c < this.boardSize) {
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
    if (this.engine.phase !== GAME_PHASE.BATTLE || this.engine.isOver) return;
    if (this.isTransitioning) return;

    if (this.mode === GAME_MODE.VS_BOT && this.engine.currentTurn !== 'player') {
      return;
    }

    const currentTurn = this.engine.currentTurn;
    const actorRole = currentTurn;
    const actorLabel = this.mode === GAME_MODE.LOCAL_PVP
      ? (currentTurn === 'player' ? '1. Oyuncu' : '2. Oyuncu')
      : 'Oyuncu';

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
          this.setBanner('📡 RADAR: Taranan bölge temiz, hiçbir gemi parçası bulunamadı.');
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

      this.afterTurn(res, actorLabel, actorRole);
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
          this.setBanner(`💥 BATTIN! ${res.ship.name} battı! ${actorLabel} tekrar atış hakkı kazandı.`);
        } else {
          this.setBanner(`💥 İSABET! Gemi vuruldu, ${actorLabel} tekrar ateş et!`);
        }
      } else {
        sounds.playMiss();
        this.setBanner(`🌊 Karavana! Sıra diğer tarafa geçti.`);
      }

      this.afterTurn(res, actorLabel, actorRole);
    }
  }

  afterTurn(res, actorLabel, actorRole = this.engine.currentTurn) {
    if (res.gameOver) {
      this.renderGrids(actorRole);
      this.updateHUD(actorRole);
      this.updateShipList(actorRole);
      this.updateTurnPill(actorRole);
      this.showGameOver(res.winner);
      return;
    }

    if (this.mode === GAME_MODE.LOCAL_PVP) {
      if (res.keepsTurn) {
        // Player hit! Keeps turn (Streak)
        this.renderGrids(actorRole);
        this.updateHUD(actorRole);
        this.updateShipList(actorRole);
        this.updateTurnPill(actorRole);
        return;
      }

      // Miss or ability finished turn -> Turn has passed to the other player!
      // CRITICAL PRIVACY FIX:
      // While the current actor is still looking at the screen, render ONLY from the actor's perspective!
      // This displays the shot splash (miss) or ability effect on the target radar,
      // and keeps the actor's own fleet on the right.
      // OPPONENT'S SHIPS ARE NEVER RENDERED BEFORE THE CURTAIN!
      this.renderGrids(actorRole);
      this.updateHUD(actorRole);
      this.updateShipList(actorRole);
      this.updateTurnPill(actorRole);

      // Lock further clicks during transition
      this.isTransitioning = true;

      const nextPlayerName = this.engine.currentTurn === 'player' ? '1. Oyuncu' : '2. Oyuncu';
      const delay = res.ability ? 1100 : 700;

      setTimeout(() => {
        this.showHotseatCurtain({
          title: `🔒 CİHAZI ${nextPlayerName.toUpperCase()}'YA VERİN`,
          desc: `${actorLabel} hamlesini tamamladı. Rakibin gemi konumlarını ve taktiklerini gizlemek için ekran karartıldı. Cihazı devredin.`,
          btnText: `👁️ ${nextPlayerName} Sırayı Al`,
          onReady: () => {
            this.isTransitioning = false;
            this.clearTargetHighlights();
            // ONLY NOW, when the new player is holding the device, render their perspective!
            this.renderGrids(this.engine.currentTurn);
            this.updateHUD(this.engine.currentTurn);
            this.updateShipList(this.engine.currentTurn);
            this.updateTurnPill(this.engine.currentTurn);
            this.setBanner(`🎯 Sıra sende ${nextPlayerName}! Koordinat seç veya yetenek kullan.`);
          }
        });
      }, delay);

    } else {
      // Vs Bot Mode
      this.renderGrids();
      this.updateHUD();
      this.updateShipList();
      this.updateTurnPill();

      if (this.engine.currentTurn === 'opponent') {
        this.turnPill.textContent = 'DÜŞMAN ATIYOR...';
        this.turnPill.classList.add('opponent');
        setTimeout(() => this.runAITurn(), 800);
      } else {
        this.turnPill.textContent = 'SIRA SENDE';
        this.turnPill.classList.remove('opponent');
      }
    }
  }

  runAITurn() {
    if (this.engine.isOver || this.engine.currentTurn !== 'opponent') return;

    const aiMana = this.engine.mana.opponent;

    // 25% chance AI uses Bomb if available
    if (aiMana >= ABILITIES.BOMB.manaCost && Math.random() < 0.25) {
      let r = 0, c = 0, attempts = 0;
      do {
        r = Math.floor(Math.random() * this.boardSize);
        c = Math.floor(Math.random() * this.boardSize);
        attempts++;
      } while (this.engine.playerBoard.isObstacle(r, c) && attempts < 20);

      const res = this.engine.useAbility(ABILITIES.BOMB.id, r, c);
      if (res.valid) {
        sounds.playHit();
        this.setBanner(`⚠️ Düşman BOMBA attı (${String.fromCharCode(65 + r)}${c + 1})!`);
        this.afterAITurn(res);
        return;
      }
    }

    // Standard AI attack: hunt for unattacked cells that are not obstacles
    const unattacked = [];
    for (let r = 0; r < this.boardSize; r++) {
      for (let c = 0; c < this.boardSize; c++) {
        if (!this.engine.playerBoard.isObstacle(r, c) && !this.engine.playerBoard.shots.has(`${r},${c}`)) {
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
    this.updateTurnPill();

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

  updateHUD(perspectiveRole = null) {
    const currentActiveRole = perspectiveRole || (
      this.mode === GAME_MODE.LOCAL_PVP
        ? (this.engine.phase === GAME_PHASE.SETUP ? this.setupPlayer : this.engine.currentTurn)
        : 'player'
    );

    const currentMana = this.engine.mana[currentActiveRole] ?? this.engine.mana.player;
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
      if (!btn) return;
      const ability = Object.values(ABILITIES).find(a => a.id === id);
      const isBattle = this.engine.phase === GAME_PHASE.BATTLE;
      const hasEnoughMana = currentMana >= ability.manaCost;
      const canMove = this.mode === GAME_MODE.LOCAL_PVP || this.engine.currentTurn === 'player';

      if (!isBattle || !hasEnoughMana || !canMove || this.engine.isOver) {
        btn.classList.add('disabled');
      } else {
        btn.classList.remove('disabled');
      }
    };

    checkAbility(this.btnBomb, ABILITIES.BOMB.id);
    checkAbility(this.btnRadar, ABILITIES.RADAR.id);
    checkAbility(this.btnNuke, ABILITIES.NUKE.id);
  }

  updateShipList(perspectiveRole = null) {
    this.shipListContainer.innerHTML = '';
    const currentRole = perspectiveRole || (
      this.mode === GAME_MODE.LOCAL_PVP ? this.engine.currentTurn : 'player'
    );
    const targetBoard = this.getActiveAttackingBoard(currentRole);
    const defenseBoard = this.getActiveDefendingBoard(currentRole);

    const targetShips = targetBoard.ships;
    const aliveCount = targetShips.filter(s => !s.isSunk()).length;

    this.shipsAliveCount.textContent = `${aliveCount} / ${targetShips.length}`;
    this.opponentHitsCounter.textContent = `Kalan: ${aliveCount} Gemi`;

    const defenseAliveCount = defenseBoard.ships.filter(s => !s.isSunk()).length;
    this.playerHitsCounter.textContent = `Kalan: ${defenseAliveCount} Gemi`;

    if (this.battleShipListTitle) {
      if (this.mode === GAME_MODE.LOCAL_PVP) {
        this.battleShipListTitle.textContent = currentRole === 'player'
          ? '2. Oyuncu Filosu'
          : '1. Oyuncu Filosu';
      } else {
        this.battleShipListTitle.textContent = 'Düşman Filosu';
      }
    }

    targetShips.forEach(ship => {
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
    if (this.mode === GAME_MODE.LOCAL_PVP) {
      const winnerName = winner === 'player' ? '1. OYUNCU' : '2. OYUNCU';
      this.modalTitle.textContent = `🏆 ${winnerName} KAZANDI!`;
      this.modalTitle.style.color = winner === 'player' ? 'var(--accent-cyan)' : '#ff9900';
      this.modalDesc.textContent = `${winnerName} rakibinin tüm donanmasını batırarak zafere ulaştı!`;
    } else {
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
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
