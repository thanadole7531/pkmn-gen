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

    // Set audio volume from configuration
    audioElement.volume = CONFIG.AUDIO_VOLUME;

    // Initialize currency display with mock value
    currencyDisplay.textContent = CONFIG.STARTING_CURRENCY.toLocaleString();

    // Generate a random ID
    const getRandomId = (): number => Math.floor(Math.random() * CONFIG.MAX_POKEMON) + 1;
    
    // Play a distinct animation when resetting
    const resetAnimation = (element: HTMLElement, animationName: string): void => {
        element.style.animation = 'none';
        element.offsetHeight; // trigger reflow
        element.style.animation = animationName;
    };
    
    // Fetch Pokemon Data from PokeAPI
    const fetchPokemon = async (): Promise<void> => {
        const id = getRandomId();
        
        // Add loading state
        pokemonCard.classList.add('fetching');
        generateBtn.disabled = true;
        
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/${id}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch Pokémon');
            }
            
            const data = await response.json() as PokemonData;
            
            // based on config chance, or forced via console for testing
            const isShiny = window.forceShiny || Math.random() < CONFIG.SHINY_CHANCE;
            
            // Extract necessary data
            const name = data.name;
            const paddedId = data.id.toString().padStart(3, '0');
            // Using front_shiny if rolled, else front_default for the pixel art aesthetic
            const spriteUrl = (isShiny && data.sprites.front_shiny) ? data.sprites.front_shiny : data.sprites.front_default;
            
            const types = data.types.map(typeInfo => typeInfo.type.name);
            
            // Get random ability from the pokemon's pool
            const randomAbilityStatus = data.abilities[Math.floor(Math.random() * data.abilities.length)];
            
            // Set up audio (using legacy if available for retro feel, else latest)
            const cryUrl = data.cries.legacy || data.cries.latest;
            if (cryUrl && audioElement) {
                audioElement.src = cryUrl;
            }
            
            // Preload image before updating UI entirely
            if (spriteUrl) {
                const img = new Image();
                img.onload = () => {
                    updateUI(name, paddedId, spriteUrl, types, isShiny, randomAbilityStatus);
                    finishLoading();
                };
                img.onerror = () => {
                    updateUI(name, paddedId, null, types, false, randomAbilityStatus);
                    finishLoading();
                };
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
    
    const finishLoading = (playAudio: boolean = true): void => {
        pokemonCard.classList.remove('fetching');
        generateBtn.disabled = false;
        
        // Add pop effect to the sprite
        resetAnimation(pokemonSprite, CONFIG.ANIMATIONS.POP_IN_FLOAT);
        
        // Play the cry
        if (playAudio && audioElement && audioElement.src) {
            audioElement.play().catch(e => console.log('Audio play prevented', e));
        }
    };
    
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
