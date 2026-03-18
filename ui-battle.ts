import { CONFIG } from './config.ts';
import { elements } from './dom.ts';
import { PokemonData } from './types.ts';

export const triggerBattle = () => {
    console.log('[BATTLE] Wild Pokémon encounter triggered!');
    const battleAudio = new Audio('https://play.pokemonshowdown.com/audio/xyintro.mp3');
    battleAudio.volume = 0.2;
    battleAudio.play().catch(() => {});
    const battleTabBtn = document.querySelector('[data-tab="battle-tab"]') as HTMLButtonElement | null;
    if (battleTabBtn) battleTabBtn.click();
};

export async function testBattle() {
    if (!elements.startBattleBtn) return;
    elements.startBattleBtn.disabled = true;
    
    try {
        const enemyId = Math.floor(Math.random() * CONFIG.MAX_POKEMON) + 1;
        const playerId = Math.floor(Math.random() * CONFIG.MAX_POKEMON) + 1;
        
        const [enemyRes, playerRes] = await Promise.all([
            fetch(`${CONFIG.API_BASE_URL}/${enemyId}`),
            fetch(`${CONFIG.API_BASE_URL}/${playerId}`)
        ]);
        
        if (!enemyRes.ok || !playerRes.ok) throw new Error('Failed to fetch battle pokemon');
        
        const enemyData: PokemonData = await enemyRes.json();
        const playerData: PokemonData = await playerRes.json();
        
        elements.enemyName.textContent = enemyData.name.replace(/-/g, ' ');
        elements.playerName.textContent = playerData.name.replace(/-/g, ' ');

        const enemyHpStat = enemyData.stats.find(s => s.stat.name === 'hp')?.base_stat || 100;
        const playerHpStat = playerData.stats.find(s => s.stat.name === 'hp')?.base_stat || 100;
        const enemyMaxHp = Math.floor(0.01 * (2 * enemyHpStat + 31 + Math.floor(0.25 * 252)) * 50) + 50 + 10;
        const playerMaxHp = Math.floor(0.01 * (2 * playerHpStat + 31 + Math.floor(0.25 * 252)) * 50) + 50 + 10;

        if (elements.enemyHpText) elements.enemyHpText.textContent = `${enemyMaxHp}/${enemyMaxHp}`;
        if (elements.playerHpText) elements.playerHpText.textContent = `${playerMaxHp}/${playerMaxHp}`;

        const baseUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
        elements.enemySprite.src = `${baseUrl}/${enemyId}.png`;
        elements.playerSprite.src = `${baseUrl}/${playerId}.png`;
            
        elements.enemyHp.style.width = '100%';
        elements.playerHp.style.width = '100%';
        
        const debuffArea = document.getElementById('enemy-debuffs');
        if (debuffArea) {
            debuffArea.innerHTML = '<span class="debuff-icon" style="background: #a855f7;">PSN</span>';
        }
    } catch (error) {
        console.error('Test battle failed:', error);
        elements.enemyName.textContent = 'Error';
        elements.playerName.textContent = 'Error';
    } finally {
        elements.startBattleBtn.disabled = false;
    }
}
