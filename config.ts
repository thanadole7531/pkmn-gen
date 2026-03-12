export const CONFIG = {
    // Game Options
    MAX_POKEMON: 1025,
    SHINY_CHANCE: 1 / 100,
    STARTING_CURRENCY: 500,
    AUDIO_VOLUME: 0.3,
    STARTING_BALLS: {
        POKEBALL: 20,
        GREATBALL: 0,
        ULTRABALL: 0,
        MASTERBALL: 0
    },
    REWARD_RELEASE: 300, // PokéDollars earned when releasing a Pokémon
    SHINY_RELEASE_MULTIPLIER: 50, // Multiplier for releasing a shiny Pokémon
    FLEE_CHANCE: 0.15, // 15% chance to flee on failed catch

    // Defaults (Configurable in code)
    DEFAULT_BALL: 'POKEBALL' as keyof typeof BALL_DEFS,
    DEFAULT_LOCATION: 'cave',

    // Ball definitions
    BALLS: {
        POKEBALL: { name: 'Poké Ball', multiplier: 2.0, price: 100 },
        GREATBALL: { name: 'Great Ball', multiplier: 2.5, price: 250 },
        ULTRABALL: { name: 'Ultra Ball', multiplier: 3, price: 500 },
        MASTERBALL: { name: 'Master Ball', multiplier: 255.0, price: 5000 }
    },

    // Location definitions
    LOCATIONS: [
        { name: 'Viridian Forest', habitat: 'forest', minRank: 0 },
        { name: 'Mt. Moon', habitat: 'cave', minRank: 0 },
        { name: 'Route 21', habitat: 'sea', minRank: 0 },
        { name: 'Victory Road', habitat: 'mountain', minRank: 0 },
        { name: 'Safari Zone', habitat: 'grassland', minRank: 0 },
        { name: 'Seafoam Islands', habitat: 'sea', minRank: 0 },
        { name: 'Cinnabar Island', habitat: 'sea', minRank: 0 },
        { name: 'Cerulean Cave', habitat: 'cave', minRank: 0 },
        { name: 'Berry Forest', habitat: 'forest', minRank: 0 },
        { name: 'Jagged Pass', habitat: 'mountain', minRank: 0 }
    ],

    // API Endpoints
    API_BASE_URL: 'https://pokeapi.co/api/v2/pokemon',

    // Animations
    ANIMATIONS: {
        POP_IN_FLOAT: 'popIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, float 4s ease-in-out infinite 0.8s',
        FLOAT: 'float 4s ease-in-out infinite'
    }
};

const BALL_DEFS = {
    POKEBALL: { name: 'Poké Ball', multiplier: 2.0 },
    GREATBALL: { name: 'Great Ball', multiplier: 2.5 },
    ULTRABALL: { name: 'Ultra Ball', multiplier: 3.0 },
    MASTERBALL: { name: 'Master Ball', multiplier: 255 }
};