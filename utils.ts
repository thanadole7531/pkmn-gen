/**
 * Utility functions for the Pokémon project
 */

export const resetAnimation = (element: HTMLElement, animationName: string): void => {
    if (!element) return;
    element.style.animation = 'none';
    element.offsetHeight; // trigger reflow
    element.style.animation = animationName;
};

export const formatName = (name: string): string => {
    return name.replace(/-/g, ' ');
};
