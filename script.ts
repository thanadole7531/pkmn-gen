/**
 * Random Pokémon Project - Hobby Phase
 * Goal: Transform into a unique browser-based Pokémon game.
 */

import { CONFIG } from './config';
import { TILE_DATABASE, getRandomTileByRarity, rollRarity } from './tiles';

// --- Interfaces ---
interface PokemonType {
    type: { name: string; }
}

interface PokemonSprites {
    front_default: string | null;
    front_shiny: string | null;
}

interface PokemonAbility {
    is_hidden: boolean;
    ability: { name: string; }
}

interface PokemonData {
    name: string;
    id: number;
    sprites: PokemonSprites;
    types: PokemonType[];
    cries: { latest: string; legacy: string; };
    abilities: PokemonAbility[];
    species: { name: string; url: string; };
    stats: { base_stat: number; stat: { name: string; }; }[];
}

interface CaughtPokemon extends PokemonData {
    uuid: string;
    caughtDate: number;
    isShiny: boolean;
    abilityStatus: PokemonAbility;
}

// --- Global State ---
const savedBalls = localStorage.getItem('pkmn_balls');
let initialBalls: Record<string, number>;
try {
    const parsed = JSON.parse(savedBalls || 'null');
    if (parsed && typeof parsed === 'object') {
        initialBalls = parsed;
    } else {
        // Migration or default
        initialBalls = {
            ...CONFIG.STARTING_BALLS,
            ...(typeof parsed === 'number' ? { POKEBALL: parsed } : {})
        };
    }
} catch (e) {
    initialBalls = { ...CONFIG.STARTING_BALLS };
}

// Ensure all ball types exist
Object.keys(CONFIG.BALLS).forEach(key => {
    if (!(key in initialBalls)) initialBalls[key] = 0;
});

const state = {
    currency: Number(localStorage.getItem('pkmn_currency')) || CONFIG.STARTING_CURRENCY,
    balls: initialBalls,
    currentBall: (localStorage.getItem('pkmn_current_ball') as keyof typeof CONFIG.BALLS) || CONFIG.DEFAULT_BALL,
    location: CONFIG.LOCATIONS.find(l => l.habitat === (localStorage.getItem('pkmn_location') || CONFIG.DEFAULT_LOCATION)) || CONFIG.LOCATIONS[0],
    pcStorage: JSON.parse(localStorage.getItem('pkmn_storage') || '[]') as CaughtPokemon[],
    currentPage: 1,
    itemsPerPage: 9,
    currentPokemon: null as PokemonData | null,
    currentIsShiny: false,
    currentAbility: null as PokemonAbility | null,
    cache: {
        habitats: JSON.parse(localStorage.getItem('pkmn_cache_habitats') || '{}') as Record<string, number[]>,
        pokemon: JSON.parse(localStorage.getItem('pkmn_cache_pokemon') || '{}') as Record<number, PokemonData>,
        species: JSON.parse(localStorage.getItem('pkmn_cache_species') || '{}') as Record<string, any>
    }
};

interface TileInstance {
    tileId: string;
    usesLeft: number;
}

interface MapState {
    playerX: number;
    playerY: number;
    day: number;
    energy: number;
    maxEnergy: number;
    wood: number;
    stone: number;
    dailyClaimed: boolean;
    isMoving: boolean;
    tiles: (TileInstance | null)[][];
    tileDeck: string[];
}
const mapState: MapState = {
    playerX: 3,
    playerY: 3,
    day: 1,
    energy: 10, // Restored to 10 as per user's original plan
    maxEnergy: 10,
    wood: 0,
    stone: 0,
    dailyClaimed: false,
    isMoving: false,
    tiles: [],
    tileDeck: []
};

const saveCacheToStorage = () => {
    try {
        // Prune cache if it gets too large to avoid localStorage limits
        const prune = (obj: Record<any, any>, limit: number) => {
            const keys = Object.keys(obj);
            if (keys.length > limit) {
                // Remove oldest half
                keys.slice(0, Math.floor(limit / 2)).forEach(k => delete obj[k]);
            }
        };

        prune(state.cache.habitats, 20);
        prune(state.cache.pokemon, 100);
        prune(state.cache.species, 50);

        localStorage.setItem('pkmn_cache_habitats', JSON.stringify(state.cache.habitats));
        localStorage.setItem('pkmn_cache_pokemon', JSON.stringify(state.cache.pokemon));
        localStorage.setItem('pkmn_cache_species', JSON.stringify(state.cache.species));
    } catch (e) {
        console.warn('Cache save failed (Storage full?)', e);
        // If critical, we could clear caches here
        if (e instanceof Error && e.name === 'QuotaExceededError') {
            state.cache.habitats = {};
            state.cache.pokemon = {};
            state.cache.species = {};
        }
    }
};

// Add a global type extension for window.forceShiny
declare global {
    interface Window {
        forceShiny?: boolean;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const elements = {
        // Tabs
        tabs: document.querySelectorAll('.tab-btn'),
        tabContents: document.querySelectorAll('.tab-content'),

        // Global
        tabHeader: document.getElementById('tab-header') as HTMLElement,

        // Generator UI
        generateBtn: document.getElementById('generate-btn') as HTMLButtonElement,
        catchBtn: document.getElementById('catch-btn') as HTMLButtonElement,
        pokemonCard: document.getElementById('pokemon-card') as HTMLElement,
        pokemonSprite: document.getElementById('pokemon-sprite') as HTMLImageElement,
        pokemonName: document.getElementById('pokemon-name') as HTMLElement,
        pokemonId: document.getElementById('pokemon-id') as HTMLElement,
        pokemonTypes: document.getElementById('pokemon-types') as HTMLElement,
        abilityContainer: document.getElementById('pokemon-ability-container') as HTMLElement,
        abilityName: document.getElementById('pokemon-ability') as HTMLElement,
        catchFeedbackContainer: document.getElementById('catch-feedback-container') as HTMLElement,
        catchFeedback: document.getElementById('catch-feedback') as HTMLElement,

        // Battle UI
        startBattleBtn: document.getElementById('start-battle-btn') as HTMLButtonElement,
        enemyName: document.getElementById('enemy-name') as HTMLElement,
        enemyHp: document.getElementById('enemy-hp') as HTMLElement,
        enemyHpText: document.getElementById('enemy-hp-text') as HTMLElement,
        enemySprite: document.getElementById('enemy-sprite') as HTMLImageElement,
        playerName: document.getElementById('player-name') as HTMLElement,
        playerHp: document.getElementById('player-hp') as HTMLElement,
        playerHpText: document.getElementById('player-hp-text') as HTMLElement,
        playerSprite: document.getElementById('player-sprite') as HTMLImageElement,

        // Status Bar
        currency: document.getElementById('player-currency') as HTMLElement,
        locationSelect: document.getElementById('location-select') as HTMLSelectElement,

        // Ball Inventory
        ballSlots: document.querySelectorAll('.ball-inventory .ball-slot'),

        // Shop
        shopContainer: document.getElementById('shop-items-container') as HTMLElement,

        // Storage UI
        storageGrid: document.getElementById('storage-grid') as HTMLElement,
        prevPage: document.getElementById('prev-page') as HTMLButtonElement,
        nextPage: document.getElementById('next-page') as HTMLButtonElement,
        pageInfo: document.getElementById('page-info') as HTMLElement,

        // Map UI
        mapGrid: document.getElementById('map-grid') as HTMLElement,
        playerCharacter: document.getElementById('player-character') as HTMLElement,
        dayCounter: document.getElementById('day-counter') as HTMLElement,
        energyCounter: document.getElementById('energy-counter') as HTMLElement,
        matWood: document.getElementById('mat-wood') as HTMLElement,
        matStone: document.getElementById('mat-stone') as HTMLElement,
        dailyRewardBtn: document.getElementById('daily-reward-btn') as HTMLButtonElement,
        sleepBtn: document.getElementById('sleep-btn') as HTMLButtonElement,
        dailyModal: document.getElementById('daily-modal') as HTMLElement,
        dailyTilesContainer: document.getElementById('daily-tiles-container') as HTMLElement,
        dailySkipBtn: document.getElementById('daily-skip-btn') as HTMLButtonElement,

        // Audio
        audio: document.getElementById('pokemon-cry') as HTMLAudioElement
    };

    // --- Initialization ---
    const init = () => {
        populateLocations();
        populateShop();
        updateStatusBar();
        setupEventListeners();
        initMapGrid();
        switchTab('generator-tab');
        renderStorage();
    };

    const populateLocations = () => {
        if (!elements.locationSelect) return;
        elements.locationSelect.innerHTML = '';
        CONFIG.LOCATIONS.forEach((loc, index) => {
            const option = document.createElement('option');
            option.value = index.toString();
            option.textContent = loc.name;
            elements.locationSelect.appendChild(option);
        });

        // Match current state
        const currentIndex = CONFIG.LOCATIONS.findIndex(l => l.name === state.location.name);
        if (currentIndex !== -1) {
            elements.locationSelect.value = currentIndex.toString();
        }
    };

    const populateShop = () => {
        if (!elements.shopContainer) return;
        elements.shopContainer.innerHTML = '';

        Object.entries(CONFIG.BALLS).forEach(([key, ball]) => {
            const btn = document.createElement('button');
            btn.className = 'shop-item-btn';
            btn.dataset.ball = key;

            const nameSpan = document.createElement('span');
            nameSpan.className = 'ball-name';
            const quantity = key === 'MASTERBALL' ? 1 : 10;
            nameSpan.textContent = `${ball.name}${quantity > 1 ? ' x' + quantity : ''}`;

            const priceSpan = document.createElement('span');
            priceSpan.className = 'ball-price';
            priceSpan.textContent = `${ball.price >= 1000 ? (ball.price / 1000) + 'K' : ball.price}₽`;

            btn.appendChild(nameSpan);
            btn.appendChild(priceSpan);

            btn.addEventListener('click', () => {
                const ballDef = CONFIG.BALLS[key as keyof typeof CONFIG.BALLS];
                if (ballDef && state.currency >= ballDef.price) {
                    state.currency -= ballDef.price;
                    state.balls[key] += quantity;
                    updateStatusBar();

                    btn.classList.add('bought-flash');
                    setTimeout(() => btn.classList.remove('bought-flash'), 300);
                } else {
                    elements.currency.classList.add('error-flash');
                    setTimeout(() => elements.currency.classList.remove('error-flash'), 500);
                }
            });

            elements.shopContainer.appendChild(btn);
        });
    };

    const updateStatusBar = () => {
        if (elements.currency) elements.currency.textContent = state.currency.toLocaleString();

        // Update Ball Counts and Active State
        Object.keys(state.balls).forEach(ballKey => {
            const countEl = document.getElementById(`count-${ballKey}`);
            if (countEl) {
                countEl.textContent = state.balls[ballKey].toString();
            }
        });

        elements.ballSlots.forEach(slot => {
            const ball = (slot as HTMLElement).dataset.ball;
            slot.classList.toggle('active', ball === state.currentBall);
        });

        localStorage.setItem('pkmn_currency', state.currency.toString());
        localStorage.setItem('pkmn_balls', JSON.stringify(state.balls));
        localStorage.setItem('pkmn_current_ball', state.currentBall);
    };

    const setupEventListeners = () => {
        // Tab switching
        elements.tabs.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = (btn as HTMLElement).dataset.tab;
                if (target) switchTab(target);
            });
        });

        // Generator
        elements.generateBtn.addEventListener('click', fetchPokemon);
        elements.catchBtn.addEventListener('click', attemptCatch);

        // Battle
        if (elements.startBattleBtn) {
            elements.startBattleBtn.addEventListener('click', testBattle);
        }

        // Location Changing
        elements.locationSelect.addEventListener('change', () => {
            const index = parseInt(elements.locationSelect.value);
            state.location = CONFIG.LOCATIONS[index];
            localStorage.setItem('pkmn_location', state.location.habitat); // Store habitat for restoration
            updateStatusBar();
        });

        // Ball Selection
        elements.ballSlots.forEach(slot => {
            slot.addEventListener('click', () => {
                const ball = (slot as HTMLElement).dataset.ball as keyof typeof CONFIG.BALLS;
                if (ball) {
                    state.currentBall = ball;
                    updateStatusBar();
                }
            });
        });

        // PC Storage
        elements.prevPage.addEventListener('click', () => {
            if (state.currentPage > 1) {
                state.currentPage--;
                renderStorage();
            }
        });
        elements.nextPage.addEventListener('click', () => {
            const maxPage = Math.ceil(state.pcStorage.length / state.itemsPerPage) || 1;
            if (state.currentPage < maxPage) {
                state.currentPage++;
                renderStorage();
            }
        });

        // Global shortcuts
        document.addEventListener('keydown', (e) => {
            // Prevent scrolling on space/arrows if we are active on a game tab
            if (isTabActive('generator-tab') || isTabActive('map-tab')) {
                if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                    e.preventDefault();
                }
            }

            if (e.code === 'Space' && !elements.generateBtn.disabled && isTabActive('generator-tab')) {
                fetchPokemon();
            }

            if (isTabActive('map-tab')) {
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
                    // Make sure modal isn't open
                    if (elements.dailyModal && elements.dailyModal.classList.contains('hidden')) {
                        handleMapMovement(e.code);
                    }
                }
            }
        });

        // Map Buttons
        if (elements.sleepBtn) elements.sleepBtn.addEventListener('click', nextDay);
        if (elements.dailyRewardBtn) elements.dailyRewardBtn.addEventListener('click', showDailyReward);
        if (elements.dailySkipBtn) {
            elements.dailySkipBtn.addEventListener('click', () => {
                elements.dailyModal.classList.add('hidden');
            });
        }

        if (elements.audio) elements.audio.volume = CONFIG.AUDIO_VOLUME;
    };

    const isTabActive = (id: string) => {
        const tab = document.getElementById(id);
        return tab && !tab.classList.contains('hidden');
    };

    const switchTab = (tabId: string) => {
        elements.tabContents.forEach(content => {
            content.classList.toggle('hidden', content.id !== tabId);
        });
        elements.tabs.forEach(btn => {
            (btn as HTMLElement).classList.toggle('active', (btn as HTMLElement).dataset.tab === tabId);
        });

        // Update Header
        if (elements.tabHeader) {
            switch (tabId) {
                case 'generator-tab': elements.tabHeader.textContent = 'Encounter'; break;
                case 'storage-tab': elements.tabHeader.textContent = 'PC Storage'; break;
                case 'items-tab': elements.tabHeader.textContent = 'Items'; break;
                case 'map-tab': elements.tabHeader.textContent = 'Map'; break;
                case 'battle-tab': elements.tabHeader.textContent = 'Battle'; break;
            }
        }

        if (tabId === 'storage-tab') renderStorage();
    };

    // --- Generator Logic ---
    const fetchIdsForHabitat = async (habitat: string): Promise<number[]> => {
        if (state.cache.habitats[habitat]) {
            return state.cache.habitats[habitat];
        }
        try {
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon-habitat/${habitat}/`);
            if (!res.ok) throw new Error('Habitat not found');
            const data = await res.json();
            const ids = data.pokemon_species.map((s: any) => {
                const parts = s.url.split('/');
                return parseInt(parts[parts.length - 2]);
            });
            state.cache.habitats[habitat] = ids;
            saveCacheToStorage();
            return ids;
        } catch (e) {
            console.warn('Habitat fetch failed, using fallback random range', e);
            // Fallback: return a few random IDs if habitat fails
            return Array.from({ length: 10 }, () => Math.floor(Math.random() * CONFIG.MAX_POKEMON) + 1);
        }
    };

    async function fetchPokemon() {
        elements.pokemonCard.classList.add('fetching');
        elements.generateBtn.disabled = true;
        elements.catchBtn.disabled = true;
        
        // Clear all catch/sprite states
        elements.catchFeedbackContainer.classList.add('hidden');
        elements.pokemonSprite.classList.add('hidden');
        elements.pokemonSprite.classList.remove('pokeball-throw', 'pokeball-shake', 'pokeball-catch', 'escape-flash');
        elements.pokemonSprite.style.animation = 'none';
        void elements.pokemonSprite.offsetWidth; // force reflow

        try {
            const ids = await fetchIdsForHabitat(state.location.habitat);
            const id = ids[Math.floor(Math.random() * ids.length)];

            let data: PokemonData;
            if (state.cache.pokemon[id]) {
                data = state.cache.pokemon[id];
            } else {
                const response = await fetch(`${CONFIG.API_BASE_URL}/${id}`);
                if (!response.ok) throw new Error('Failed to fetch Pokémon');
                data = await response.json() as PokemonData;
                state.cache.pokemon[id] = data;
                saveCacheToStorage();
            }
            state.currentPokemon = data;
            state.currentIsShiny = window.forceShiny || Math.random() < CONFIG.SHINY_CHANCE;
            state.currentAbility = data.abilities[Math.floor(Math.random() * data.abilities.length)];

            // Construction sprite URL directly for better reliability
            const baseUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
            const spriteUrl = state.currentIsShiny
                ? `${baseUrl}/shiny/${id}.png`
                : `${baseUrl}/${id}.png`;

            // Cry
            const cryUrl = data.cries.legacy || data.cries.latest;
            if (cryUrl && elements.audio) {
                elements.audio.src = cryUrl;
                elements.audio.play().catch(() => { });
            }

            // Wait for image to load
            await new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = resolve;
                img.onerror = reject;
                img.src = spriteUrl;
            });

            updateUI();

            // Delay for animation sync
            setTimeout(() => {
                elements.pokemonCard.classList.remove('fetching');
                elements.pokemonSprite.classList.remove('hidden');
                resetAnimation(elements.pokemonSprite, CONFIG.ANIMATIONS.POP_IN_FLOAT);
                
                const animEls = [
                    elements.pokemonId.parentElement,
                    elements.pokemonName,
                    elements.pokemonTypes,
                    elements.abilityContainer
                ];

                animEls.forEach(el => {
                    if (el && !el.classList.contains('hidden')) {
                        el.classList.remove('fade-up-text');
                        void el.offsetWidth;
                        el.classList.add('fade-up-text');
                    }
                });

                elements.generateBtn.disabled = false;
                elements.catchBtn.disabled = false;
            }, 300);

        } catch (error) {
            console.error('Fetch failed:', error);
            elements.pokemonName.textContent = 'Error';
            elements.generateBtn.disabled = false;
            elements.pokemonCard.classList.remove('fetching');
            elements.catchFeedbackContainer.classList.add('hidden');
        }
    }

    const updateUI = () => {
        if (!state.currentPokemon) return;
        const p = state.currentPokemon;
        const formattedName = p.name.replace(/-/g, ' ');

        elements.pokemonName.textContent = state.currentIsShiny ? `✨ ${formattedName} ✨` : formattedName;
        elements.pokemonId.textContent = p.id.toString().padStart(3, '0');
        elements.pokemonCard.classList.toggle('shiny', state.currentIsShiny);

        const baseUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
        const spriteUrl = state.currentIsShiny
            ? `${baseUrl}/shiny/${p.id}.png`
            : `${baseUrl}/${p.id}.png`;
        elements.pokemonSprite.src = spriteUrl;

        elements.pokemonTypes.innerHTML = '';
        p.types.forEach(t => {
            const span = document.createElement('span');
            span.className = `type ${t.type.name}`;
            span.textContent = t.type.name;
            elements.pokemonTypes.appendChild(span);
        });

        if (state.currentAbility) {
            elements.abilityContainer.classList.remove('hidden');
            elements.abilityName.textContent = state.currentAbility.ability.name.replace(/-/g, ' ');
            elements.abilityName.classList.toggle('hidden-ability', state.currentAbility.is_hidden);
            if (state.currentAbility.is_hidden) elements.abilityName.textContent += ' (Hidden)';
        } else {
            elements.abilityContainer.classList.add('hidden');
        }
    };

    async function attemptCatch() {
        const currentBallCount = state.balls[state.currentBall];
        if (!state.currentPokemon || currentBallCount <= 0) {
            if (currentBallCount <= 0) {
                elements.catchFeedbackContainer.classList.remove('hidden');
                elements.catchFeedback.textContent = 'NO BALLS!';
                elements.catchFeedback.style.color = '#f87171';

                // Auto-hide after 2s
                setTimeout(() => {
                    elements.catchFeedbackContainer.classList.add('hidden');
                }, 2000);
            }
            return;
        }

        elements.catchBtn.disabled = true;
        elements.generateBtn.disabled = true;
        state.balls[state.currentBall]--;
        updateStatusBar();

        try {
            let speciesData;
            const speciesUrl = state.currentPokemon.species.url;
            if (state.cache.species[speciesUrl]) {
                speciesData = state.cache.species[speciesUrl];
            } else {
                const res = await fetch(speciesUrl);
                speciesData = await res.json();
                state.cache.species[speciesUrl] = speciesData;
                saveCacheToStorage();
            }
            const baseRate = speciesData.capture_rate; // 1-255
            const ballMult = CONFIG.BALLS[state.currentBall].multiplier;

            // Updated catch calculation mimicking closer to game logic
            const maxHp = 100; // Simplified
            const currentHp = 100; // Simplified
            const a = ((3 * maxHp - 2 * currentHp) * (baseRate * ballMult)) / (3 * maxHp);
            const catchProbability = a / 255;

            // Get selected ball sprite
            const ballKey = state.currentBall.toLowerCase().replace('ball', '-ball');
            const ballSpriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${ballKey}.png`;

            // Save original Pokemon Sprite to restore later
            const p = state.currentPokemon;
            const baseUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
            const originalSpriteUrl = state.currentIsShiny
                ? `${baseUrl}/shiny/${p.id}.png`
                : `${baseUrl}/${p.id}.png`;

            // Step 1: Throw ball animation
            resetAnimation(elements.pokemonSprite, 'none');
            elements.pokemonSprite.src = ballSpriteUrl;
            elements.pokemonSprite.classList.add('pokeball-throw');

            // Wait for throw animation to finish
            await new Promise(resolve => setTimeout(resolve, 2000));
            elements.pokemonSprite.classList.remove('pokeball-throw');

            // Calculate shakes based on probability
            let shakes = 0;
            if (state.currentBall === 'MASTERBALL' || catchProbability >= 1) {
                shakes = 4;
            } else {
                const b = 1048560 / Math.sqrt(Math.sqrt(16711680 / a));
                for (let i = 0; i < 4; i++) {
                    if (Math.floor(Math.random() * 65536) < b) {
                        shakes++;
                    } else {
                        break;
                    }
                }
            }

            // Cap shakes to 3, 4 means caught
            const actualShakes = Math.min(shakes, 3);
            const caught = shakes >= 4;

            // Step 2: Shake animation
            for (let i = 0; i < actualShakes; i++) {
                elements.pokemonSprite.classList.add('pokeball-shake');
                resetAnimation(elements.pokemonSprite, 'shakePokeball 0.8s ease-in-out forwards');
                await new Promise(resolve => setTimeout(resolve, 800));
                elements.pokemonSprite.classList.remove('pokeball-shake');
                await new Promise(resolve => setTimeout(resolve, 400)); // Pause between shakes
            }

            // Step 3: Result
            elements.catchFeedbackContainer.classList.remove('hidden');

            if (caught) {
                elements.pokemonSprite.classList.add('pokeball-catch');
                elements.catchFeedback.textContent = 'CAUGHT!';
                elements.catchFeedback.style.color = '#4ade80';

                const caughtPokemon: CaughtPokemon = {
                    ...state.currentPokemon,
                    uuid: (typeof crypto.randomUUID === 'function') 
                        ? crypto.randomUUID() 
                        : Math.random().toString(36).substring(2) + Date.now().toString(36),
                    caughtDate: Date.now(),
                    isShiny: state.currentIsShiny,
                    abilityStatus: state.currentAbility || { is_hidden: false, ability: { name: 'unknown' } }
                };
                
                try {
                    state.pcStorage.unshift(caughtPokemon);
                    localStorage.setItem('pkmn_storage', JSON.stringify(state.pcStorage));
                } catch (err) {
                    console.error('Failed to save PC storage', err);
                    elements.catchFeedback.textContent = 'PC FULL!';
                    elements.catchFeedback.style.color = '#ef4444';
                }

                // Auto-next after 1.5s
                setTimeout(() => {
                    elements.catchFeedbackContainer.classList.add('hidden');
                    elements.pokemonSprite.classList.remove('pokeball-catch');
                    fetchPokemon();
                }, 1500);

            } else {
                elements.pokemonSprite.classList.add('escape-flash');

                const fled = Math.random() < (CONFIG.FLEE_CHANCE || 0.15);
                elements.catchFeedback.textContent = fled ? 'ESCAPED!' : 'FAILED!';
                elements.catchFeedback.style.color = '#f87171';

                // Restore original Pokémon sprite
                setTimeout(() => {
                    elements.pokemonSprite.classList.remove('escape-flash');

                    if (fled) {
                        // Pokemon ran away
                        elements.pokemonSprite.classList.add('hidden');
                        setTimeout(() => {
                            elements.catchFeedbackContainer.classList.add('hidden');
                            fetchPokemon();
                        }, 1500);
                    } else {
                        // Stayed for another try
                        elements.pokemonSprite.src = originalSpriteUrl;
                        resetAnimation(elements.pokemonSprite, CONFIG.ANIMATIONS.FLOAT);

                        setTimeout(() => {
                            elements.catchFeedbackContainer.classList.add('hidden');
                            elements.catchBtn.disabled = false;
                            elements.generateBtn.disabled = false;
                        }, 1500);
                    }
                }, 500);
            }

        } catch (e) {
            console.error('Catch failed', e);
            elements.catchBtn.disabled = false;
            elements.generateBtn.disabled = false;
        }
    }

    // --- PC Storage Logic ---
    const renderStorage = () => {
        elements.storageGrid.innerHTML = '';
        const start = (state.currentPage - 1) * state.itemsPerPage;
        const end = start + state.itemsPerPage;
        const pageItems = state.pcStorage.slice(start, end);

        pageItems.forEach(pkmn => {
            const item = document.createElement('div');
            const isShiny = pkmn.isShiny === true; // Force boolean check

            item.className = 'storage-item';
            if (isShiny) item.classList.add('shiny-item');

            const img = document.createElement('img');
            // Use direct URL construction for high reliability
            const baseUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
            img.src = isShiny
                ? `${baseUrl}/shiny/${pkmn.id}.png`
                : `${baseUrl}/${pkmn.id}.png`;

            const name = document.createElement('span');
            name.className = 'name';
            name.textContent = pkmn.name;

            const relBtn = document.createElement('button');
            relBtn.className = 'release-btn';
            relBtn.textContent = 'REL';
            relBtn.onclick = (e) => {
                e.stopPropagation();
                releasePokemon(pkmn.uuid);
            };

            item.appendChild(img);
            item.appendChild(name);
            item.appendChild(relBtn);
            elements.storageGrid.appendChild(item);
        });

        const maxPage = Math.ceil(state.pcStorage.length / state.itemsPerPage) || 1;
        elements.pageInfo.textContent = `Page ${state.currentPage} / ${maxPage}`;
        elements.prevPage.disabled = state.currentPage === 1;
        elements.nextPage.disabled = state.currentPage === maxPage;
    };

    const releasePokemon = (uuid: string) => {
        const index = state.pcStorage.findIndex(p => p.uuid === uuid);
        if (index !== -1) {
            const pkmn = state.pcStorage[index];
            const multiplier = pkmn.isShiny ? (CONFIG.SHINY_RELEASE_MULTIPLIER || 100) : 1;
            const reward = CONFIG.REWARD_RELEASE * multiplier;

            state.pcStorage.splice(index, 1);
            state.currency += reward;
            localStorage.setItem('pkmn_storage', JSON.stringify(state.pcStorage));
            updateStatusBar();
            renderStorage();
        }
    };

    // --- Battle Logic ---
    async function testBattle() {
        if (!elements.startBattleBtn) return;
        elements.startBattleBtn.disabled = true;
        
        try {
            // Pick two random pokemon IDs for enemy and player
            const enemyId = Math.floor(Math.random() * CONFIG.MAX_POKEMON) + 1;
            const playerId = Math.floor(Math.random() * CONFIG.MAX_POKEMON) + 1;
            
            const [enemyRes, playerRes] = await Promise.all([
                fetch(`${CONFIG.API_BASE_URL}/${enemyId}`),
                fetch(`${CONFIG.API_BASE_URL}/${playerId}`)
            ]);
            
            if (!enemyRes.ok || !playerRes.ok) throw new Error('Failed to fetch battle pokemon');
            
            const enemyData: PokemonData = await enemyRes.json();
            const playerData: PokemonData = await playerRes.json();
            
            elements.enemyName.textContent = enemyData.name.replace(/-/g, ' ');
            elements.playerName.textContent = playerData.name.replace(/-/g, ' ');

            // Calculate mock HP based on stats to be realistic
            const enemyHpStat = enemyData.stats.find(s => s.stat.name === 'hp')?.base_stat || 100;
            const playerHpStat = playerData.stats.find(s => s.stat.name === 'hp')?.base_stat || 100;
            const enemyMaxHp = Math.floor(0.01 * (2 * enemyHpStat + 31 + Math.floor(0.25 * 252)) * 50) + 50 + 10;
            const playerMaxHp = Math.floor(0.01 * (2 * playerHpStat + 31 + Math.floor(0.25 * 252)) * 50) + 50 + 10;

            if (elements.enemyHpText) elements.enemyHpText.textContent = `${enemyMaxHp}/${enemyMaxHp}`;
            if (elements.playerHpText) elements.playerHpText.textContent = `${playerMaxHp}/${playerMaxHp}`;

            // Use normal base pixel sprites
            const baseUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

            // Enemy: front sprite
            elements.enemySprite.src = `${baseUrl}/${enemyId}.png`;
                
            // Player: front sprite (will be mirrored in CSS)
            elements.playerSprite.src = `${baseUrl}/${playerId}.png`;
                
            // Reset HP bars
            elements.enemyHp.style.width = '100%';
            elements.playerHp.style.width = '100%';
            
            // Add a test debuff
            const debuffArea = document.getElementById('enemy-debuffs');
            if (debuffArea) {
                debuffArea.innerHTML = '<span class="debuff-icon" style="background: #a855f7;">PSN</span>';
            }
            
        } catch (error) {
            console.error('Test battle failed:', error);
            elements.enemyName.textContent = 'Error';
            elements.playerName.textContent = 'Error';
        } finally {
            elements.startBattleBtn.disabled = false;
        }
    }

    // --- Map Logic ---
    const updateMapUI = () => {
        if (elements.dayCounter) elements.dayCounter.textContent = `Day ${mapState.day}`;
        if (elements.energyCounter) {
            elements.energyCounter.textContent = `Energy ${mapState.energy}/${mapState.maxEnergy}`;
            elements.energyCounter.style.color = mapState.energy === 0 ? '#ef4444' : '#fbd34d';
        }
        if (elements.matWood) elements.matWood.textContent = `Wood: ${mapState.wood}`;
        if (elements.matStone) elements.matStone.textContent = `Stone: ${mapState.stone}`;
        if (elements.dailyRewardBtn) {
            elements.dailyRewardBtn.disabled = mapState.dailyClaimed;
        }
    };

    const nextDay = () => {
        mapState.day++;
        mapState.energy = mapState.maxEnergy;
        mapState.dailyClaimed = false;
        
        // Reset position to center
        mapState.playerX = 3;
        mapState.playerY = 3;
        
        generateMap();
        updateMapUI();
        updateMapRender();
    };

    const generateMap = () => {
        if (!elements.mapGrid) return;
        elements.mapGrid.innerHTML = '';
        mapState.tiles = [];

        for (let y = 0; y < 7; y++) {
            const row: (TileInstance | null)[] = [];
            for (let x = 0; x < 7; x++) {
                if (x === 3 && y === 3) {
                    row.push({ tileId: 'soil', usesLeft: 0 });
                } else {
                    const rarity = rollRarity();
                    const definition = getRandomTileByRarity(rarity);

                    row.push({ 
                        tileId: definition.id, 
                        usesLeft: definition.maxUses 
                    });
                }
            }
            mapState.tiles.push(row);
        }
        renderMapGrid();
    };

    const renderMapGrid = () => {
        elements.mapGrid.innerHTML = '';
        for (let y = 0; y < 7; y++) {
            for (let x = 0; x < 7; x++) {
                const instance = mapState.tiles[y][x];
                const tileDiv = document.createElement('div');
                tileDiv.className = 'map-tile ' + (instance?.tileId || 'soil');
                tileDiv.dataset.x = x.toString();
                tileDiv.dataset.y = y.toString();
                elements.mapGrid.appendChild(tileDiv);
            }
        }
    };

    const initMapGrid = () => {
        generateMap();
        updateMapRender();
        updateMapUI();
    };

    const updateMapRender = () => {
        if (elements.playerCharacter) {
            elements.playerCharacter.style.left = `${mapState.playerX * 64}px`;
            elements.playerCharacter.style.top = `${mapState.playerY * 64}px`;
        }
    };

    const handleTileInteraction = (x: number, y: number) => {
        const instance = mapState.tiles[y][x];
        if (!instance) return;

        const definition = TILE_DATABASE[instance.tileId];
        if (!definition) return;

        // Apply interaction
        if (definition.resourceType === 'wood') {
            mapState.wood += 1;
            instance.usesLeft--;
        } else if (definition.resourceType === 'stone') {
            mapState.stone += 1;
            instance.usesLeft--;
        } else if (definition.id === 'grass') {
            instance.usesLeft--;
        }

        // Break tile if consumable and used up
        if (definition.isConsumable && instance.usesLeft <= 0) {
            mapState.tiles[y][x] = { tileId: 'soil', usesLeft: 0 };
            const domIndex = y * 7 + x;
            if (elements.mapGrid.children[domIndex]) {
                elements.mapGrid.children[domIndex].className = 'map-tile soil';
            }
        }
        
        updateMapUI();
    };

    const handleMapMovement = (code: string) => {
        if (mapState.isMoving) return;

        if (mapState.energy <= 0) {
            elements.energyCounter.classList.add('error-flash');
            setTimeout(() => elements.energyCounter.classList.remove('error-flash'), 500);
            return;
        }

        let newX = mapState.playerX;
        let newY = mapState.playerY;

        if (code === 'ArrowUp' || code === 'KeyW') newY--;
        else if (code === 'ArrowDown' || code === 'KeyS') newY++;
        else if (code === 'ArrowLeft' || code === 'KeyA') newX--;
        else if (code === 'ArrowRight' || code === 'KeyD') newX++;

        if (newX !== mapState.playerX || newY !== mapState.playerY) {
            if (newX >= 0 && newX < 7 && newY >= 0 && newY < 7) {
                const targetInstance = mapState.tiles[newY][newX];
                const targetDef = targetInstance ? TILE_DATABASE[targetInstance.tileId] : TILE_DATABASE['soil'];

                mapState.isMoving = true;

                if (targetDef && !targetDef.passable) {
                    // collision! bonk it
                    mapState.energy--;
                    handleTileInteraction(newX, newY);
                    updateMapUI();
                    
                    // visual bounce feedback
                    elements.playerCharacter.classList.add('bonk');
                    setTimeout(() => {
                        elements.playerCharacter.classList.remove('bonk');
                        mapState.isMoving = false;
                    }, 150);
                } else {
                    // move
                    mapState.playerX = newX;
                    mapState.playerY = newY;
                    mapState.energy--;
                    updateMapRender();
                    handleTileInteraction(newX, newY);
                    
                    setTimeout(() => {
                        mapState.isMoving = false;
                    }, 150);
                }
            }
        }
    };

    const showDailyReward = () => {
        if (mapState.dailyClaimed || !elements.dailyModal) return;
        
        elements.dailyTilesContainer.innerHTML = '';
        
        for (let i = 0; i < 3; i++) {
            const rarity = rollRarity();
            const definition = getRandomTileByRarity(rarity);
            
            const btn = document.createElement('div');
            btn.className = 'daily-tile-option';
            btn.title = definition.description;
            
            const preview = document.createElement('div');
            preview.className = `map-tile ${definition.id} tile-preview`;
            
            const name = document.createElement('span');
            name.textContent = definition.name;
            
            const rarSpan = document.createElement('div');
            rarSpan.className = 'rarity-tag ' + definition.rarity.toLowerCase();
            rarSpan.textContent = definition.rarity;

            btn.appendChild(preview);
            btn.appendChild(name);
            btn.appendChild(rarSpan);
            
            btn.addEventListener('click', () => {
                mapState.tileDeck.push(definition.id);
                mapState.dailyClaimed = true;
                updateMapUI();
                elements.dailyModal.classList.add('hidden');
            });
            
            elements.dailyTilesContainer.appendChild(btn);
        }

        elements.dailyModal.classList.remove('hidden');
    };

    // --- Helpers ---
    const resetAnimation = (element: HTMLElement, animationName: string): void => {
        element.style.animation = 'none';
        element.offsetHeight; // trigger reflow
        element.style.animation = animationName;
    };

    init();
});