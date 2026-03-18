import { state } from './state.ts';
import { elements } from './dom.ts';

export const updateStatusBar = () => {
    if (elements.currency) elements.currency.textContent = state.currency.toLocaleString();

    // Update Ball Counts and Active State
    Object.keys(state.balls).forEach(ballKey => {
        const countEl = document.getElementById(`count-${ballKey}`);
        if (countEl) {
            countEl.textContent = state.balls[ballKey].toString();
        }
    });

    if (elements.ballSlots) {
        elements.ballSlots.forEach(slot => {
            const ball = (slot as HTMLElement).dataset.ball;
            slot.classList.toggle('active', ball === state.currentBall);
        });
    }

    localStorage.setItem('pkmn_currency', state.currency.toString());
    localStorage.setItem('pkmn_balls', JSON.stringify(state.balls));
    localStorage.setItem('pkmn_current_ball', state.currentBall);
};
