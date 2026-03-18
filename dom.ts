export const elements = {
    // Tabs
    tabs: null as unknown as NodeListOf<Element>,
    tabContents: null as unknown as NodeListOf<Element>,

    // Global
    tabHeader: null as unknown as HTMLElement,

    // Generator UI
    generateBtn: null as unknown as HTMLButtonElement,
    catchBtn: null as unknown as HTMLButtonElement,
    pokemonCard: null as unknown as HTMLElement,
    pokemonSprite: null as unknown as HTMLImageElement,
    pokemonName: null as unknown as HTMLElement,
    pokemonId: null as unknown as HTMLElement,
    pokemonTypes: null as unknown as HTMLElement,
    abilityContainer: null as unknown as HTMLElement,
    abilityName: null as unknown as HTMLElement,
    catchFeedbackContainer: null as unknown as HTMLElement,
    catchFeedback: null as unknown as HTMLElement,

    // Battle UI
    startBattleBtn: null as unknown as HTMLButtonElement,
    enemyName: null as unknown as HTMLElement,
    enemyHp: null as unknown as HTMLElement,
    enemyHpText: null as unknown as HTMLElement,
    enemySprite: null as unknown as HTMLImageElement,
    playerName: null as unknown as HTMLElement,
    playerHp: null as unknown as HTMLElement,
    playerHpText: null as unknown as HTMLElement,
    playerSprite: null as unknown as HTMLImageElement,

    // Status Bar
    currency: null as unknown as HTMLElement,
    locationSelect: null as unknown as HTMLSelectElement,

    // Ball Inventory
    ballSlots: null as unknown as NodeListOf<Element>,

    // Shop
    shopContainer: null as unknown as HTMLElement,

    // Storage UI
    storageGrid: null as unknown as HTMLElement,
    prevPage: null as unknown as HTMLButtonElement,
    nextPage: null as unknown as HTMLButtonElement,
    pageInfo: null as unknown as HTMLElement,

    // Map UI
    mapGrid: null as unknown as HTMLElement,
    playerCharacter: null as unknown as HTMLElement,
    dayCounter: null as unknown as HTMLElement,
    energyCounter: null as unknown as HTMLElement,
    matWood: null as unknown as HTMLElement,
    matStone: null as unknown as HTMLElement,
    dailyRewardBtn: null as unknown as HTMLButtonElement,
    sleepBtn: null as unknown as HTMLButtonElement,
    dailyModal: null as unknown as HTMLElement,
    dailyTilesContainer: null as unknown as HTMLElement,
    dailySkipBtn: null as unknown as HTMLButtonElement,

    // Audio
    audio: null as unknown as HTMLAudioElement
};

export const initElements = () => {
    elements.tabs = document.querySelectorAll('.tab-btn');
    elements.tabContents = document.querySelectorAll('.tab-content');
    elements.tabHeader = document.getElementById('tab-header') as HTMLElement;

    elements.generateBtn = document.getElementById('generate-btn') as HTMLButtonElement;
    elements.catchBtn = document.getElementById('catch-btn') as HTMLButtonElement;
    elements.pokemonCard = document.getElementById('pokemon-card') as HTMLElement;
    elements.pokemonSprite = document.getElementById('pokemon-sprite') as HTMLImageElement;
    elements.pokemonName = document.getElementById('pokemon-name') as HTMLElement;
    elements.pokemonId = document.getElementById('pokemon-id') as HTMLElement;
    elements.pokemonTypes = document.getElementById('pokemon-types') as HTMLElement;
    elements.abilityContainer = document.getElementById('pokemon-ability-container') as HTMLElement;
    elements.abilityName = document.getElementById('pokemon-ability') as HTMLElement;
    elements.catchFeedbackContainer = document.getElementById('catch-feedback-container') as HTMLElement;
    elements.catchFeedback = document.getElementById('catch-feedback') as HTMLElement;

    elements.startBattleBtn = document.getElementById('start-battle-btn') as HTMLButtonElement;
    elements.enemyName = document.getElementById('enemy-name') as HTMLElement;
    elements.enemyHp = document.getElementById('enemy-hp') as HTMLElement;
    elements.enemyHpText = document.getElementById('enemy-hp-text') as HTMLElement;
    elements.enemySprite = document.getElementById('enemy-sprite') as HTMLImageElement;
    elements.playerName = document.getElementById('player-name') as HTMLElement;
    elements.playerHp = document.getElementById('player-hp') as HTMLElement;
    elements.playerHpText = document.getElementById('player-hp-text') as HTMLElement;
    elements.playerSprite = document.getElementById('player-sprite') as HTMLImageElement;

    elements.currency = document.getElementById('player-currency') as HTMLElement;
    elements.locationSelect = document.getElementById('location-select') as HTMLSelectElement;
    elements.ballSlots = document.querySelectorAll('.ball-inventory .ball-slot');
    elements.shopContainer = document.getElementById('shop-items-container') as HTMLElement;

    elements.storageGrid = document.getElementById('storage-grid') as HTMLElement;
    elements.prevPage = document.getElementById('prev-page') as HTMLButtonElement;
    elements.nextPage = document.getElementById('next-page') as HTMLButtonElement;
    elements.pageInfo = document.getElementById('page-info') as HTMLElement;

    elements.mapGrid = document.getElementById('map-grid') as HTMLElement;
    elements.playerCharacter = document.getElementById('player-character') as HTMLElement;
    elements.dayCounter = document.getElementById('day-counter') as HTMLElement;
    elements.energyCounter = document.getElementById('energy-counter') as HTMLElement;
    elements.matWood = document.getElementById('mat-wood') as HTMLElement;
    elements.matStone = document.getElementById('mat-stone') as HTMLElement;
    elements.dailyRewardBtn = document.getElementById('daily-reward-btn') as HTMLButtonElement;
    elements.sleepBtn = document.getElementById('sleep-btn') as HTMLButtonElement;
    elements.dailyModal = document.getElementById('daily-modal') as HTMLElement;
    elements.dailyTilesContainer = document.getElementById('daily-tiles-container') as HTMLElement;
    elements.dailySkipBtn = document.getElementById('daily-skip-btn') as HTMLButtonElement;

    elements.audio = document.getElementById('pokemon-cry') as HTMLAudioElement;
};
