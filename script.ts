/**
 * Random Pokémon Project - Hobby Phase
 * Entry Point: Coordinates all modules for the Pokémon game.
 */

import { CONFIG } from './config.ts';
import { state } from './state.ts';
import { elements, initElements } from './dom.ts';
import { updateStatusBar } from './ui-shared.ts';
import { populateLocations, populateShop, switchTab, isTabActive } from './ui-main.ts';
import { fetchPokemon, attemptCatch } from './ui-encounter.ts';
import { renderStorage } from './ui-storage.ts';
import { initMapGrid, handleMapMovement, nextDay, showDailyReward } from './ui-map.ts';
import { renderDeckTab, initDeckEvents } from './ui-deck.ts';
import { testBattle } from './ui-battle.ts';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize DOM element Cache
    initElements();

    // 2. Initial Data Population
    const init = () => {
        populateLocations();
        populateShop();
        updateStatusBar();
        setupGlobalEventListeners();
        initMapGrid();
        
        // Initial view
        switchTab('generator-tab');
        renderStorage();
    };

    // 3. Global Event Handlers
    const setupGlobalEventListeners = () => {
        // Tab switching
        elements.tabs.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = (btn as HTMLElement).dataset.tab;
                if (target) {
                    switchTab(target);
                    if (target === 'deck-tab') renderDeckTab();
                }
            });
        });

        // Feature Buttons
        elements.generateBtn.addEventListener('click', fetchPokemon);
        elements.catchBtn.addEventListener('click', attemptCatch);
        
        if (elements.startBattleBtn) {
            elements.startBattleBtn.addEventListener('click', testBattle);
        }

        // Location & Ball Configuration
        elements.locationSelect.addEventListener('change', () => {
            const index = parseInt(elements.locationSelect.value);
            state.location = CONFIG.LOCATIONS[index];
            localStorage.setItem('pkmn_location', state.location.habitat);
            updateStatusBar();
        });

        elements.ballSlots.forEach(slot => {
            slot.addEventListener('click', () => {
                const ball = (slot as HTMLElement).dataset.ball as keyof typeof CONFIG.BALLS;
                if (ball) {
                    state.currentBall = ball;
                    updateStatusBar();
                }
            });
        });

        // PC Storage Pagination
        elements.prevPage.addEventListener('click', () => {
            if (state.currentPage > 1) {
                state.currentPage--;
                renderStorage();
            }
        });
        elements.nextPage.addEventListener('click', () => {
            const maxPage = Math.ceil(state.pcStorage.length / state.itemsPerPage) || 1;
            if (state.currentPage < maxPage) {
                state.currentPage++;
                renderStorage();
            }
        });

        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            if (isTabActive('generator-tab') || isTabActive('map-tab')) {
                if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                    e.preventDefault();
                }
            }

            if (e.code === 'Space' && !elements.generateBtn.disabled && isTabActive('generator-tab')) {
                fetchPokemon();
            }

            if (isTabActive('map-tab')) {
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
                    if (elements.dailyModal && elements.dailyModal.classList.contains('hidden')) {
                        handleMapMovement(e.code);
                    }
                }
            }
        });

        // Map Specific Buttons
        if (elements.sleepBtn) elements.sleepBtn.addEventListener('click', nextDay);
        if (elements.dailyRewardBtn) elements.dailyRewardBtn.addEventListener('click', showDailyReward);
        if (elements.dailySkipBtn) {
            elements.dailySkipBtn.addEventListener('click', () => {
                elements.dailyModal.classList.add('hidden');
            });
        }

        // Deck Events
        initDeckEvents();

        // Global Audio Config
        if (elements.audio) elements.audio.volume = CONFIG.AUDIO_VOLUME;
    };

    // Run Init
    init();
});