import createCache, { StylisElement, StylisPlugin } from '@emotion/cache';

import { JetBrains_Mono, Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import { extendTheme } from '@mui/joy';

import { animationEnterBelow } from '~/common/util/animUtils';


// Definitions
export type UIComplexityMode = 'minimal' | 'pro' | 'extra';
export type ContentScaling = 'xs' | 'sm' | 'md';

/** User-selectable gradient combo for primary buttons and accents. First id (purple-pink) is the base/original theme. */
export type ThemeGradientId =
  | 'purple-pink'  // base/original theme
  | 'blue-cyan'
  | 'emerald-teal'
  | 'amber-orange'
  | 'rose-coral'
  | 'indigo-violet'
  | 'sky-blue'
  | 'lime-green'
  | 'fuchsia-pink'
  | 'slate-cyan'
  | 'violet-rose'
  | 'ocean-mint'
  | 'sunset-red'
  | 'forest-moss'
  | 'berry-wine'
  | 'gold-amber'
  | 'ice-blue'
  | 'coral-peach'
  | 'lavender-plum'
  // Fun row (Coolors-style)
  | 'cotton-candy'
  | 'aurora'
  | 'peach-blossom'
  | 'tropical'
  | 'neon-dream'
  | 'sunset-glow'
  | 'mint-lemon'
  | 'lavender-haze'
  | 'ocean-depths'
  | 'berry-sorbet'
  | 'neutral';

export interface ThemeGradientCombo {
  start: string;
  end: string;
  /** Slightly darker for button hover */
  hoverStart: string;
  hoverEnd: string;
  label: string;
}

/** Theme gradient palettes. No duplicate start+end pairs; first entry is the base/original theme. */
export const THEME_GRADIENTS: Record<ThemeGradientId, ThemeGradientCombo> = {
  // Base (original) + purples & pinks
  'purple-pink': { start: '#a020f0', end: '#ec4899', hoverStart: '#8916d6', hoverEnd: '#db2777', label: 'Purple to Pink' },
  'fuchsia-pink': { start: '#c026d3', end: '#f472b6', hoverStart: '#a21caf', hoverEnd: '#ec4899', label: 'Fuchsia to Pink' },
  'violet-rose': { start: '#7c3aed', end: '#f43f5e', hoverStart: '#6d28d9', hoverEnd: '#e11d48', label: 'Violet to Rose' },
  'lavender-plum': { start: '#8b5cf6', end: '#a855f7', hoverStart: '#7c3aed', hoverEnd: '#9333ea', label: 'Lavender to Plum' },
  // Blues & cyans
  'blue-cyan': { start: '#2563eb', end: '#06b6d4', hoverStart: '#1d4ed8', hoverEnd: '#0891b2', label: 'Blue to Cyan' },
  'sky-blue': { start: '#0284c7', end: '#38bdf8', hoverStart: '#0369a1', hoverEnd: '#0ea5e9', label: 'Sky Blue' },
  'ice-blue': { start: '#22d3ee', end: '#6366f1', hoverStart: '#06b6d4', hoverEnd: '#4f46e5', label: 'Cyan to Indigo' },
  'slate-cyan': { start: '#475569', end: '#0e7490', hoverStart: '#334155', hoverEnd: '#0d6988', label: 'Slate to Cyan' },
  // Greens
  'emerald-teal': { start: '#059669', end: '#14b8a6', hoverStart: '#047857', hoverEnd: '#0d9488', label: 'Emerald to Teal' },
  'lime-green': { start: '#22c55e', end: '#84cc16', hoverStart: '#16a34a', hoverEnd: '#65a30d', label: 'Green to Lime' },
  'forest-moss': { start: '#166534', end: '#4d7c0f', hoverStart: '#14532d', hoverEnd: '#3f6212', label: 'Forest to Moss' },
  'ocean-mint': { start: '#0d9488', end: '#34d399', hoverStart: '#0f766e', hoverEnd: '#10b981', label: 'Ocean to Mint' },
  // Warm / reds & oranges
  'amber-orange': { start: '#d97706', end: '#ea580c', hoverStart: '#b45309', hoverEnd: '#c2410c', label: 'Amber to Orange' },
  'rose-coral': { start: '#e11d48', end: '#f43f5e', hoverStart: '#be123c', hoverEnd: '#e11d48', label: 'Rose to Coral' },
  'sunset-red': { start: '#dc2626', end: '#f97316', hoverStart: '#b91c1c', hoverEnd: '#ea580c', label: 'Sunset Red' },
  'coral-peach': { start: '#fb7185', end: '#fdba74', hoverStart: '#f43f5e', hoverEnd: '#fb923c', label: 'Coral to Peach' },
  'gold-amber': { start: '#eab308', end: '#f59e0b', hoverStart: '#ca8a04', hoverEnd: '#d97706', label: 'Gold to Amber' },
  // Jewel & rich
  'indigo-violet': { start: '#4f46e5', end: '#7c3aed', hoverStart: '#4338ca', hoverEnd: '#6d28d9', label: 'Indigo to Violet' },
  'berry-wine': { start: '#be185d', end: '#831843', hoverStart: '#9d174d', hoverEnd: '#701a75', label: 'Berry to Wine' },
  // Fun row (Coolors-style: https://coolors.co/gradients)
  'cotton-candy': { start: '#ff9a9e', end: '#fad0c4', hoverStart: '#f08a8e', hoverEnd: '#e8c0b4', label: 'Cotton Candy' },
  'aurora': { start: '#00c6fb', end: '#005bea', hoverStart: '#00b0e8', hoverEnd: '#004fd4', label: 'Aurora' },
  'peach-blossom': { start: '#ffecd2', end: '#fcb69f', hoverStart: '#f0dcb8', hoverEnd: '#e8a68a', label: 'Peach Blossom' },
  'tropical': { start: '#ff6b6b', end: '#4ecdc4', hoverStart: '#e85c5c', hoverEnd: '#3dbdb4', label: 'Tropical' },
  'neon-dream': { start: '#a18cd1', end: '#fbc2eb', hoverStart: '#8b7cbd', hoverEnd: '#e8a8d4', label: 'Neon Dream' },
  'sunset-glow': { start: '#fa709a', end: '#fee140', hoverStart: '#e85c86', hoverEnd: '#f5d02c', label: 'Sunset Glow' },
  'mint-lemon': { start: '#96fbc4', end: '#f9f586', hoverStart: '#7ce8b0', hoverEnd: '#e8e072', label: 'Mint Lemon' },
  'lavender-haze': { start: '#e0c3fc', end: '#8ec5fc', hoverStart: '#cab0e8', hoverEnd: '#7ab0e8', label: 'Lavender Haze' },
  'ocean-depths': { start: '#2193b0', end: '#6dd5ed', hoverStart: '#1c7d96', hoverEnd: '#5bc0d9', label: 'Ocean Depths' },
  'berry-sorbet': { start: '#ee9ca7', end: '#ffdde1', hoverStart: '#d98a95', hoverEnd: '#e8c8cc', label: 'Berry Sorbet' },
  // Last: basic minimal (black accent only, no grey)
  'neutral': { start: '#1a1a1a', end: '#1a1a1a', hoverStart: '#0a0a0a', hoverEnd: '#0a0a0a', label: 'Minimal' },
};

// ---- Gradient-derived full theme (primary, neutral, background, divider, shadow) ----

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('');
}

function mixHex(hex1: string, hex2: string, t: number): string {
  const a = hexToRgb(hex1);
  const b = hexToRgb(hex2);
  return rgbToHex(a.r + (b.r - a.r) * t, a.g + (b.g - a.g) * t, a.b + (b.b - a.b) * t);
}

function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r} ${g} ${b} / ${alpha})`;
}

/** Relative luminance (0–1). Used to pick light vs dark text on primary for readability. */
function hexLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function buildPrimaryPalette(mainHex: string, mode: 'light' | 'dark', gradientEndHex?: string) {
  const soft = mode === 'light' ? 0.08 : 0.14;
  const softHover = mode === 'light' ? 0.14 : 0.22;
  const softActive = mode === 'light' ? 0.2 : 0.28;
  const plainHover = mode === 'light' ? 0.08 : 0.12;
  const plainActive = mode === 'light' ? 0.14 : 0.18;
  const outlined = mode === 'light' ? 0.18 : 0.22;
  const outlinedHover = mode === 'light' ? 0.08 : 0.12;
  const c50 = mixHex('#ffffff', mainHex, 0.97);
  const c100 = mixHex('#ffffff', mainHex, 0.92);
  const c200 = mixHex('#ffffff', mainHex, 0.82);
  const c300 = mixHex('#ffffff', mainHex, 0.65);
  const c400 = mixHex('#ffffff', mainHex, 0.4);
  const c600 = mixHex(mainHex, '#000000', 0.15);
  const c700 = mixHex(mainHex, '#000000', 0.35);
  const c800 = mixHex(mainHex, '#000000', 0.5);
  const c900 = mixHex(mainHex, '#000000', 0.65);
  const plainColor = mode === 'light' ? mainHex : mixHex(mainHex, '#ffffff', 0.75);
  const softColor = mode === 'light' ? c700 : mixHex(mainHex, '#ffffff', 0.7);
  const outlinedColor = mode === 'light' ? c700 : softColor;
  const lumStart = hexLuminance(mainHex);
  const lumEnd = gradientEndHex ? hexLuminance(gradientEndHex) : lumStart;
  const maxLuminance = Math.max(lumStart, lumEnd);
  const solidColor = maxLuminance > 0.55 ? '#1a1a1a' : '#fff';
  return {
    50: c50, 100: c100, 200: c200, 300: c300, 400: c400,
    500: mainHex, 600: c600, 700: c700, 800: c800, 900: c900,
    solidBg: mainHex,
    solidColor,
    solidHoverBg: c600,
    solidActiveBg: c700,
    softBg: hexToRgba(mainHex, soft),
    softColor,
    softHoverBg: hexToRgba(mainHex, softHover),
    softActiveBg: hexToRgba(mainHex, softActive),
    plainColor,
    plainHoverBg: hexToRgba(mainHex, plainHover),
    plainActiveBg: hexToRgba(mainHex, plainActive),
    outlinedColor,
    outlinedBorder: hexToRgba(mainHex, outlined),
    outlinedHoverBg: hexToRgba(mainHex, outlinedHover),
    outlinedActiveBg: hexToRgba(mainHex, plainActive),
  };
}

function buildNeutralPalette(mainHex: string, mode: 'light' | 'dark') {
  const isDark = mode === 'dark';
  return {
    plainColor: isDark ? '#ede6f8' : '#1a1528',
    solidBg: isDark ? '#16102a' : '#1a1528',
    solidHoverBg: isDark ? '#201840' : '#120e20',
    softBg: hexToRgba(mainHex, isDark ? 0.08 : 0.06),
    softHoverBg: hexToRgba(mainHex, isDark ? 0.18 : 0.14),
    softActiveBg: hexToRgba(mainHex, isDark ? 0.26 : 0.2),
    plainHoverBg: hexToRgba(mainHex, isDark ? 0.12 : 0.08),
    plainActiveBg: hexToRgba(mainHex, isDark ? 0.18 : 0.14),
    outlinedBorder: hexToRgba(mainHex, isDark ? 0.14 : 0.14),
  };
}

function buildTextPalette(mainHex: string, mode: 'light' | 'dark') {
  if (mode === 'light')
    return { primary: '#1a1528', secondary: mixHex('#4a3d64', mainHex, 0.3), tertiary: mixHex('#7a6d94', mainHex, 0.2), icon: mixHex('#5e4f78', mainHex, 0.4) };
  return { primary: '#f2ecfc', secondary: mixHex('#c8bce0', mainHex, 0.5), tertiary: mixHex('#a094b8', mainHex, 0.4), icon: mixHex('#c0b4d8', mainHex, 0.5) };
}

function buildBackgroundPalette(mainHex: string, mode: 'light' | 'dark') {
  if (mode === 'light') {
    const body = mixHex('#fafafa', mainHex, 0.04);
    const level2 = mixHex('#f5f5f5', mainHex, 0.06);
    return {
      body,
      popup: '#ffffff',
      surface: 'rgba(255 255 255 / 0.92)',
      level1: 'rgba(255 255 255 / 0.88)',
      level2,
    };
  }
  const body = mixHex('#0c0c0e', mainHex, 0.06);
  const popup = mixHex('#141416', mainHex, 0.08);
  const surface = mixHex('#101012', mainHex, 0.05);
  const level1 = mixHex('#0e0e10', mainHex, 0.05);
  const level2 = mixHex('#161618', mainHex, 0.08);
  return {
    body,
    popup,
    surface: `rgba(${hexToRgb(body).r} ${hexToRgb(body).g} ${hexToRgb(body).b} / 0.96)`,
    level1: `rgba(${hexToRgb(level1).r} ${hexToRgb(level1).g} ${hexToRgb(level1).b} / 0.96)`,
    level2: `rgba(${hexToRgb(level2).r} ${hexToRgb(level2).g} ${hexToRgb(level2).b} / 0.94)`,
  };
}

function buildDivider(mainHex: string, mode: 'light' | 'dark') {
  return mode === 'light' ? hexToRgba(mainHex, 0.1) : hexToRgba(mixHex(mainHex, '#fff', 0.5), 0.1);
}

function buildShadow(mainHex: string) {
  const { r, g, b } = hexToRgb(mainHex);
  return {
    xs: `0 2px 8px rgba(${r} ${g} ${b} / 0.08)`,
    sm: `0 4px 18px rgba(${r} ${g} ${b} / 0.1)`,
    md: `0 8px 30px rgba(${r} ${g} ${b} / 0.13)`,
    lg: `0 14px 44px rgba(${r} ${g} ${b} / 0.16)`,
    xl: `0 22px 60px rgba(${r} ${g} ${b} / 0.2)`,
  };
}

// CSS utils
export const hideOnMobile = { display: { xs: 'none', md: 'flex' } };


// Theme & Fonts

const bodyFont = Plus_Jakarta_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  fallback: ['Helvetica', 'Arial', 'sans-serif'],
});
export const themeFontFamilyCss = bodyFont.style.fontFamily;

const displayFont = Space_Grotesk({
  weight: ['500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  fallback: ['Helvetica', 'Arial', 'sans-serif'],
});
export const themeDisplayFontFamilyCss = displayFont.style.fontFamily;

const jetBrainsMono = JetBrains_Mono({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  fallback: ['monospace'],
});
export const themeCodeFontFamilyCss = jetBrainsMono.style.fontFamily;


/** Minimal theme: black accent only, no gradient. Light mode = black on light bg; dark = jet black. */
const NEUTRAL_LIGHT_BLACK = '#1a1a1a';
const NEUTRAL_LIGHT_BLACK_END = '#2d2d2d';
const NEUTRAL_DARK_JET_BLACK = '#0a0a0a';
const NEUTRAL_DARK_JET_BLACK_END = '#141414';

export const createAppTheme = (uiComplexityMinimal: boolean, gradientId: ThemeGradientId = 'neutral') => {
  const gradient = THEME_GRADIENTS[gradientId] ?? THEME_GRADIENTS['neutral'];
  const mainHex = gradient.start;
  const lightHex = gradientId === 'neutral' ? NEUTRAL_LIGHT_BLACK : mainHex;
  const lightEndHex = gradientId === 'neutral' ? NEUTRAL_LIGHT_BLACK_END : gradient.end;
  const darkHex = gradientId === 'neutral' ? NEUTRAL_DARK_JET_BLACK : mainHex;
  const darkEndHex = gradientId === 'neutral' ? NEUTRAL_DARK_JET_BLACK_END : gradient.end;
  /** Minimal: solid black accent (no gradient); other themes use the gradient */
  const gradientResolved = gradientId === 'neutral'
    ? { start: NEUTRAL_LIGHT_BLACK, end: NEUTRAL_LIGHT_BLACK, hoverStart: '#0a0a0a', hoverEnd: '#0a0a0a', label: gradient.label }
    : gradient;
  const lightPrimary = buildPrimaryPalette(lightHex, 'light', lightEndHex);
  const darkPrimary = buildPrimaryPalette(darkHex, 'dark', darkEndHex);
  const lightNeutral = buildNeutralPalette(lightHex, 'light');
  const darkNeutral = buildNeutralPalette(darkHex, 'dark');
  const lightText = buildTextPalette(lightHex, 'light');
  const darkText = buildTextPalette(darkHex, 'dark');
  const lightBackground = buildBackgroundPalette(lightHex, 'light');
  const darkBackground = buildBackgroundPalette(darkHex, 'dark');
  const shadow = buildShadow(lightHex);
  return extendTheme({
  fontFamily: {
    body: themeFontFamilyCss,
    display: themeDisplayFontFamilyCss,
    code: themeCodeFontFamilyCss,
  },
  radius: {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '20px',
    xl: '24px',
  },
  shadow,
  colorSchemes: {
    light: {
      palette: {
        primary: lightPrimary,
        neutral: lightNeutral,
        text: lightText,
        background: lightBackground,
        divider: buildDivider(lightHex, 'light'),
      },
    },
    dark: {
      palette: {
        primary: darkPrimary,
        neutral: darkNeutral,
        text: darkText,
        background: darkBackground,
        divider: buildDivider(darkHex, 'dark'),
      },
    },
  },
  components: {
    JoyButton: {
      styleOverrides: {
        root: ({ ownerState }) => {
          const g = gradientResolved;
          return {
          borderRadius: '999px',
          fontWeight: 600,
          letterSpacing: '-0.01em',
          transition: 'box-shadow 0.15s ease, background 0.15s ease',
          ...(ownerState.variant === 'solid' && {
            background: `linear-gradient(135deg, ${g.start} 0%, ${g.end} 100%)`,
            boxShadow: `0 2px 8px ${g.start}33`,
            '&:hover': {
              background: `linear-gradient(135deg, ${g.hoverStart} 0%, ${g.hoverEnd} 100%)`,
              boxShadow: `0 4px 16px ${g.start}47`,
            },
            '&:active': {
              boxShadow: `0 2px 6px ${g.start}33`,
            },
          }),
        };
        },
      },
    },
    JoyIconButton: {
      styleOverrides: {
        root: ({ ownerState, theme }) => ({
          borderRadius: ownerState.size === 'sm' ? '8px' : '10px',
          transition: 'background-color 0.15s ease, color 0.15s ease',
          '&:hover': {
            backgroundColor: `rgba(${theme.palette.primary.mainChannel} / 0.1)`,
          },
        }),
      },
    },

    JoyInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          boxShadow: 'none',
          borderRadius: '10px',
          borderColor: 'rgba(var(--joy-palette-primary-mainChannel) / 0.16)',
          backgroundColor: theme.palette.background.level1,
          backdropFilter: 'blur(20px) saturate(140%)',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
          color: 'var(--joy-palette-text-primary)',
          '& input::placeholder': { color: 'var(--joy-palette-text-tertiary)', opacity: 0.9 },
          '&:focus-within': {
            borderColor: 'rgba(var(--joy-palette-primary-mainChannel) / 0.36)',
            boxShadow: `0 0 0 2px rgba(${theme.palette.primary.mainChannel} / 0.16), 0 12px 32px rgba(${theme.palette.primary.mainChannel} / 0.12)`,
          },
        }),
      },
    },

    JoySelect: {
      styleOverrides: {
        root: ({ theme }) => ({
          boxShadow: 'none',
          borderRadius: '10px',
          borderColor: 'rgba(var(--joy-palette-primary-mainChannel) / 0.16)',
          backgroundColor: theme.palette.background.level1,
          backdropFilter: 'blur(20px) saturate(140%)',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
          '&:focus-within': {
            borderColor: 'rgba(var(--joy-palette-primary-mainChannel) / 0.36)',
            boxShadow: `0 0 0 2px rgba(${theme.palette.primary.mainChannel} / 0.16), 0 12px 32px rgba(${theme.palette.primary.mainChannel} / 0.12)`,
          },
        }),
      },
    },

    JoyTextarea: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: '14px',
          borderColor: 'rgba(var(--joy-palette-primary-mainChannel) / 0.16)',
          backgroundColor: theme.palette.background.level1,
          backdropFilter: 'blur(24px) saturate(150%)',
          boxShadow: 'inset 0 1px 0 rgba(255 255 255 / 0.1)',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
          color: 'var(--joy-palette-text-primary)',
          '& textarea::placeholder': { color: 'var(--joy-palette-text-tertiary)', opacity: 0.9 },
          '&:focus-within': {
            borderColor: 'rgba(var(--joy-palette-primary-mainChannel) / 0.36)',
            boxShadow: `0 0 0 2px rgba(${theme.palette.primary.mainChannel} / 0.16), 0 16px 40px rgba(${theme.palette.primary.mainChannel} / 0.1)`,
          },
        }),
      },
    },

    JoySheet: {
      styleOverrides: {
        root: ({ theme }) => ({
          backdropFilter: 'blur(24px) saturate(150%)',
          borderColor: theme.palette.divider,
        }),
      },
    },

    JoyCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          backdropFilter: 'blur(24px) saturate(150%)',
          borderRadius: '16px',
          borderColor: theme.palette.divider,
        }),
      },
    },

    JoyListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          transition: 'background-color 0.15s ease',
        },
      },
    },

    JoyMenu: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: '14px',
          backgroundColor: theme.palette.background.popup,
          border: `1px solid ${theme.palette.primary.outlinedBorder}`,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 32px rgba(0 0 0 / 0.5), 0 2px 8px rgba(0 0 0 / 0.3)'
            : `0 8px 32px ${theme.palette.primary.softBg}, 0 2px 8px ${theme.palette.primary.softBg}`,
        }),
      },
    },

    JoyBadge: {
      styleOverrides: {
        badge: ({ ownerState }) => {
          if ((ownerState.color as any) !== 'color-feature') return undefined;
          return { background: `linear-gradient(135deg, ${gradientResolved.start}, ${gradientResolved.end})` };
        },
      },
    },

    JoyModal: {
      styleOverrides: {
        backdrop: !uiComplexityMinimal ? {
          backdropFilter: 'blur(8px) saturate(120%)',
        } : {
          backdropFilter: 'none',
        },
        root: uiComplexityMinimal ? undefined : {
          '& .agi-animate-enter': {
            animation: `${animationEnterBelow} 0.2s cubic-bezier(.4,0,.2,1)`,
          },
        },
      },
    },

    JoySwitch: {
      styleOverrides: {
        root: ({ ownerState }) => ({
          ...(ownerState.size === 'md' && {
            '--Switch-thumbSize': '16px',
          }),
        }),
      },
    },

    JoyTooltip: {
      styleOverrides: {
        root: ({ theme }) => ({
          /* Use popup background and text so tooltips are never dark purple in light/dark */
          backgroundColor: theme.palette.background.popup,
          color: theme.palette.text.primary,
        }),
      },
    },
  },
  });
};

export const themeBgApp = 'background.body';
export const themeBgAppDarker = 'background.surface';
export const themeBgAppChatComposer = 'background.level1';

export const lineHeightChatTextMd = 1.75;
export const lineHeightTextareaMd = 1.75;

export const themeZIndexBeamView = 10;
export const themeZIndexPageBar = 25;
export const themeZIndexDesktopDrawer = 26;
export const themeZIndexDesktopPanel = 27;
export const themeZIndexDesktopNav = 30;
export const themeZIndexChatBubble = 50;
export const themeZIndexDragOverlay = 60;
export const themeZIndexOverMobileDrawer = 1301;


// Dynamic UI Sizing

export function adjustContentScaling(scaling: ContentScaling, offset?: number) {
  if (!offset) return scaling;
  const scalingArray = ['xs', 'sm', 'md'];
  const scalingIndex = scalingArray.indexOf(scaling);
  const newScalingIndex = Math.max(0, Math.min(scalingArray.length - 1, scalingIndex + offset));
  return scalingArray[newScalingIndex] as ContentScaling;
}

interface ContentScalingOptions {
  // BlocksRenderer
  blockCodeFontSize: string;
  blockCodeMarginY: number;
  blockFontSize: string;
  blockImageGap: number;
  blockLineHeight: string | number;
  // ChatMessage
  chatMessagePadding: number;
  fragmentButtonFontSize: string;
  // ChatDrawer
  chatDrawerItemSx: { '--ListItem-minHeight': string, fontSize: string };
  chatDrawerItemFolderSx: { '--ListItem-minHeight': string, fontSize: string };
  // OptimaPanelGroup
  optimaPanelGroupSize: 'sm' | 'md';
}

export const themeScalingMap: Record<ContentScaling, ContentScalingOptions> = {
  xs: {
    blockCodeFontSize: '0.75rem',
    blockCodeMarginY: 0.5,
    blockFontSize: 'xs',
    blockImageGap: 1,
    blockLineHeight: 1.666667,
    chatMessagePadding: 0.75,
    fragmentButtonFontSize: 'xs',
    chatDrawerItemSx: { '--ListItem-minHeight': '2rem', fontSize: 'sm' },
    chatDrawerItemFolderSx: { '--ListItem-minHeight': '2.25rem', fontSize: 'sm' },
    optimaPanelGroupSize: 'sm',
  },
  sm: {
    blockCodeFontSize: '0.75rem',
    blockCodeMarginY: 1,
    blockFontSize: 'sm',
    blockImageGap: 1.5,
    blockLineHeight: 1.714286,
    chatMessagePadding: 1,
    fragmentButtonFontSize: 'sm',
    chatDrawerItemSx: { '--ListItem-minHeight': '2rem', fontSize: 'sm' },
    chatDrawerItemFolderSx: { '--ListItem-minHeight': '2.25rem', fontSize: 'sm' },
    optimaPanelGroupSize: 'sm',
  },
  md: {
    blockCodeFontSize: '0.875rem',
    blockCodeMarginY: 1.5,
    blockFontSize: 'md',
    blockImageGap: 2,
    blockLineHeight: 1.75,
    chatMessagePadding: 1.25,
    fragmentButtonFontSize: 'sm',
    chatDrawerItemSx: { '--ListItem-minHeight': '2.25rem', fontSize: 'md' },
    chatDrawerItemFolderSx: { '--ListItem-minHeight': '2.5rem', fontSize: 'md' },
    optimaPanelGroupSize: 'md',
  },
};


// Emotion Cache (with insertion point on the SSR pass)

const isBrowser = typeof document !== 'undefined';

const emotionStylisPlugins: StylisPlugin[] = [

  /**
   * 1. remove the default prefixer plugin: probably not needed and bloating
   */
  // prefixer,

  /**
   * 2. add a function to remove wide-matching CSS rules from Joy UI.
   * Culprit: https://github.com/mui/material-ui/blob/a705e1f15075b2deb59263868bfa7b1d9f84cdd4/packages/mui-joy/src/Checkbox/Checkbox.tsx#L59
   * These '~ *' rules are slow and cause a lot of reflows.
   *
   * To validate, search the Elements tab for JoyCheckbox-root, and see if there's the '~ *' rule.
   */
  function removeSlowCSS(element: StylisElement) {
    if (
      element.type === 'rule'
      && element.value.endsWith('~*')
      && Array.isArray(element.children)
    ) {
      element.return = ' ';
      element.children = [];
    }
  },

];


export function createEmotionCache() {
  let insertionPoint: HTMLElement | undefined;

  if (isBrowser) {
    const emotionInsertionPoint = document.querySelector<HTMLMetaElement>(
      'meta[name="emotion-insertion-point"]',
    );
    insertionPoint = emotionInsertionPoint ?? undefined;
  }

  return createCache({ key: 'mui-style', insertionPoint: insertionPoint, stylisPlugins: emotionStylisPlugins });
}

// MISC

// For next April Fools' week
// export const foolsMode = new Date().getMonth() === 3 && new Date().getDate() <= 7;
