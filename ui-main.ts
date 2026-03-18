import { CONFIG } from './config';
import { state } from './state';
import { elements } from './dom';
import { renderStorage } from './ui-storage';
import { updateStatusBar } from './ui-shared';


export const populateLocations = () => {
    if (!elements.locationSelect) return;
    elements.locationSelect.innerHTML = '';
    CONFIG.LOCATIONS.forEach((loc, index) => {
        const option = document.createElement('option');
        option.value = index.toString();
        option.textContent = loc.name;
        elements.locationSelect.appendChild(option);
    });

    // Match current state
    const currentIndex = CONFIG.LOCATIONS.findIndex(l => l.name === state.location.name);
    if (currentIndex !== -1) {
        elements.locationSelect.value = currentIndex.toString();
    }
};

export const populateShop = () => {
    if (!elements.shopContainer) return;
    elements.shopContainer.innerHTML = '';

    Object.entries(CONFIG.BALLS).forEach(([key, ball]) => {
        const btn = document.createElement('button');
        btn.className = 'shop-item-btn';
        btn.dataset.ball = key;

        const nameSpan = document.createElement('span');
        nameSpan.className = 'ball-name';
        const quantity = key === 'MASTERBALL' ? 1 : 10;
        nameSpan.textContent = `${ball.name}${quantity > 1 ? ' x' + quantity : ''}`;

        const priceSpan = document.createElement('span');
        priceSpan.className = 'ball-price';
        priceSpan.textContent = `${ball.price >= 1000 ? (ball.price / 1000) + 'K' : ball.price}₽`;

        btn.appendChild(nameSpan);
        btn.appendChild(priceSpan);

        btn.addEventListener('click', () => {
            const ballDef = CONFIG.BALLS[key as keyof typeof CONFIG.BALLS];
            if (ballDef && state.currency >= ballDef.price) {
                state.currency -= ballDef.price;
                state.balls[key] += quantity;
                updateStatusBar();

                btn.classList.add('bought-flash');
                setTimeout(() => btn.classList.remove('bought-flash'), 300);
            } else {
                elements.currency.classList.add('error-flash');
                setTimeout(() => elements.currency.classList.remove('error-flash'), 500);
            }
        });

        elements.shopContainer.appendChild(btn);
    });
};

export const isTabActive = (id: string) => {
    const tab = document.getElementById(id);
    return tab && !tab.classList.contains('hidden');
};

export const switchTab = (tabId: string) => {
    elements.tabContents.forEach(content => {
        content.classList.toggle('hidden', content.id !== tabId);
    });
    elements.tabs.forEach(btn => {
        (btn as HTMLElement).classList.toggle('active', (btn as HTMLElement).dataset.tab === tabId);
    });

    // Update Header
    if (elements.tabHeader) {
        switch (tabId) {
            case 'generator-tab': elements.tabHeader.textContent = 'Encounter'; break;
            case 'storage-tab': elements.tabHeader.textContent = 'PC Storage'; break;
            case 'items-tab': elements.tabHeader.textContent = 'Items'; break;
            case 'map-tab': elements.tabHeader.textContent = 'Map'; break;
            case 'battle-tab': elements.tabHeader.textContent = 'Battle'; break;
            case 'deck-tab': elements.tabHeader.textContent = 'Deck'; break;
        }
    }

    if (tabId === 'storage-tab') renderStorage();
};
