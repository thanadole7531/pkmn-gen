import { TILE_DATABASE, getRandomTileByRarity, rollRarity } from './tiles.ts';
import { mapState, saveMapState } from './state.ts';
import { elements } from './dom.ts';
import { TileInstance } from './types.ts';
import { triggerBattle } from './ui-battle.ts';
import { renderDeckTab } from './ui-deck.ts';

export const updateMapUI = () => {
    if (elements.dayCounter) elements.dayCounter.textContent = `Day ${mapState.day}`;
    if (elements.energyCounter) {
        elements.energyCounter.textContent = `Energy ${mapState.energy}/${mapState.maxEnergy}`;
        elements.energyCounter.style.color = mapState.energy === 0 ? '#ef4444' : '#fbd34d';
    }
    if (elements.matWood) elements.matWood.textContent = `Wood: ${mapState.wood}`;
    if (elements.matStone) elements.matStone.textContent = `Stone: ${mapState.stone}`;
    if (elements.dailyRewardBtn) {
        elements.dailyRewardBtn.disabled = mapState.dailyClaimed;
    }
};

export const updateMapRender = () => {
    if (elements.playerCharacter) {
        elements.playerCharacter.style.left = `${mapState.playerX * 64}px`;
        elements.playerCharacter.style.top = `${mapState.playerY * 64}px`;
    }
};

export const renderMapGrid = () => {
    if (!elements.mapGrid) return;
    elements.mapGrid.innerHTML = '';
    for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 7; x++) {
            const instance = mapState.tiles[y][x];
            const tileDiv = document.createElement('div');
            tileDiv.className = 'map-tile ' + (instance?.tileId || 'soil');
            tileDiv.dataset.x = x.toString();
            tileDiv.dataset.y = y.toString();
            elements.mapGrid.appendChild(tileDiv);
        }
    }
};

export const generateMap = () => {
    if (!elements.mapGrid) return;

    // 1. Prepare coordinate pool (all except center 3,3)
    const coords: {x: number, y: number}[] = [];
    for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 7; x++) {
            if (!(x === 3 && y === 3)) {
                coords.push({x, y});
            }
        }
    }

    // Shuffle coordinates
    for (let i = coords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [coords[i], coords[j]] = [coords[j], coords[i]];
    }

    // 2. Prepare deck copy
    const deckCopy = [...mapState.tileDeck];
    // Shuffle deck too for good measure
    for (let i = deckCopy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deckCopy[i], deckCopy[j]] = [deckCopy[j], deckCopy[i]];
    }

    // 3. Clear existing deck in state
    mapState.tileDeck = [];

    // 4. Initialize empty grid (mostly soil)
    const grid: (TileInstance | null)[][] = Array.from({ length: 7 }, () => 
        Array.from({ length: 7 }, () => ({ tileId: 'soil', usesLeft: 0 }))
    );

    // 5. Place tiles from deck into shuffled coordinates
    while (deckCopy.length > 0 && coords.length > 0) {
        const tileId = deckCopy.pop()!;
        const {x, y} = coords.pop()!;
        const definition = TILE_DATABASE[tileId];
        grid[y][x] = { 
            tileId, 
            usesLeft: definition ? definition.maxUses : 1 
        };
    }

    mapState.tiles = grid;
    saveMapState();
    renderMapGrid();
    renderDeckTab();
};

export const initMapGrid = () => {
    if (mapState.tiles && mapState.tiles.length > 0) {
        renderMapGrid();
    } else {
        generateMap();
    }
    updateMapRender();
    updateMapUI();
};

export const nextDay = () => {
    // 1. Return non-broken tiles to deck
    if (mapState.tiles) {
        for (let y = 0; y < 7; y++) {
            for (let x = 0; x < 7; x++) {
                const instance = mapState.tiles[y][x];
                if (instance && instance.tileId !== 'soil' && instance.usesLeft > 0) {
                    mapState.tileDeck.push(instance.tileId);
                }
            }
        }
    }

    mapState.day++;
    mapState.energy = mapState.maxEnergy;
    mapState.dailyClaimed = false;
    mapState.playerX = 3;
    mapState.playerY = 3;
    generateMap();
    saveMapState();
    updateMapUI();
    updateMapRender();
    renderDeckTab();
};

export const handleTileInteraction = (x: number, y: number) => {
    const instance = mapState.tiles[y][x];
    if (!instance) return;

    const definition = TILE_DATABASE[instance.tileId];
    if (!definition) return;

    if (definition.resourceType === 'wood') {
        mapState.wood += 1;
        instance.usesLeft--;
    } else if (definition.resourceType === 'stone') {
        mapState.stone += 1;
        instance.usesLeft--;
    } else {
        if (definition.isConsumable) instance.usesLeft--;
    }

    if (definition.battleChance > 0 && Math.random() < definition.battleChance) {
        triggerBattle();
    }

    if (definition.isConsumable && instance.usesLeft <= 0) {
        mapState.tiles[y][x] = { tileId: 'soil', usesLeft: 0 };
        const domIndex = y * 7 + x;
        if (elements.mapGrid.children[domIndex]) {
            elements.mapGrid.children[domIndex].className = 'map-tile soil';
        }
    }
    saveMapState();
    updateMapUI();
};

export const handleMapMovement = (code: string) => {
    if (mapState.isMoving) return;
    if (mapState.energy <= 0) {
        elements.energyCounter.classList.add('error-flash');
        setTimeout(() => elements.energyCounter.classList.remove('error-flash'), 500);
        return;
    }

    let newX = mapState.playerX;
    let newY = mapState.playerY;

    if (code === 'ArrowUp' || code === 'KeyW') newY--;
    else if (code === 'ArrowDown' || code === 'KeyS') newY++;
    else if (code === 'ArrowLeft' || code === 'KeyA') newX--;
    else if (code === 'ArrowRight' || code === 'KeyD') newX++;

    if (newX !== mapState.playerX || newY !== mapState.playerY) {
        if (newX >= 0 && newX < 7 && newY >= 0 && newY < 7) {
            const targetInstance = mapState.tiles[newY][newX];
            const targetDef = targetInstance ? TILE_DATABASE[targetInstance.tileId] : TILE_DATABASE['soil'];

            mapState.isMoving = true;

            if (targetDef && !targetDef.passable) {
                mapState.energy--;
                handleTileInteraction(newX, newY);
                updateMapUI();
                elements.playerCharacter.classList.add('bonk');
                setTimeout(() => {
                    elements.playerCharacter.classList.remove('bonk');
                    mapState.isMoving = false;
                }, 150);
            } else {
                mapState.playerX = newX;
                mapState.playerY = newY;
                mapState.energy--;
                updateMapRender();
                handleTileInteraction(newX, newY);
                saveMapState();
                setTimeout(() => {
                    mapState.isMoving = false;
                }, 150);
            }
        }
    }
};

export const showDailyReward = () => {
    if (mapState.dailyClaimed || !elements.dailyModal) return;
    elements.dailyTilesContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const rarity = rollRarity();
        const definition = getRandomTileByRarity(rarity);
        const btn = document.createElement('div');
        btn.className = 'daily-tile-option';
        btn.title = definition.description;
        const preview = document.createElement('div');
        preview.className = `map-tile ${definition.id} tile-preview`;
        const name = document.createElement('span');
        name.textContent = definition.name;
        const rarSpan = document.createElement('div');
        rarSpan.className = 'rarity-tag ' + definition.rarity.toLowerCase();
        rarSpan.textContent = definition.rarity;
        btn.appendChild(preview);
        btn.appendChild(name);
        btn.appendChild(rarSpan);
        btn.addEventListener('click', () => {
            mapState.tileDeck.push(definition.id);
            mapState.dailyClaimed = true;
            saveMapState();
            updateMapUI();
            elements.dailyModal.classList.add('hidden');
        });
        elements.dailyTilesContainer.appendChild(btn);
    }
    elements.dailyModal.classList.remove('hidden');
};
