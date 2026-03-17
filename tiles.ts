export type TileRarity = 'COMMON' | 'RARE' | 'EPIC';

export interface TileDefinition {
    id: string;
    name: string;
    description: string;
    rarity: TileRarity;
    isConsumable: boolean;
    maxUses: number;
    passable: boolean;
    resourceType?: 'wood' | 'stone';
}

export const RARITY_WEIGHTS: Record<TileRarity, number> = {
    COMMON: 70,
    RARE: 25,
    EPIC: 5
};

export const TILE_DATABASE: Record<string, TileDefinition> = {
    soil: {
        id: 'soil',
        name: 'Soil',
        description: 'Dry, empty ground. Nothing here.',
        rarity: 'COMMON',
        isConsumable: false,
        maxUses: 0,
        passable: true
    },
    grass: {
        id: 'grass',
        name: 'Grass',
        description: 'Tall swaying grass. Might hide something.',
        rarity: 'COMMON',
        isConsumable: true,
        maxUses: 1,
        passable: true
    },
    forest: {
        id: 'forest',
        name: 'Forest',
        description: 'Dense trees blocking the way. Chop them down!',
        rarity: 'COMMON',
        isConsumable: true,
        maxUses: 2,
        passable: false,
        resourceType: 'wood'
    },
    rock: {
        id: 'rock',
        name: 'Rock',
        description: 'Hard stones. Use some force to break.',
        rarity: 'RARE',
        isConsumable: true,
        maxUses: 3,
        passable: false,
        resourceType: 'stone'
    }
};

export const getRandomTileByRarity = (rarity: TileRarity): TileDefinition => {
    const pool = Object.values(TILE_DATABASE).filter(t => t.rarity === rarity);
    if (pool.length === 0) return TILE_DATABASE['soil']; // Fallback
    return pool[Math.floor(Math.random() * pool.length)];
};

export const rollRarity = (): TileRarity => {
    const roll = Math.random() * 100;
    if (roll < RARITY_WEIGHTS.EPIC) return 'EPIC';
    if (roll < RARITY_WEIGHTS.EPIC + RARITY_WEIGHTS.RARE) return 'RARE';
    return 'COMMON';
};
