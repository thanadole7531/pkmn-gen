import { CONFIG } from './config';
import { state } from './state';
import { elements } from './dom';
import { fetchIdsForHabitat, fetchPokemonData, fetchSpeciesData } from './api';
import { resetAnimation, formatName } from './utils';
import { CaughtPokemon } from './types';

export const updateUI = () => {
    if (!state.currentPokemon) return;
    const p = state.currentPokemon;
    const nameStr = formatName(p.name);

    elements.pokemonName.textContent = state.currentIsShiny ? `✨ ${nameStr} ✨` : nameStr;
    elements.pokemonId.textContent = p.id.toString().padStart(3, '0');
    elements.pokemonCard.classList.toggle('shiny', state.currentIsShiny);

    const baseUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
    const spriteUrl = state.currentIsShiny
        ? `${baseUrl}/shiny/${p.id}.png`
        : `${baseUrl}/${p.id}.png`;
    elements.pokemonSprite.src = spriteUrl;

    elements.pokemonTypes.innerHTML = '';
    p.types.forEach(t => {
        const span = document.createElement('span');
        span.className = `type ${t.type.name}`;
        span.textContent = t.type.name;
        elements.pokemonTypes.appendChild(span);
    });

    if (state.currentAbility) {
        elements.abilityContainer.classList.remove('hidden');
        elements.abilityName.textContent = formatName(state.currentAbility.ability.name);
        elements.abilityName.classList.toggle('hidden-ability', state.currentAbility.is_hidden);
        if (state.currentAbility.is_hidden) elements.abilityName.textContent += ' (Hidden)';
    } else {
        elements.abilityContainer.classList.add('hidden');
    }
};

export async function fetchPokemon() {
    elements.pokemonCard.classList.add('fetching');
    elements.generateBtn.disabled = true;
    elements.catchBtn.disabled = true;
    
    // Clear all catch/sprite states
    elements.catchFeedbackContainer.classList.add('hidden');
    elements.pokemonSprite.classList.add('hidden');
    elements.pokemonSprite.classList.remove('pokeball-throw', 'pokeball-shake', 'pokeball-catch', 'escape-flash');
    elements.pokemonSprite.style.animation = 'none';
    void elements.pokemonSprite.offsetWidth; // force reflow

    try {
        const ids = await fetchIdsForHabitat(state.location.habitat);
        const id = ids[Math.floor(Math.random() * ids.length)];

        const data = await fetchPokemonData(id);
        state.currentPokemon = data;
        state.currentIsShiny = (window as any).forceShiny || Math.random() < CONFIG.SHINY_CHANCE;
        state.currentAbility = data.abilities[Math.floor(Math.random() * data.abilities.length)];

        // Cry
        const cryUrl = data.cries.legacy || data.cries.latest;
        if (cryUrl && elements.audio) {
            elements.audio.src = cryUrl;
            elements.audio.play().catch(() => { });
        }

        // Wait for image to load
        const baseUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
        const spriteUrl = state.currentIsShiny ? `${baseUrl}/shiny/${id}.png` : `${baseUrl}/${id}.png`;
        
        await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = reject;
            img.src = spriteUrl;
        });

        updateUI();

        setTimeout(() => {
            elements.pokemonCard.classList.remove('fetching');
            elements.pokemonSprite.classList.remove('hidden');
            resetAnimation(elements.pokemonSprite, CONFIG.ANIMATIONS.POP_IN_FLOAT);
            
            const animEls = [
                elements.pokemonId.parentElement,
                elements.pokemonName,
                elements.pokemonTypes,
                elements.abilityContainer
            ];

            animEls.forEach(el => {
                if (el && !el.classList.contains('hidden')) {
                    el.classList.remove('fade-up-text');
                    void el.offsetWidth;
                    el.classList.add('fade-up-text');
                }
            });

            elements.generateBtn.disabled = false;
            elements.catchBtn.disabled = false;
        }, 300);

    } catch (error) {
        console.error('Fetch failed:', error);
        elements.pokemonName.textContent = 'Error';
        elements.generateBtn.disabled = false;
        elements.pokemonCard.classList.remove('fetching');
        elements.catchFeedbackContainer.classList.add('hidden');
    }
}

// updateStatusBar is needed here too, I'll pass it in or import it
// Since updateStatusBar is "Global UI", I'll put it in ui-main.ts or similar.
// For now, I'll assume it's imported.
import { updateStatusBar } from './ui-shared';

export async function attemptCatch() {
    const currentBallCount = state.balls[state.currentBall];
    if (!state.currentPokemon || currentBallCount <= 0) {
        if (currentBallCount <= 0) {
            elements.catchFeedbackContainer.classList.remove('hidden');
            elements.catchFeedback.textContent = 'NO BALLS!';
            elements.catchFeedback.style.color = '#f87171';
            setTimeout(() => {
                elements.catchFeedbackContainer.classList.add('hidden');
            }, 2000);
        }
        return;
    }

    elements.catchBtn.disabled = true;
    elements.generateBtn.disabled = true;
    state.balls[state.currentBall]--;
    updateStatusBar();

    try {
        const speciesData = await fetchSpeciesData(state.currentPokemon.species.url);
        const baseRate = speciesData.capture_rate; // 1-255
        const ballMult = CONFIG.BALLS[state.currentBall].multiplier;

        const maxHp = 100;
        const currentHp = 100;
        const a = ((3 * maxHp - 2 * currentHp) * (baseRate * ballMult)) / (3 * maxHp);
        const catchProbability = a / 255;

        const ballKey = state.currentBall.toLowerCase().replace('ball', '-ball');
        const ballSpriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${ballKey}.png`;

        const originalSpriteUrl = elements.pokemonSprite.src;

        // Step 1: Throw ball
        resetAnimation(elements.pokemonSprite, 'none');
        elements.pokemonSprite.src = ballSpriteUrl;
        elements.pokemonSprite.classList.add('pokeball-throw');

        await new Promise(resolve => setTimeout(resolve, 2000));
        elements.pokemonSprite.classList.remove('pokeball-throw');

        // Logic check
        let shakes = 0;
        if (state.currentBall === 'MASTERBALL' || catchProbability >= 1) {
            shakes = 4;
        } else {
            const b = 1048560 / Math.sqrt(Math.sqrt(16711680 / a));
            for (let i = 0; i < 4; i++) {
                if (Math.floor(Math.random() * 65536) < b) {
                    shakes++;
                } else {
                    break;
                }
            }
        }

        const actualShakes = Math.min(shakes, 3);
        const caught = shakes >= 4;

        for (let i = 0; i < actualShakes; i++) {
            elements.pokemonSprite.classList.add('pokeball-shake');
            resetAnimation(elements.pokemonSprite, 'shakePokeball 0.8s ease-in-out forwards');
            await new Promise(resolve => setTimeout(resolve, 800));
            elements.pokemonSprite.classList.remove('pokeball-shake');
            await new Promise(resolve => setTimeout(resolve, 400));
        }

        elements.catchFeedbackContainer.classList.remove('hidden');

        if (caught) {
            elements.pokemonSprite.classList.add('pokeball-catch');
            elements.catchFeedback.textContent = 'CAUGHT!';
            elements.catchFeedback.style.color = '#4ade80';

            const caughtPokemon: CaughtPokemon = {
                ...state.currentPokemon,
                uuid: (typeof crypto.randomUUID === 'function') 
                    ? crypto.randomUUID() 
                    : Math.random().toString(36).substring(2) + Date.now().toString(36),
                caughtDate: Date.now(),
                isShiny: state.currentIsShiny,
                abilityStatus: state.currentAbility || { is_hidden: false, ability: { name: 'unknown' } }
            };
            
            try {
                state.pcStorage.unshift(caughtPokemon);
                localStorage.setItem('pkmn_storage', JSON.stringify(state.pcStorage));
            } catch (err) {
                console.error('Failed to save PC storage', err);
                elements.catchFeedback.textContent = 'PC FULL!';
                elements.catchFeedback.style.color = '#ef4444';
            }

            setTimeout(() => {
                elements.catchFeedbackContainer.classList.add('hidden');
                elements.pokemonSprite.classList.remove('pokeball-catch');
                fetchPokemon();
            }, 1500);

        } else {
            elements.pokemonSprite.classList.add('escape-flash');
            const fled = Math.random() < (CONFIG.FLEE_CHANCE || 0.15);
            elements.catchFeedback.textContent = fled ? 'ESCAPED!' : 'FAILED!';
            elements.catchFeedback.style.color = '#f87171';

            setTimeout(() => {
                elements.pokemonSprite.classList.remove('escape-flash');
                if (fled) {
                    elements.pokemonSprite.classList.add('hidden');
                    setTimeout(() => {
                        elements.catchFeedbackContainer.classList.add('hidden');
                        fetchPokemon();
                    }, 1500);
                } else {
                    elements.pokemonSprite.src = originalSpriteUrl;
                    resetAnimation(elements.pokemonSprite, CONFIG.ANIMATIONS.FLOAT);
                    setTimeout(() => {
                        elements.catchFeedbackContainer.classList.add('hidden');
                        elements.catchBtn.disabled = false;
                        elements.generateBtn.disabled = false;
                    }, 1500);
                }
            }, 500);
        }

    } catch (e) {
        console.error('Catch failed', e);
        elements.catchBtn.disabled = false;
        elements.generateBtn.disabled = false;
    }
}
