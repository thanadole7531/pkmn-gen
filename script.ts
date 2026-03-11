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
const state = {
    currency: Number(localStorage.getItem('pkmn_currency')) || CONFIG.STARTING_CURRENCY,
    balls: Number(localStorage.getItem('pkmn_balls')) || CONFIG.STARTING_BALLS,
    location: CONFIG.LOCATIONS.find(l => l.habitat === CONFIG.DEFAULT_LOCATION) || CONFIG.LOCATIONS[0],
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
        location: document.getElementById('current-location') as HTMLElement,
        ballName: document.getElementById('current-ball-name') as HTMLElement,
        ballCount: document.getElementById('ball-count') as HTMLElement,

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
        updateStatusBar();
        setupEventListeners();
        switchTab('generator-tab');
        renderStorage();
    };

    const updateStatusBar = () => {
        if (elements.currency) elements.currency.textContent = state.currency.toLocaleString();
        if (elements.location) elements.location.textContent = state.location.name;
        if (elements.ballName) elements.ballName.textContent = CONFIG.BALLS[CONFIG.DEFAULT_BALL].name;
        if (elements.ballCount) elements.ballCount.textContent = state.balls.toString();

        localStorage.setItem('pkmn_currency', state.currency.toString());
        localStorage.setItem('pkmn_balls', state.balls.toString());
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

            const img = new Image();
            img.onload = () => {
                updateUI();

                // Small artificial delay for "Who's That Pokemon" feels + stability
                setTimeout(() => {
                    elements.pokemonSprite.classList.remove('hidden');
                    resetAnimation(elements.pokemonSprite, CONFIG.ANIMATIONS.POP_IN_FLOAT);
                    elements.generateBtn.disabled = false;
                    elements.catchBtn.disabled = false;
                }, 500);
            };
            img.src = spriteUrl;

            // Cry
            const cryUrl = data.cries.legacy || data.cries.latest;
            if (cryUrl && elements.audio) {
                elements.audio.src = cryUrl;
                elements.audio.play().catch(() => { });
            }

        } catch (error) {
            console.error('Fetch failed:', error);
            elements.pokemonName.textContent = 'Error';
            elements.generateBtn.disabled = false;
        } finally {
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
        }
    };

    async function attemptCatch() {
        if (!state.currentPokemon || state.balls <= 0) {
            if (state.balls <= 0) {
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
        state.balls--;
        updateStatusBar();

        try {
            const res = await fetch(state.currentPokemon.species.url);
            const speciesData = await res.json();
            const baseRate = speciesData.capture_rate;
            const ballMult = CONFIG.BALLS[CONFIG.DEFAULT_BALL].multiplier;

            const chance = (baseRate * ballMult) / 255;
            const success = Math.random() < chance;

            // Feedback
            elements.pokemonSprite.classList.add('hidden');
            elements.catchFeedbackContainer.classList.remove('hidden');
            elements.catchFeedback.textContent = success ? 'CAUGHT!' : 'ESCAPED!';
            elements.catchFeedback.style.color = success ? '#4ade80' : '#f87171';

            if (success) {
                const caught: CaughtPokemon = {
                    ...state.currentPokemon,
                    uuid: crypto.randomUUID(),
                    caughtDate: Date.now(),
                    isShiny: state.currentIsShiny,
                    abilityStatus: state.currentAbility!
                };
                state.pcStorage.unshift(caught); // Add to start
                localStorage.setItem('pkmn_storage', JSON.stringify(state.pcStorage));
            }

            // Auto-next after 1.5s
            setTimeout(() => {
                elements.catchFeedbackContainer.classList.add('hidden');
                fetchPokemon();
            }, 1500);

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
            name.textContent = isShiny ? `✨ ${pkmn.name}` : pkmn.name;

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
            state.pcStorage.splice(index, 1);
            state.currency += CONFIG.REWARD_RELEASE;
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