/**
 * Random Pokémon Project - Hobby Phase
 * Goal: Transform into a unique browser-based Pokémon game.
 * Future Ideas: Shiny hunting, collection system, "P" currency.
 * Note: Keep current stable state until ideas are refined.
 */

// Define interfaces for PokeAPI response
interface PokemonType {
    type: {
        name: string;
    }
}

interface PokemonSprites {
    front_default: string | null;
    front_shiny: string | null;
}

interface PokemonAbility {
    is_hidden: boolean;
    ability: {
        name: string;
    }
}

interface PokemonData {
    name: string;
    id: number;
    sprites: PokemonSprites;
    types: PokemonType[];
    cries: {
        latest: string;
        legacy: string;
    };
    abilities: PokemonAbility[];
    species: { name: string; url: string };
}

import { CONFIG } from './config';

// Add a global type extension for window.forceShiny
declare global {
    interface Window {
        forceShiny?: boolean;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generate-btn') as HTMLButtonElement | null;
    const pokemonCard = document.getElementById('pokemon-card') as HTMLElement | null;
    const pokemonSprite = document.getElementById('pokemon-sprite') as HTMLImageElement | null;
    const pokemonName = document.getElementById('pokemon-name') as HTMLElement | null;
    const pokemonId = document.getElementById('pokemon-id') as HTMLElement | null;
    const pokemonTypesContainer = document.getElementById('pokemon-types') as HTMLElement | null;
    const currencyDisplay = document.getElementById('player-currency') as HTMLElement | null;
    const abilityContainer = document.getElementById('pokemon-ability-container') as HTMLElement | null;
    const abilityName = document.getElementById('pokemon-ability') as HTMLElement | null;
    const audioElement = document.getElementById('pokemon-cry') as HTMLAudioElement | null;

    if (!generateBtn || !pokemonCard || !pokemonSprite || !pokemonName || !pokemonId || !pokemonTypesContainer || !currencyDisplay || !abilityContainer || !abilityName || !audioElement) {
        console.error("Missing required DOM elements.");
        return;
    }

    // --- New UI State Variables ---
    let selectedBallKey: keyof typeof CONFIG.BALLS = 'POKEBALL';
    let selectedLocation: { name: string; habitat: string; minRank: number } = CONFIG.LOCATIONS[0];
    const locationSelect = document.getElementById('location-select') as HTMLSelectElement | null;
    const ballTray = document.getElementById('ball-tray') as HTMLElement | null;
    const catchBtn = document.getElementById('catch-btn') as HTMLButtonElement | null;

    // Populate location selector
    if (locationSelect) {
        CONFIG.LOCATIONS.forEach(loc => {
            const opt = document.createElement('option');
            opt.value = loc.habitat;
            opt.textContent = loc.name;
            locationSelect.appendChild(opt);
        });
        locationSelect.addEventListener('change', () => {
            const habitat = locationSelect.value;
            const loc = CONFIG.LOCATIONS.find(l => l.habitat === habitat);
            if (loc) selectedLocation = loc;
        });
    }

    // Populate ball tray
    if (ballTray) {
        Object.entries(CONFIG.BALLS).forEach(([key, ball]) => {
            const btn = document.createElement('button');
            btn.className = 'primary-btn ball-btn';
            btn.textContent = key.replace('BALL', ' Ball');
            btn.dataset.ballKey = key;
            btn.addEventListener('click', () => {
                selectedBallKey = key as keyof typeof CONFIG.BALLS;
                // highlight selected ball
                const all = ballTray.querySelectorAll('.ball-btn');
                all.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
            ballTray.appendChild(btn);
        });
    }

    // Helper to fetch Pokemon IDs for a habitat
    const fetchIdsForHabitat = async (habitat: string): Promise<number[]> => {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon-habitat/${habitat}/`);
        if (!res.ok) throw new Error('Failed habitat fetch');
        const data = await res.json();
        // species array contains objects with name and url
        const ids = data.pokemon_species.map((s: any) => {
            const parts = s.url.split('/');
            return parseInt(parts[parts.length - 2]);
        });
        return ids;
    };

    // Modified getRandomId to respect location
    const getRandomId = async (): Promise<number> => {
        const ids = await fetchIdsForHabitat(selectedLocation.habitat);
        return ids[Math.floor(Math.random() * ids.length)];
    };

    // Catch attempt logic
    const attemptCatch = async (pokemonData: PokemonData) => {
        if (!catchBtn) return;
        // fetch species data for capture_rate
        const speciesRes = await fetch(pokemonData.species?.url ?? `${CONFIG.API_BASE_URL}-species/${pokemonData.id}`);
        const speciesData = await speciesRes.json();
        const baseRate = speciesData.capture_rate as number; // 0-255
        const ball = CONFIG.BALLS[selectedBallKey];
        const chance = (baseRate * ball.multiplier) / 255 * 100;
        const success = Math.random() * 100 < chance;
        if (success) {
            alert(`Caught ${pokemonData.name}! (Ball: ${selectedBallKey})`);
        } else {
            alert(`The ${pokemonData.name} escaped! (Ball: ${selectedBallKey})`);
        }
    };

    // Update UI after fetch to enable catch button
    const finishLoading = (playAudio: boolean = true): void => {
        pokemonCard.classList.remove('fetching');
        generateBtn.disabled = false;
        // enable catch button now that a pokemon is displayed
        if (catchBtn) catchBtn.classList.remove('hidden');
        // Play the cry
        if (playAudio && audioElement && audioElement.src) {
            audioElement.play().catch(e => console.log('Audio play prevented', e));
        }
    };

    // Hook catch button
    if (catchBtn) {
        catchBtn.addEventListener('click', async () => {
            // we need the currently displayed pokemon data; store it globally
            if (currentPokemon) await attemptCatch(currentPokemon);
        });
    }

    // Store the last fetched pokemon for catch attempts
    let currentPokemon: PokemonData | null = null;

    // Modify fetchPokemon to set currentPokemon
    const fetchPokemon = async (): Promise<void> => {
        const id = await getRandomId();
        pokemonCard.classList.add('fetching');
        generateBtn.disabled = true;
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/${id}`);
            if (!response.ok) throw new Error('Failed to fetch Pokémon');
            const data = await response.json() as PokemonData;
            currentPokemon = data;
            const isShiny = window.forceShiny || Math.random() < CONFIG.SHINY_CHANCE;
            const name = data.name;
            const paddedId = data.id.toString().padStart(3, '0');
            const spriteUrl = (isShiny && data.sprites.front_shiny) ? data.sprites.front_shiny : data.sprites.front_default;
            const types = data.types.map(t => t.type.name);
            const randomAbilityStatus = data.abilities[Math.floor(Math.random() * data.abilities.length)];
            const cryUrl = data.cries.legacy || data.cries.latest;
            if (cryUrl && audioElement) audioElement.src = cryUrl;
            if (spriteUrl) {
                const img = new Image();
                img.onload = () => { updateUI(name, paddedId, spriteUrl, types, isShiny, randomAbilityStatus); finishLoading(); };
                img.onerror = () => { updateUI(name, paddedId, null, types, false, randomAbilityStatus); finishLoading(); };
                img.src = spriteUrl;
            } else {
                updateUI(name, paddedId, null, types, false, randomAbilityStatus);
                finishLoading();
            }
        } catch (error) {
            console.error('Error fetching Pokémon:', error);
            if (pokemonName) pokemonName.textContent = '???';
            if (pokemonId) pokemonId.textContent = '???';
            if (pokemonSprite) pokemonSprite.src = '';
            if (pokemonTypesContainer) pokemonTypesContainer.innerHTML = '';
            if (abilityContainer) abilityContainer.classList.add('hidden');
            finishLoading(false);
        }
    };

    // Initial UI setup
    if (locationSelect) locationSelect.value = selectedLocation.habitat;
    // hide catch button until a pokemon appears
    if (catchBtn) catchBtn.classList.add('hidden');

    // Event listeners
    generateBtn.addEventListener('click', fetchPokemon);
    document.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.code === 'Space' && !generateBtn.disabled) {
            e.preventDefault();
            fetchPokemon();
        }
    });
    audioElement.volume = CONFIG.AUDIO_VOLUME;

    // Initialize currency display with mock value
    currencyDisplay.textContent = CONFIG.STARTING_CURRENCY.toLocaleString();

    // Generate a random ID




    // const finishLoading = (playAudio: boolean = true): void => {
    //     pokemonCard.classList.remove('fetching');
    //     generateBtn.disabled = false;

    //     // Add pop effect to the sprite
    //     resetAnimation(pokemonSprite, CONFIG.ANIMATIONS.POP_IN_FLOAT);

    //     // Play the cry
    //     if (playAudio && audioElement && audioElement.src) {
    //         audioElement.play().catch(e => console.log('Audio play prevented', e));
    //     }
    // };

    const updateUI = (name: string, id: string, spriteUrl: string | null, types: string[], isShiny: boolean, abilityStatus: PokemonAbility): void => {
        // Format name (e.g., mr-mime to Mr Mime)
        const formattedName = name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

        // Update basic info and shiny state
        if (isShiny) {
            pokemonName.textContent = `✨ ${formattedName} ✨`;
            pokemonCard.classList.add('shiny');

            // Add sparkles to sprite container if not present
            const spriteContainer = document.querySelector('.sprite-container');
            if (spriteContainer && !spriteContainer.querySelector('.shiny-sparkles-container')) {
                const sparkles = document.createElement('div');
                sparkles.className = 'shiny-sparkles-container';
                sparkles.innerHTML = '<span class="shiny-sparkle">✨</span><span class="shiny-sparkle">✨</span><span class="shiny-sparkle">✨</span>';
                spriteContainer.appendChild(sparkles);
            }
        } else {
            pokemonName.textContent = formattedName;
            pokemonCard.classList.remove('shiny');

            const sparkles = document.querySelector('.shiny-sparkles-container');
            if (sparkles) sparkles.remove();
        }

        pokemonId.textContent = id;

        // Update sprite
        if (spriteUrl) {
            pokemonSprite.src = spriteUrl;
            pokemonSprite.alt = `${formattedName} pixel art sprite`;
        } else {
            pokemonSprite.alt = 'No sprite available';
        }

        // Update types
        pokemonTypesContainer.innerHTML = '';
        types.forEach(type => {
            const typeSpan = document.createElement('span');
            typeSpan.className = `type ${type}`;
            typeSpan.textContent = type;
            pokemonTypesContainer.appendChild(typeSpan);
        });

        // Update Ability
        abilityContainer.classList.remove('hidden');
        abilityName.textContent = abilityStatus.ability.name.replace(/-/g, ' ');
        if (abilityStatus.is_hidden) {
            abilityName.classList.add('hidden-ability');
            abilityName.textContent += ' (Hidden)';
        } else {
            abilityName.classList.remove('hidden-ability');
        }
    };

    // Event listeners
    generateBtn.addEventListener('click', fetchPokemon);

    // Keyboard support (Space to generate)
    document.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.code === 'Space' && !generateBtn.disabled) {
            e.preventDefault(); // Prevent scrolling
            fetchPokemon();
        }
    });

});
