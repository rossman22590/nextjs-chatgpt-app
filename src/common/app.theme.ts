import createCache, { StylisElement, StylisPlugin } from '@emotion/cache';

import { JetBrains_Mono, Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google';
import { extendTheme } from '@mui/joy';

import { animationEnterBelow } from '~/common/util/animUtils';


// Definitions
export type UIComplexityMode = 'minimal' | 'pro' | 'extra';
export type ContentScaling = 'xs' | 'sm' | 'md';


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


export const createAppTheme = (uiComplexityMinimal: boolean) => extendTheme({
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
  shadow: {
    xs: '0 2px 8px rgba(120 40 180 / 0.08)',
    sm: '0 4px 18px rgba(120 40 180 / 0.1)',
    md: '0 8px 30px rgba(120 40 180 / 0.13)',
    lg: '0 14px 44px rgba(120 40 180 / 0.16)',
    xl: '0 22px 60px rgba(120 40 180 / 0.2)',
  },
  colorSchemes: {
    light: {
      palette: {
        primary: {
          50: '#fdf2ff',
          100: '#f0d4ff',
          200: '#e0b0ff',
          300: '#cc80ff',
          400: '#b44dff',
          500: '#a020f0',
          600: '#8916d6',
          700: '#7112b5',
          800: '#5a0f91',
          900: '#420b6e',
          solidBg: '#a020f0',
          solidHoverBg: '#8916d6',
          solidActiveBg: '#7112b5',
          softBg: 'rgba(160 32 240 / 0.08)',
          softColor: '#7112b5',
          softHoverBg: 'rgba(160 32 240 / 0.14)',
          softActiveBg: 'rgba(160 32 240 / 0.2)',
          plainColor: '#a020f0',
          plainHoverBg: 'rgba(160 32 240 / 0.08)',
          plainActiveBg: 'rgba(160 32 240 / 0.14)',
          outlinedColor: '#7112b5',
          outlinedBorder: 'rgba(160 32 240 / 0.18)',
          outlinedHoverBg: 'rgba(160 32 240 / 0.08)',
          outlinedActiveBg: 'rgba(160 32 240 / 0.14)',
        },
        neutral: {
          plainColor: '#1a1528',
          solidBg: '#1a1528',
          solidHoverBg: '#120e20',
          softBg: 'rgba(160 32 240 / 0.06)',
          softHoverBg: 'rgba(160 32 240 / 0.14)',
          softActiveBg: 'rgba(160 32 240 / 0.2)',
          plainHoverBg: 'rgba(160 32 240 / 0.08)',
          plainActiveBg: 'rgba(160 32 240 / 0.14)',
          outlinedBorder: 'rgba(80 50 120 / 0.14)',
        },
        text: {
          primary: '#1a1528',
          secondary: '#4a3d64',
          tertiary: '#7a6d94',
          icon: '#5e4f78',
        },
        background: {
          body: '#faf6ff',
          popup: '#ffffff',
          surface: 'rgba(255 255 255 / 0.92)',
          level1: 'rgba(255 255 255 / 0.82)',
          level2: 'rgba(248 242 255 / 0.94)',
        },
        divider: 'rgba(120 60 200 / 0.1)',
      },
    },
    dark: {
      palette: {
        primary: {
          50: '#faf0ff',
          100: '#f0d4ff',
          200: '#dba8ff',
          300: '#c77dff',
          400: '#b44dff',
          500: '#a020f0',
          600: '#8916d6',
          700: '#7112b5',
          800: '#5a0f91',
          900: '#420b6e',
          solidBg: '#a020f0',
          solidHoverBg: '#b44dff',
          solidActiveBg: '#c77dff',
          softBg: 'rgba(160 32 240 / 0.14)',
          softColor: '#e0b0ff',
          softHoverBg: 'rgba(160 32 240 / 0.22)',
          softActiveBg: 'rgba(160 32 240 / 0.28)',
          plainColor: '#dba8ff',
          plainHoverBg: 'rgba(160 32 240 / 0.12)',
          plainActiveBg: 'rgba(160 32 240 / 0.18)',
          outlinedColor: '#e0b0ff',
          outlinedBorder: 'rgba(160 32 240 / 0.22)',
          outlinedHoverBg: 'rgba(160 32 240 / 0.12)',
          outlinedActiveBg: 'rgba(160 32 240 / 0.18)',
        },
        neutral: {
          plainColor: '#ede6f8',
          solidBg: '#16102a',
          solidHoverBg: '#201840',
          softBg: 'rgba(160 32 240 / 0.08)',
          softHoverBg: 'rgba(160 32 240 / 0.18)',
          softActiveBg: 'rgba(160 32 240 / 0.26)',
          plainHoverBg: 'rgba(160 32 240 / 0.12)',
          plainActiveBg: 'rgba(160 32 240 / 0.18)',
          outlinedBorder: 'rgba(180 140 240 / 0.14)',
        },
        text: {
          primary: '#f2ecfc',
          secondary: '#c8bce0',
          tertiary: '#a094b8',
          icon: '#c0b4d8',
        },
        background: {
          body: '#08051a',
          popup: '#14102a',
          surface: 'rgba(16 12 28 / 0.96)',
          level1: 'rgba(12 8 24 / 0.96)',
          level2: 'rgba(24 16 44 / 0.94)',
        },
        divider: 'rgba(160 120 240 / 0.1)',
      },
    },
  },
  components: {
    JoyButton: {
      styleOverrides: {
        root: ({ ownerState, theme }) => ({
          borderRadius: '999px',
          fontWeight: 600,
          letterSpacing: '-0.01em',
          transition: 'box-shadow 0.15s ease, background 0.15s ease',
          ...(ownerState.variant === 'solid' && {
            background: 'linear-gradient(135deg, #a020f0 0%, #d040a0 100%)',
            boxShadow: '0 2px 8px rgba(160 32 240 / 0.2)',
            '&:hover': {
              background: 'linear-gradient(135deg, #8916d6 0%, #c03090 100%)',
              boxShadow: '0 4px 16px rgba(160 32 240 / 0.28)',
            },
            '&:active': {
              boxShadow: '0 2px 6px rgba(160 32 240 / 0.2)',
            },
          }),
        }),
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
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(20 12 32 / 0.8)' : 'rgba(255 255 255 / 0.88)',
          backdropFilter: 'blur(20px) saturate(140%)',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
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
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(20 12 32 / 0.8)' : 'rgba(255 255 255 / 0.88)',
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
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(20 12 32 / 0.82)' : 'rgba(255 255 255 / 0.9)',
          backdropFilter: 'blur(24px) saturate(150%)',
          boxShadow: 'inset 0 1px 0 rgba(255 255 255 / 0.1)',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
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
          backgroundColor: theme.palette.mode === 'dark' ? '#1a1430' : '#ffffff',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(160 120 240 / 0.16)' : 'rgba(120 60 200 / 0.1)'}`,
          boxShadow: theme.palette.mode === 'dark'
            ? '0 8px 32px rgba(0 0 0 / 0.5), 0 2px 8px rgba(0 0 0 / 0.3)'
            : '0 8px 32px rgba(80 40 140 / 0.12), 0 2px 8px rgba(80 40 140 / 0.06)',
        }),
      },
    },

    JoyBadge: {
      styleOverrides: {
        badge: ({ ownerState }) =>
          (ownerState.color as any) !== 'color-feature' ? undefined : ({
            background: 'linear-gradient(135deg, #d946ef, #a020f0)',
          }),
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
  },
});

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
