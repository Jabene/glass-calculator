# RuneScape glass crafting calculator

**What it is:** A small web app for **Crafting** training via **molten glass** and **glass items**. You enter your **total** Crafting XP, pick a **target level**, choose **furnace (20 XP)** or **Superglass Make (10 XP)** per molten glass, and pick an **end product**. It tells you how many **molten glass** to make and how many **finished items** to craft so you do not over-make molten glass that you will not use for that grind (both steps grant XP toward the same goal).

**Stack:** [Vite](https://vitejs.dev/) and vanilla JavaScript (no framework).

---

## Quick start

Requirements: [Node.js](https://nodejs.org/) 18+ (or any version that runs Vite 6).

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

```bash
npm run build    # production bundle in dist/
npm run preview  # serve the production build locally
```

---

## Experience table (`public/xp-table.json`)

The app loads **`public/xp-table.json`** at runtime. Edit that file, then **reload the browser**.

- **`cumulativeXpToReachLevel`** must be an array of **99 numbers** (levels 1–99).
- Each value is **total lifetime XP** in the skill needed to **be on** that level (what the game shows), **not** XP gained only since the previous level.
  - Index `0` → level 1 (always `0`).
  - Index `2` → total XP required to **be level 3** (e.g. `174` means 174 total XP in the skill, not “174 on top of the level-2 total”).
- Values must be non-decreasing as level increases.

The optional **`comment`** field is for humans only; the app ignores it.

---

## Game assumptions (OSRS-style glass)

| Step | XP (configurable in UI) |
|------|---------------------------|
| Molten glass (furnace / sand + soda ash) | 20 |
| Molten glass (Superglass Make) | 10 |

**End products** (each uses one molten glass; XP per craft is in the UI): beer glass, empty candle lantern, empty oil lamp, vial, empty fishbowl, unpowered orb, lantern lens, empty light orb.

---

## How the plan is computed

The planner solves for integers **M** (molten glass crafts) and **E** (end-product crafts) with **M ≥ E** (each product needs one molten glass) and **M × glass_XP + E × product_XP ≥ XP still needed**, then prefers:

1. **Least spare molten glass** (**M − E**) so you are not told to bank hundreds of unused molten glass after the grind.
2. **Least XP past the goal** (overshoot).
3. **Fewest total actions** (molten + product).

Core logic lives in `src/optimize.js`; UI and XP loading in `src/main.js`.

---

## Project layout

| Path | Role |
|------|------|
| `index.html` | Page shell |
| `src/main.js` | Form, fetch XP table, render results |
| `src/optimize.js` | Molten + product action counts |
| `src/style.css` | Layout and theme |
| `public/xp-table.json` | Editable level 1–99 **total** XP thresholds |

---

## License

Private / personal use unless you add a license of your choice.
