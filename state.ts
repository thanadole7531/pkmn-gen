import { CONFIG } from './config.ts';
import { GlobalState, MapState, CaughtPokemon } from './types.ts';

// --- Global State ---
const savedBalls = localStorage.getItem('pkmn_balls');
let initialBalls: Record<string, number>;
try {
    const parsed = JSON.parse(savedBalls || 'null');
    if (parsed && typeof parsed === 'object') {
        initialBalls = parsed;
    } else {
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

export const state: GlobalState = {
    currency: Number(localStorage.getItem('pkmn_currency')) || CONFIG.STARTING_CURRENCY,
    balls: initialBalls,
    currentBall: (localStorage.getItem('pkmn_current_ball') as keyof typeof CONFIG.BALLS) || CONFIG.DEFAULT_BALL,
    location: CONFIG.LOCATIONS.find(l => l.habitat === (localStorage.getItem('pkmn_location') || CONFIG.DEFAULT_LOCATION)) || CONFIG.LOCATIONS[0],
    pcStorage: JSON.parse(localStorage.getItem('pkmn_storage') || '[]') as CaughtPokemon[],
    currentPage: 1,
    itemsPerPage: 9,
    currentPokemon: null,
    currentIsShiny: false,
    currentAbility: null,
    cache: {
        habitats: JSON.parse(localStorage.getItem('pkmn_cache_habitats') || '{}'),
        pokemon: JSON.parse(localStorage.getItem('pkmn_cache_pokemon') || '{}'),
        species: JSON.parse(localStorage.getItem('pkmn_cache_species') || '{}')
    }
};

// --- Map State & Starting Deck ---
export const STARTING_DECK = [
    'grass', 'grass', 'grass', 'grass', 'grass', 'grass',
    'bush', 'bush', 'bush', 'bush',
    'forest', 'forest', 'forest',
    'rock', 'rock'
];

const savedMapState = localStorage.getItem('pkmn_map_state');
let initialMapState: MapState;

try {
    const parsed = JSON.parse(savedMapState || 'null');
    if (parsed && typeof parsed === 'object') {
        initialMapState = {
            ...parsed,
            isMoving: false // Reset movement flag on load
        };
        // Handle legacy saves: If they have no deck OR an empty deck, reset to starting conditions
        if (!initialMapState.tileDeck || initialMapState.tileDeck.length === 0) {
            initialMapState.tileDeck = [...STARTING_DECK];
            initialMapState.tiles = []; // This will trigger generateMap() in initMapGrid()
            initialMapState.day = 1;
            initialMapState.energy = 10;
        }
        
        if (!initialMapState.tiles) initialMapState.tiles = [];
    } else {
        initialMapState = {
            playerX: 3,
            playerY: 3,
            day: 1,
            energy: 10,
            maxEnergy: 10,
            wood: 0,
            stone: 0,
            dailyClaimed: false,
            isMoving: false,
            tiles: [],
            tileDeck: [...STARTING_DECK]
        };
    }
} catch (e) {
    initialMapState = {
        playerX: 3,
        playerY: 3,
        day: 1,
        energy: 10,
        maxEnergy: 10,
        wood: 0,
        stone: 0,
        dailyClaimed: false,
        isMoving: false,
        tiles: [],
        tileDeck: [...STARTING_DECK]
    };
}

export const mapState: MapState = initialMapState;

export const saveMapState = () => {
    localStorage.setItem('pkmn_map_state', JSON.stringify(mapState));
};

export const saveCacheToStorage = () => {
    try {
        const prune = (obj: Record<any, any>, limit: number) => {
            const keys = Object.keys(obj);
            if (keys.length > limit) {
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
        if (e instanceof Error && e.name === 'QuotaExceededError') {
            state.cache.habitats = {};
            state.cache.pokemon = {};
            state.cache.species = {};
        }
    }
};
