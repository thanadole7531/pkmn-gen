import { CONFIG } from './config';
import { state } from './state';
import { elements } from './dom';
import { updateStatusBar } from './ui-shared';

export const renderStorage = () => {
    if (!elements.storageGrid) return;
    elements.storageGrid.innerHTML = '';
    const start = (state.currentPage - 1) * state.itemsPerPage;
    const end = start + state.itemsPerPage;
    const pageItems = state.pcStorage.slice(start, end);

    pageItems.forEach(pkmn => {
        const item = document.createElement('div');
        const isShiny = pkmn.isShiny === true;

        item.className = 'storage-item';
        if (isShiny) item.classList.add('shiny-item');

        const img = document.createElement('img');
        const baseUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
        img.src = isShiny
            ? `${baseUrl}/shiny/${pkmn.id}.png`
            : `${baseUrl}/${pkmn.id}.png`;

        const name = document.createElement('span');
        name.className = 'name';
        name.textContent = pkmn.name;

        const relBtn = document.createElement('button');
        relBtn.className = 'release-btn';
        relBtn.textContent = 'REL';
        relBtn.onclick = (e) => {
            e.stopPropagation();
            releasePokemon(pkmn.uuid);
        };

        item.appendChild(img);
        item.appendChild(name);
        item.appendChild(relBtn);
        elements.storageGrid.appendChild(item);
    });

    const maxPage = Math.ceil(state.pcStorage.length / state.itemsPerPage) || 1;
    if (elements.pageInfo) elements.pageInfo.textContent = `Page ${state.currentPage} / ${maxPage}`;
    if (elements.prevPage) elements.prevPage.disabled = state.currentPage === 1;
    if (elements.nextPage) elements.nextPage.disabled = state.currentPage === maxPage;
};

export const releasePokemon = (uuid: string) => {
    const index = state.pcStorage.findIndex(p => p.uuid === uuid);
    if (index !== -1) {
        const pkmn = state.pcStorage[index];
        const multiplier = pkmn.isShiny ? (CONFIG.SHINY_RELEASE_MULTIPLIER || 100) : 1;
        const reward = CONFIG.REWARD_RELEASE * multiplier;

        state.pcStorage.splice(index, 1);
        state.currency += reward;
        localStorage.setItem('pkmn_storage', JSON.stringify(state.pcStorage));
        updateStatusBar();
        renderStorage();
    }
};
