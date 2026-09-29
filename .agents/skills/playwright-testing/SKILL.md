---
name: playwright-testing
description: Provides guidelines, patterns, and runbooks for browser automation and end-to-end (E2E) testing using Playwright. Use when creating browser tests, automating game interactions, or debugging web flows.
---

# Playwright Browser Testing & Automation

This skill guides automated testing and validation of web applications and game interactions using Playwright.

## Core Guidelines

### 1. Robust Locators
- Prefer user-visible locators rather than brittle CSS hierarchy:
  - `page.getByRole('button', { name: /ateş et/i })`
  - `page.locator('[data-coord="B4"]')` or `page.getByTestId('cell-b4')`
- For grid boards, use semantic attributes (e.g. `data-row="B" data-col="4"`) to target specific coordinates reliably.

### 2. Testing Interactive Game Flows
- **Ship Placement:** Verify valid and invalid placements (overlapping ships, out-of-bounds cells, horizontal/vertical rotation).
- **Turn Sequence:** Simulate shot firing:
  - Assert coordinate receives hit/miss status after click.
  - Verify turn indicator toggles between Player and Computer/Opponent.
  - Ensure already targeted cells cannot be clicked again.
- **Endgame Assertions:** Test win/loss modals, game restart button, and scoreboard resets.

### 3. Execution & Reporting
- Run tests in headless mode by default for speed:
  `npx playwright test`
- In case of failures, inspect screenshots and trace files rather than running repeated interactive browser instances.
