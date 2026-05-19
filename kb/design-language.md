# Big-AGI Design Language

Single source of truth for UI/UX: tokens, patterns, and where they live in code. Use this for consistency and when adding or changing UI.

---

## 1. Brand and identity

- **Primary hue:** Purple (#a020f0 and family). Accent: pink/magenta (#e040a0, #d040a0) for gradients.
- **Logo:** `public/apple-touch-icon.png`. Use Next.js `Image` with `alt={Brand.Title.Base}`. Use in: sign-in/sign-up, profile header, nav logo, top bar, ExplainerCarousel, draw section dropdown, LLM attachments prompt tooltip.
- **Voice:** Clear, technical but approachable. No em dashes; use normal hyphens.

---

## 2. Theme system (Joy UI + custom)

**Entry:** `src/common/app.theme.ts` – `createAppTheme(uiComplexityMinimal)`.

### 2.1 Fonts (next/font)

| Role    | Font               | Use |
|---------|--------------------|-----|
| body    | Plus Jakarta Sans  | UI, chat, copy |
| display | Space Grotesk      | Headings, titles |
| code    | JetBrains Mono     | Code blocks, monospace |

Exported as `themeFontFamilyCss`, `themeDisplayFontFamilyCss`, `themeCodeFontFamilyCss`.

### 2.2 Radius (design tokens)

```ts
radius: { xs: '8px', sm: '12px', md: '16px', lg: '20px', xl: '24px' }
```

- **Small controls:** `8px`–`10px` (IconButton sm, inputs).
- **Cards / composer:** `14px`–`16px` (Composer grid, JoyCard).
- **Sheets / modals:** `14px`–`16px` (JoyMenu, textarea).
- **Pills:** Buttons use `999px` (pill) in theme override.

Use theme tokens (e.g. `borderRadius: 'md'`) instead of raw pixel values where possible.

### 2.3 Shadows (purple-tinted)

```ts
shadow: {
  xs: '0 2px 8px rgba(120 40 180 / 0.08)',
  sm: '0 4px 18px rgba(120 40 180 / 0.1)',
  md: '0 8px 30px rgba(120 40 180 / 0.13)',
  lg: '0 14px 44px rgba(120 40 180 / 0.16)',
  xl: '0 22px 60px rgba(120 40 180 / 0.2)',
}
```

Prefer `boxShadow: 'sm' | 'md'` from theme. Composer and shells use custom shadows (see app.styles.css and Composer `stableGridSx`).

### 2.4 Color schemes (light / dark)

**Primary (purple):**

- Base: `#a020f0`.
- Use: `primary.solidBg`, `primary.softBg`, `primary.plainColor`, `primary.outlinedBorder`, etc. Do not hardcode hex for primary; use `color="primary"` or `bgcolor: 'primary.softBg'` etc.

**Neutral / text:**

- `text.primary`, `text.secondary`, `text.tertiary`, `text.icon`.
- Neutral surfaces: `neutral.softBg`, `neutral.plainColor`.

**Backgrounds:**

- `background.body` – page.
- `background.popup` – modals, menus, dropdowns.
- `background.surface` – cards, composer area.
- `background.level1`, `background.level2` – elevated layers.

**Borders:**

- `divider` or `borderColor: 'divider'` for default borders.

**Semantic:**

- `success`, `warning`, `danger` for status (e.g. token usage, errors). Prefer `primary` over green for “active” or “good” when it’s the main CTA.

---

## 3. Global CSS and shell (app.styles.css)

**Root variables (light):**

- `--agi-body-bg`, `--agi-body-ambient` – page background and gradient.
- `--agi-shell-bg`, `--agi-shell-elevated`, `--agi-shell-soft` – shell surfaces.
- `--agi-shell-border`, `--agi-shell-border-strong` – shell borders.
- `--agi-shell-shadow`, `--agi-shell-shadow-strong`, `--agi-shell-glow` – shell depth and glow.
- `--agi-message-user`, `--agi-message-assistant`, `--agi-message-system` – chat bubbles (used via `var(--agi-message-*)` or theme `messageBackground()`).

Dark scheme overrides under `[data-joy-color-scheme="dark"]`.

**Layout:**

- `--AGI-Nav-width`, `--AGI-Desktop-Drawer-width`, `--AGI-Desktop-Panel-width`, `--AGI-Mobile-*` – Optima layout widths.

**Selection / scrollbars:**

- Selection: `rgba(160, 32, 240, 0.28)`.
- Scrollbar thumb: purple–pink gradient; track transparent.

Use `var(--agi-*)` for shell, message bubbles, and layout; use Joy tokens for components.

---

## 4. Component overrides (app.theme.ts)

- **JoyButton:** Pill (`999px`), solid = purple–pink gradient + shadow; font weight 600, letter-spacing -0.01em.
- **JoyIconButton:** sm = 8px radius, md = 10px; hover = primary 0.1 alpha.
- **JoyInput / JoySelect:** 10px radius, primary-tinted border, blur + saturate backdrop; focus ring and shadow.
- **JoyTextarea:** 14px radius, primary border, blur 24px, focus ring and shadow.
- **JoySheet / JoyCard:** divider border, blur 24px, Card radius 16px.
- **JoyListItemButton:** 10px radius.
- **JoyMenu:** 14px radius, border and shadow by mode.
- **JoyModal:** Backdrop blur (or none in minimal); optional enter animation.

Prefer these over ad-hoc sx for consistency.

---

## 5. Layout: Optima

**Config:** `src/common/layout/optima/optima.config.ts`.

- Drawer/panel: `OPTIMA_DRAWER_BACKGROUND = 'var(--agi-shell-bg)'`.
- Nav radius: `OPTIMA_NAV_RADIUS = 'sm'`.
- Peek/hover: `OPTIMA_PEEK_HOVER_ENTER_DELAY`, `OPTIMA_PEEK_HOVER_TIMEOUT`, etc.

**Structure:** Drawer (left) | Toolbar (top) | Page (center) | Panel (right). Portals: `OptimaToolbarIn`, `OptimaDrawerIn`, `OptimaPanelIn`. Use `useLayoutPortalsStore` for toolbar content (e.g. `toolbarContentKind: 'beam'` for Beam bar styling).

**Z-index:** `app.theme.ts` – `themeZIndexDesktopNav`, `themeZIndexChatBubble`, `themeZIndexDragOverlay`, etc. Use these constants instead of magic numbers.

---

## 6. Content scaling

**Map:** `themeScalingMap` in app.theme.ts (`xs` | `sm` | `md`).

Controls:

- Block font size, line height, code margin, image gap.
- Chat message padding, fragment button font size.
- Drawer list item min-height and font size.
- Optima panel group size.

Use `adjustContentScaling()` and the map for responsive density, not one-off font/padding values.

---

## 7. Chat-specific

### 7.1 Message list and messages

- **List:** `role='chat-messages-list'`; items `role='chat-message'` (Box component='li'). Scroll container has `role='scrollable'` (ScrollToBottom).
- **Avatar column:** `messageAsideColumnSx` – minWidth 36/40, maxWidth 48; avatar 24/28px; model label: `messageAvatarLabelSx` (0.75rem, break-word, center, 2-line wrap allowed).
- **Message body:** `minWidth: 0` on fragments container to avoid overflow. Background from `messageBackground()` (user/assistant/system and draw/react variants).
- **Avatar:** Persona image when present; else purpose symbol; else custom persona emoji from cache; else robot icon. Use `avatarIconSx` and theme tokens (primary.softBg, primary.outlinedBorder).

### 7.2 Composer (chat input)

- **Outer section:** `themeBgAppChatComposer` or tint `*softBg`; padding from `paddingBoxSx`.
- **Inner grid (input + actions):** `stableGridSx`:
  - Background: `var(--agi-shell-elevated)`.
  - Border: `1px solid var(--agi-shell-border)`.
  - Radius: 14px (xs) / 16px (md).
  - Shadow and focus-within shadow/glow from app.styles shell vars.
  - Blur 28px, saturate 160%; `::before` for shell glow.
- **Textarea:** JoyTextarea theme (14px radius, primary border, focus ring). Send button: solid = gradient + shadow; outlined = border + shadow.
- **Spacing:** Grid spacing `{ xs: 1, md: 2 }`; internal gaps 1–2. Avoid cramping: use consistent gap and padding so “right buttons” don’t feel cramped (see below).

**Avoiding cramped composer buttons:**

- Use `gap: { xs: 1, md: 2 }` and `alignItems: 'stretch'` so attachment row and send area breathe.
- Use theme `paddingBoxSx` (p: 1 / 2) and `stableGridSx` p: 0.875 / 1 so the whole composer isn’t tight.
- Prefer IconButton size `sm` and consistent 8–10px radius so buttons don’t look oversized next to the textarea.
- On mobile, keep attachment sources in a grid with gap 1 so they’re tappable and not overlapping.

### 7.3 Beam UI

- When Beam is open, toolbar can use `toolbarContentKind === 'beam'` (OptimaBar) for theme-aligned bar (no inverted black bar).
- Beam panes/cards: `background.surface`, `divider` border, `borderRadius: 'lg'`, `boxShadow: 'sm'`. Fusion “waiting” state: neutral copy, no dark block.

---

## 8. Usage guidelines

1. **Prefer theme tokens:** `bgcolor: 'background.surface'`, `color: 'text.secondary'`, `borderColor: 'divider'`, `borderRadius: 'md'`, `boxShadow: 'sm'`. Avoid raw hex for primary/neutral/surfaces.
2. **Shell and message bubbles:** Use `var(--agi-shell-*)` and `var(--agi-message-*)` (or theme) for layout and chat; use Joy palette for buttons, inputs, chips.
3. **Spacing:** Prefer theme spacing (e.g. `p: 2`, `gap: 1.5`). Use responsive `{ xs: …, md: … }` for padding/gap on key surfaces (composer, message list, panels).
4. **Motion:** Transitions 0.15–0.2s ease for hover/focus; modal enter can use `animationEnterBelow`. Avoid heavy animation in minimal mode.
5. **Accessibility:** Icon-only buttons get `aria-label`. List/message roles and scrollable role are set for keyboard nav. Keep contrast for text.tertiary and divider.
6. **Responsive:** Use `useIsMobile()`, `useIsTallScreen()` and sx breakpoints (`xs`, `md`) so chat input, attachments, and panels don’t feel cramped on small or narrow viewports.

---

## 9. File reference

| What | Where |
|------|--------|
| Theme, fonts, radius, shadows, palette, component overrides | `src/common/app.theme.ts` |
| Shell vars, body, message bubbles, scrollbars | `src/common/styles/app.styles.css` |
| Optima layout config | `src/common/layout/optima/optima.config.ts` |
| Message/avatar styles | `src/apps/chat/components/message/ChatMessage.styles.ts` |
| Composer layout and shell | `src/apps/chat/components/composer/Composer.tsx` (stableGridSx, paddingBoxSx) |
| Avatar and model label logic | `src/common/util/dMessageUtils.tsx` |
| Z-index constants | `src/common/app.theme.ts` (themeZIndex*) |

Keeping new UI aligned with this doc will keep the app’s UX and UI consistent and stellar.
