---
name: frontend-design
description: Guides the design and implementation of modern, responsive, and visually appealing web user interfaces and interactive game boards. Use when creating or refining UI layouts, CSS styling, components, or game visuals.
---

# Frontend Design & Interactive UI Best Practices

This skill provides guidelines for crafting responsive, polished, and performant web interfaces—especially for interactive web applications and game dashboards like Battleship (Amiral Battı).

## Design Principles

### 1. Visual Hierarchy & Theme
- **Theme Consistency:** Use a coherent design language (e.g. Tactical Naval Radar / Dark Navy aesthetic: deep ocean blues, slate grays, tactical accent colors like neon cyan for hits, radar green for status, and subtle amber/red for explosions/sunk ships).
- **Surface Elevation:** Use subtle gradients, crisp borders, and dark glassmorphic backdrops (`backdrop-filter`) to separate the board, side panels, and action logs.

### 2. Grid & Board Dynamics
- **Coordinate System:** Design responsive 10x10 grids with clear row (A-J) and column (1-10) labels.
- **State Feedback:** Provide instant, crisp visual feedback for:
  - Empty water (hover state)
  - Hit (explosion animation / particle spark / red indicator)
  - Miss (ripple / splash effect / gray peg)
  - Sunk ship (revealed silhouette with distinct outline)
- **Fluid Sizing:** Use CSS Grid with `minmax()` or `aspect-ratio: 1 / 1` so that game cells stay square across mobile and desktop screens.

### 3. Responsive & Adaptive Layout
- Structure layouts with flexible flexbox/grid containers:
  - **Desktop:** Side-by-side boards (Player Fleet vs Radar/Enemy Waters) with a central action log.
  - **Mobile:** Tabbed or stacked views allowing easy toggling between own fleet and targeting radar.
- Maintain accessible tap targets (minimum 44x44px for touchscreens where possible).

### 4. Animations & Micro-Interactions
- Keep animations snappy (150ms - 300ms) with `ease-out` or `cubic-bezier`.
- Avoid heavy re-renders during animations; utilize CSS transforms (`transform: scale()`, `translate3d()`) and `opacity` for 60fps GPU acceleration.
