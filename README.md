# Random Pokémon Project (Hobby)

> [!IMPORTANT]
> **Project Status**: Free-time hobby project (Active Development)
> **Note for AI Agents**: This project has evolved into a retro 8-bit style Pokémon web application. If you are a new AI agent reading this, please adhere to the architecture and design guidelines below to maintain consistency.

## Architecture & Stack
- **Tech Stack**: Vanilla HTML, CSS, TypeScript bundled with Vite.
- **Config Driven**: All game tuning (Shiny chance, max pokemon, starting currency, animation classes) lives in `config.ts`. Always respect and use `CONFIG` when modifying logic in `script.ts`.
- **Styling**: We are using global CSS (`style.css`).
    - **Font**: "Press Start 2P" (Pixelated retro font).
    - **Borders**: We use a `box-shadow` technique to create 8-bit, hard pixel borders (do not use `border-radius`).
    - **Animations**: Hardware accelerated (`translateZ(0)`, `will-change: transform`) to prevent stuttering with the pixel font.

## Current Features
- **Mystery State**: Initial load displays a bouncing Poké Ball with "???" until the user interacts.
- **Generation**: Clicking "Get Random Pokémon" (or Spacebar) fetches a random Pokémon from PokeAPI.
- **Shiny System**: Configurable chance (default 1%) to roll a shiny variant. Shiny cards have a special golden border and sparkle effects. (Can force via `window.forceShiny = true` in console).
- **Currency System**: Header displays a placeholder "₽" (PokéDollars) pulled from `config.ts`.
- **Responsive UI**: Hover and active states on buttons/cards mimic pixel-art physical buttons.

## Future Vision & Ideas
- **Catching/Gacha**: Spending the "₽" currency to catch or generate Pokémon.
- **Collection**: Storing caught Pokémon in LocalStorage (like a PC Box).
- **Gameplay**: Expanding beyond a generator into a unique browser experience.

*When assisting the user with new features, ensure they fit within the 8-bit aesthetic and utilize `config.ts` for tunable numbers.*
