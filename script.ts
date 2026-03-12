/**
 * Random Pokémon Project - Hobby Phase
 * Goal: Transform into a unique browser-based Pokémon game.
 */

import { CONFIG } from './config';

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
    currentAbility: null as PokemonAbility | null
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

        // Audio
        audio: document.getElementById('pokemon-cry') as HTMLAudioElement
    };

    // --- Initialization ---
    const init = () => {
        populateLocations();
        populateShop();
        updateStatusBar();
        setupEventListeners();
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
            if (e.code === 'Space' && !elements.generateBtn.disabled && isTabActive('generator-tab')) {
                e.preventDefault();
                fetchPokemon();
            }
        });

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
            }
        }

        if (tabId === 'storage-tab') renderStorage();
    };

    // --- Generator Logic ---
    const fetchIdsForHabitat = async (habitat: string): Promise<number[]> => {
        try {
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon-habitat/${habitat}/`);
            if (!res.ok) throw new Error('Habitat not found');
            const data = await res.json();
            return data.pokemon_species.map((s: any) => {
                const parts = s.url.split('/');
                return parseInt(parts[parts.length - 2]);
            });
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
        elements.catchFeedbackContainer.classList.add('hidden');
        elements.pokemonSprite.classList.add('hidden'); // Hide until loaded

        try {
            const ids = await fetchIdsForHabitat(state.location.habitat);
            const id = ids[Math.floor(Math.random() * ids.length)];

            const response = await fetch(`${CONFIG.API_BASE_URL}/${id}`);
            if (!response.ok) throw new Error('Failed to fetch Pokémon');

            const data = await response.json() as PokemonData;
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
            const res = await fetch(state.currentPokemon.species.url);
            const speciesData = await res.json();
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
                    uuid: crypto.randomUUID(),
                    caughtDate: Date.now(),
                    isShiny: state.currentIsShiny,
                    abilityStatus: state.currentAbility!
                };
                state.pcStorage.unshift(caughtPokemon);
                localStorage.setItem('pkmn_storage', JSON.stringify(state.pcStorage));

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

    // --- Helpers ---
    const resetAnimation = (element: HTMLElement, animationName: string): void => {
        element.style.animation = 'none';
        element.offsetHeight; // trigger reflow
        element.style.animation = animationName;
    };

    init();
});