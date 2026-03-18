import { CONFIG } from './config';

// --- Pokémon Interfaces ---
export interface PokemonType {
    type: { name: string; };
}

export interface PokemonSprites {
    front_default: string | null;
    front_shiny: string | null;
}

export interface PokemonAbility {
    is_hidden: boolean;
    ability: { name: string; };
}

export interface PokemonData {
    name: string;
    id: number;
    sprites: PokemonSprites;
    types: PokemonType[];
    cries: { latest: string; legacy: string; };
    abilities: PokemonAbility[];
    species: { name: string; url: string; };
    stats: { base_stat: number; stat: { name: string; }; }[];
}

export interface CaughtPokemon extends PokemonData {
    uuid: string;
    caughtDate: number;
    isShiny: boolean;
    abilityStatus: PokemonAbility;
}

// --- Map & Tile Interfaces ---
export interface TileInstance {
    tileId: string;
    usesLeft: number;
}

export interface MapState {
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

// --- Global State Interface ---
export interface GlobalState {
    currency: number;
    balls: Record<string, number>;
    currentBall: keyof typeof CONFIG.BALLS;
    location: (typeof CONFIG.LOCATIONS)[0];
    pcStorage: CaughtPokemon[];
    currentPage: number;
    itemsPerPage: number;
    currentPokemon: PokemonData | null;
    currentIsShiny: boolean;
    currentAbility: PokemonAbility | null;
    cache: {
        habitats: Record<string, number[]>;
        pokemon: Record<number, PokemonData>;
        species: Record<string, any>;
    };
}
