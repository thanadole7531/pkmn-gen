export type TileRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

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
    COMMON: 60,
    RARE: 25,
    EPIC: 12,
    LEGENDARY: 3
};

export const TILE_DATABASE: Record<string, TileDefinition> = {
    // --- COMMON ---
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
    bush: {
        id: 'bush',
        name: 'Berry Bush',
        description: 'A small bush with a few berries. Walk through to pick them.',
        rarity: 'COMMON',
        isConsumable: true,
        maxUses: 1,
        passable: true
    },

    // --- RARE ---
    forest: {
        id: 'forest',
        name: 'Forest',
        description: 'Dense trees blocking the way. Chop them down!',
        rarity: 'RARE',
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
    },

    // --- EPIC ---
    ancient_tree: {
        id: 'ancient_tree',
        name: 'Ancient Tree',
        description: 'A massive ancient tree. Yields rare timber.',
        rarity: 'EPIC',
        isConsumable: true,
        maxUses: 4,
        passable: false,
        resourceType: 'wood'
    },
    crystal_rock: {
        id: 'crystal_rock',
        name: 'Crystal Rock',
        description: 'A glowing rock embedded with crystals.',
        rarity: 'EPIC',
        isConsumable: true,
        maxUses: 5,
        passable: false,
        resourceType: 'stone'
    },

    // --- LEGENDARY ---
    world_tree: {
        id: 'world_tree',
        name: 'World Tree',
        description: 'A legendary tree pulsing with life energy. Extremely valuable.',
        rarity: 'LEGENDARY',
        isConsumable: true,
        maxUses: 6,
        passable: false,
        resourceType: 'wood'
    },
    meteor: {
        id: 'meteor',
        name: 'Fallen Meteor',
        description: 'A smoldering space rock. Contains otherworldly minerals.',
        rarity: 'LEGENDARY',
        isConsumable: true,
        maxUses: 8,
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
    if (roll < RARITY_WEIGHTS.LEGENDARY) return 'LEGENDARY';
    if (roll < RARITY_WEIGHTS.LEGENDARY + RARITY_WEIGHTS.EPIC) return 'EPIC';
    if (roll < RARITY_WEIGHTS.LEGENDARY + RARITY_WEIGHTS.EPIC + RARITY_WEIGHTS.RARE) return 'RARE';
    return 'COMMON';
};
