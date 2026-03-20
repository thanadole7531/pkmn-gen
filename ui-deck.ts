import { mapState } from './state.ts';
import { TILE_DATABASE } from './tiles.ts';

let deckPage = 1;
const DECK_PER_PAGE = 9;

export const renderDeckTab = () => {
    const deckGrid = document.getElementById('deck-grid');
    const deckPageInfo = document.getElementById('deck-page-info');
    const deckCountLabel = document.getElementById('deck-count-label');
    const deckPrev = document.getElementById('deck-prev') as HTMLButtonElement | null;
    const deckNext = document.getElementById('deck-next') as HTMLButtonElement | null;
    if (!deckGrid) return;

    const counts: Record<string, number> = {};
    
    // Count tiles in deck
    for (const id of mapState.tileDeck) {
        counts[id] = (counts[id] || 0) + 1;
    }

    // Count tiles on board
    if (mapState.tiles) {
        for (let y = 0; y < 7; y++) {
            for (let x = 0; x < 7; x++) {
                const instance = mapState.tiles[y][x];
                if (instance && instance.tileId !== 'soil') {
                    counts[instance.tileId] = (counts[instance.tileId] || 0) + 1;
                }
            }
        }
    }

    const totalOwned = Object.values(counts).reduce((a, b) => a + b, 0);

    const uniqueEntries = Object.keys(counts);
    const totalPages = Math.max(1, Math.ceil(uniqueEntries.length / DECK_PER_PAGE));
    if (deckPage > totalPages) deckPage = totalPages;
    
    const start = (deckPage - 1) * DECK_PER_PAGE;
    const pageEntries = uniqueEntries.slice(start, start + DECK_PER_PAGE);

    if (deckCountLabel) {
        deckCountLabel.textContent = `${totalOwned} total tile${totalOwned !== 1 ? 's' : ''} (${uniqueEntries.length} unique)`;
    }
    if (deckPageInfo) deckPageInfo.textContent = `Page ${deckPage} / ${totalPages}`;
    if (deckPrev) deckPrev.disabled = deckPage <= 1;
    if (deckNext) deckNext.disabled = deckPage >= totalPages;

    deckGrid.innerHTML = '';
    if (uniqueEntries.length === 0) {
        deckGrid.innerHTML = '<div class="deck-empty">No tiles collected yet.<br>Claim daily rewards to fill your deck!</div>';
        return;
    }

    for (const tileId of pageEntries) {
        const def = TILE_DATABASE[tileId];
        if (!def) continue;

        const card = document.createElement('div');
        card.className = 'deck-card';

        const spriteWrapper = document.createElement('div');
        spriteWrapper.className = 'deck-sprite-wrapper';
        const sprite = document.createElement('div');
        sprite.className = `map-tile deck-sprite ${tileId}`;
        const countBadge = document.createElement('div');
        countBadge.className = 'deck-count-badge';
        countBadge.textContent = `×${counts[tileId]}`;
        spriteWrapper.appendChild(sprite);
        spriteWrapper.appendChild(countBadge);

        const nameEl = document.createElement('div');
        nameEl.className = 'deck-tile-name';
        nameEl.textContent = def.name;

        const rarEl = document.createElement('div');
        rarEl.className = `rarity-tag ${def.rarity.toLowerCase()}`;
        rarEl.textContent = def.rarity;

        const battleEl = document.createElement('div');
        battleEl.className = 'deck-battle-chance';
        const pct = Math.round(def.battleChance * 100);
        battleEl.textContent = pct > 0 ? `⚔ ${pct}% encounter` : '⚔ No encounter';
        battleEl.style.color = pct >= 40 ? '#ef4444' : pct >= 20 ? '#f97316' : '#94a3b8';

        card.appendChild(spriteWrapper);
        card.appendChild(nameEl);
        card.appendChild(rarEl);
        card.appendChild(battleEl);
        deckGrid.appendChild(card);
    }
};

export const initDeckEvents = () => {
    document.getElementById('deck-prev')?.addEventListener('click', () => {
        if (deckPage > 1) { deckPage--; renderDeckTab(); }
    });
    document.getElementById('deck-next')?.addEventListener('click', () => {
        deckPage++; renderDeckTab();
    });
};
