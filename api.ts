import { CONFIG } from './config.ts';
import { PokemonData } from './types.ts';
import { state, saveCacheToStorage } from './state.ts';

export const fetchIdsForHabitat = async (habitat: string): Promise<number[]> => {
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
        return Array.from({ length: 10 }, () => Math.floor(Math.random() * CONFIG.MAX_POKEMON) + 1);
    }
};

export const fetchPokemonData = async (id: number): Promise<PokemonData> => {
    if (state.cache.pokemon[id]) {
        return state.cache.pokemon[id];
    }
    const response = await fetch(`${CONFIG.API_BASE_URL}/${id}`);
    if (!response.ok) throw new Error('Failed to fetch Pokémon');
    const data = await response.json() as PokemonData;
    state.cache.pokemon[id] = data;
    saveCacheToStorage();
    return data;
};

export const fetchSpeciesData = async (url: string): Promise<any> => {
    if (state.cache.species[url]) {
        return state.cache.species[url];
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch Species');
    const data = await res.json();
    state.cache.species[url] = data;
    saveCacheToStorage();
    return data;
};
