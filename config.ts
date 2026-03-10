export const CONFIG = {
    // Game Options
    MAX_POKEMON: 1025,
    SHINY_CHANCE: 0.01,
    STARTING_CURRENCY: 500, // Placeholder currency "P" amount
    AUDIO_VOLUME: 0.3, // 30% volume for cries,
    // Ball definitions (price in currency and catch multiplier)
    BALLS: {
        POKEBALL: { price: 100, multiplier: 1.0 },
        GREATBALL: { price: 500, multiplier: 1.5 },
        ULTRABALL: { price: 1200, multiplier: 2.0 },
        MASTERBALL: { price: 0, multiplier: 255 }
    },

    // Location definitions (habitat names from PokeAPI)
    LOCATIONS: [
        { name: 'Forest', habitat: 'forest', minRank: 0 },
        { name: 'Cave', habitat: 'cave', minRank: 0 },
        { name: 'Sea', habitat: 'sea', minRank: 0 },
        { name: 'Mountain', habitat: 'mountain', minRank: 0 }
    ],

    // API Endpoints
    API_BASE_URL: 'https://pokeapi.co/api/v2/pokemon',

    // Animations
    ANIMATIONS: {
        POP_IN_FLOAT: 'popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards, float 4s ease-in-out infinite 0.6s',
        FLOAT: 'float 4s ease-in-out infinite'
    }
};
