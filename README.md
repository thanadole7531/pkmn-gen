# Random Pokémon Project (Hobby)

> [!IMPORTANT]
> **Project Status**: Free-time hobby project (Active Development)
> **Note for AI Agents**: This project has evolved into a retro 8-bit style Pokémon web application. If you are a new AI agent reading this, please adhere to the architecture and design guidelines below to maintain consistency.

## Architecture & Stack
- **Tech Stack**: Vanilla HTML, CSS, TypeScript bundled with Vite.
- **Config Driven**: All game tuning (`SHINY_CHANCE`, math multipliers for catching, release rewards, starting balls, animation definitions) lives in `config.ts`. Always respect and use `CONFIG` when modifying logic in `script.ts`.
- **Styling**: We are using global CSS (`style.css`).
    - **Font**: "Press Start 2P" (Pixelated retro font).
    - **Borders**: We use a `box-shadow` technique to create 8-bit, hard pixel borders. Do not use `border-radius` (except where strictly necessary for circular graphics).
    - **Animations**: Hardware accelerated (`translateZ(0)`, `will-change: transform`) where possible. Complex chained CSS animations are used for smooth UI (e.g., throwing a pokeball, shiny sparkles, text fade-ups, popping sprites).

## Current Features
- **Exploration & Generation**: Clicking "Find Next" (or Spacebar) fetches a random Pokémon from the PokeAPI based on the currently selected `Location` habitat (e.g., Cave, Sea, Forest).
- **Encounter UI**: 
    - Smooth orchestrated loading sequence: A visually masked loading state (`.fetching`) waits for sprites to be fully fetched and then sequentially reveals the Pokémon graphics (with a `popIn` visual bounce) followed by an orchestrated `fade-up-text` reveal of details.
    - Constant layout dimensions lock the card height (`550px`) and maximum width (`600px`) to comfortably handle the longest dynamic string lengths without UI distortion or leaping bounds.
- **Shiny System**: Configurable chance (default 1.25%) to roll a shiny variant. Shiny cards have a special golden border and sparkle animations. (Can force via `window.forceShiny = true` in browser console).
- **Pokemon Sounds and Traits**: Plays the authentic legacy or latest Pokémon audio cry from the API when generated. Grabs natively fetched abilities (pink highlights for Hidden abilities).
- **Catching Mechanic**: 
    - Using backend ball mechanics with formulaic shake and escape probability based on ball multipliers defined in `config.ts`.
    - Four animated shaking sequences visually match the backend catch logic.
    - The player manages an active inventory of Poké Balls, Great Balls, Ultra Balls, and Master Balls on the bottom left overlay.
    - Failing a catch natively invokes a Pokémon fleeing chance calculation.
- **Currency & Shop**: Header displays a placeholder "₽" (PokéDollars) pulled from Local Storage. Players use this to dynamically buy Pokéballs from the Pokémart shop overlay. 
- **PC Storage System**: Caught Pokémon are saved uniquely with UUIDs and displayed on a paginated grid system in the "PC Storage" tab. Retains shiny status permanently via Local Storage caching.
- **Economy Loop**: Releasing a saved Pokémon via the UI yields `REWARD_RELEASE` PokéDollars. Releasing a shiny Pokémon generously applies the `SHINY_RELEASE_MULTIPLIER` for a massive cash payout to fund further captures.

## Development Guide for AI Agents
1. **Always edit `style.css` for visual UI updates.** Maintain the pseudo-3D pixel art drop shadows (`box-shadow`, `-4px 0 0 0`, etc). 
2. Ensure you strictly read existing `.hidden` or opacity-modifying `.fetching` CSS masking styles. Animation synchronization is delicate and deliberately ordered (e.g., `script.ts` waits for images to load, removes masking classes, and manually triggers reflows with `void el.offsetWidth` before triggering the fade-ups).
3. Keep all text layouts responsive using `word-break: break-word` and large padding limits in the main containers. Let bounding box spaces overflow cleanly rather than forcing dimension scaling.
4. **Whenever adding mechanics or items, surface their tuning variables directly into `config.ts`.**
5. All logical gamestate (inventory amounts, currency balances, storage arrays) is natively bound to `localStorage` for persistence. You must `setItem` locally whenever actively mutating the global `state` variable block inside `script.ts`.
