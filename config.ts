export const CONFIG = {
    // Game Options
    MAX_POKEMON: 1025,
    SHINY_CHANCE: 0.01,
    STARTING_CURRENCY: 500,
    AUDIO_VOLUME: 0.3,
    STARTING_BALLS: 20,
    REWARD_RELEASE: 100, // PokéDollars earned when releasing a Pokémon

    // Defaults (Configurable in code)
    DEFAULT_BALL: 'POKEBALL' as keyof typeof BALL_DEFS,
    DEFAULT_LOCATION: 'forest',

    // Ball definitions
    BALLS: {
        POKEBALL: { name: 'Poké Ball', multiplier: 1.0 },
        GREATBALL: { name: 'Great Ball', multiplier: 1.5 },
        ULTRABALL: { name: 'Ultra Ball', multiplier: 2.0 },
        MASTERBALL: { name: 'Master Ball', multiplier: 255 }
    },

    // Location definitions
    LOCATIONS: [
        { name: 'Viridian Forest', habitat: 'forest', minRank: 0 },
        { name: 'Mt. Moon', habitat: 'cave', minRank: 0 },
        { name: 'Route 21', habitat: 'sea', minRank: 0 },
        { name: 'Victory Road', habitat: 'mountain', minRank: 0 },
        { name: 'Safari Zone', habitat: 'grassland', minRank: 0 }
    ],

    // API Endpoints
    API_BASE_URL: 'https://pokeapi.co/api/v2/pokemon',

    // Animations
    ANIMATIONS: {
        POP_IN_FLOAT: 'popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, float 4s ease-in-out infinite 0.6s',
        FLOAT: 'float 4s ease-in-out infinite'
    }
};

const BALL_DEFS = {
    POKEBALL: { name: 'Poké Ball', multiplier: 1.0 },
    GREATBALL: { name: 'Great Ball', multiplier: 1.5 },
    ULTRABALL: { name: 'Ultra Ball', multiplier: 2.0 },
    MASTERBALL: { name: 'Master Ball', multiplier: 255 }
};

