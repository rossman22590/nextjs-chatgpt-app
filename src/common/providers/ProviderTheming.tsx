import * as React from 'react';

import { CacheProvider, EmotionCache } from '@emotion/react';
import { CssBaseline, CssVarsProvider, useTheme } from '@mui/joy';

import { VendorIconSpriteMemo } from '~/modules/llms/components/LLMVendorIconSprite';

import { createAppTheme, createEmotionCache } from '~/common/app.theme';
import { useThemeGradientId, useUIComplexityIsMinimal } from '~/common/stores/store-ui';


/** Syncs body background to the chosen theme (body is outside the theme provider). */
const ThemeBodySync = () => {
  const theme = useTheme();
  const body = theme.palette.background?.body;
  const surface = theme.palette.background?.surface;
  const level2 = theme.palette.background?.level2;
  const mode = theme.palette.mode;
  React.useEffect(() => {
    if (body) document.body.style.setProperty('--agi-body-bg', body);
    if (body && surface && level2) {
      const ambient = mode === 'dark'
        ? `linear-gradient(180deg, ${body} 0%, ${surface} 50%, ${level2} 100%)`
        : `linear-gradient(180deg, rgba(255,255,255,0.92), ${body} 40%, ${level2} 100%)`;
      document.body.style.setProperty('--agi-body-ambient', ambient);
    }
    return () => {
      document.body.style.removeProperty('--agi-body-bg');
      document.body.style.removeProperty('--agi-body-ambient');
    };
  }, [body, surface, level2, mode]);
  return null;
};

/** When Minimal (neutral) theme: user message bubble is solid, no gradient. */
const ThemeMinimalMessageSync = () => {
  const theme = useTheme();
  const themeGradientId = useThemeGradientId();
  const mode = theme.palette.mode;
  React.useEffect(() => {
    if (themeGradientId === 'neutral') {
      const solid = mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
      document.body.style.setProperty('--agi-message-user', solid);
    } else {
      document.body.style.removeProperty('--agi-message-user');
    }
    return () => document.body.style.removeProperty('--agi-message-user');
  }, [themeGradientId, mode]);
  return null;
};


// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();


/**
 * As part of the theming, we define global SVG filters here. This will add
 * texture and tactileness to the design. They should be in the appTheme file,
 * but I did not want to have react components in that file.
 */
const _GlobalSVGFiltersMemo = React.memo(function GlobalSVGFilters() {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        {/*<filter id='agi-roughpaper'>*/}
        {/*  <feTurbulence type='fractalNoise' baseFrequency='0.04' result='noise' numOctaves='5' />*/}
        {/*  <feDiffuseLighting in='noise' lightingColor='#fff' surfaceScale='2'>*/}
        {/*    <feDistantLight azimuth='45' elevation='60' />*/}
        {/*  </feDiffuseLighting>*/}
        {/*</filter>*/}

        {/*<filter id='agi-futuristic-glow'>*/}
        {/*  <feGaussianBlur in='SourceGraphic' stdDeviation='4' result='blur' />*/}
        {/*  <feColorMatrix in='blur' mode='matrix' values='1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 40 -7' result='glow' />*/}
        {/*  <feBlend in='SourceGraphic' in2='glow' mode='multiply' />*/}
        {/*</filter>*/}

        {/*<filter id='agi-holographic'>*/}
        {/*  <feTurbulence type='fractalNoise' baseFrequency='0.01' numOctaves='7' result='noise' />*/}
        {/*  <feDisplacementMap in='SourceGraphic' in2='noise' scale='50' xChannelSelector='R' yChannelSelector='G' />*/}
        {/*</filter>*/}

        {/*<filter id='agi-ai-texture'>*/}
        {/*  <feTurbulence type='fractalNoise' baseFrequency='1' numOctaves='1' />*/}
        {/*  <feColorMatrix type='saturate' values='0.2' />*/}
        {/*  <feBlend in='SourceGraphic' mode='multiply' />*/}
        {/*</filter>*/}
      </defs>
    </svg>
  );
});


export const ProviderTheming = (props: { emotionCache?: EmotionCache, children: React.ReactNode }) => {

  // external state
  const zenMode = useUIComplexityIsMinimal();
  const themeGradientId = useThemeGradientId();

  // recreate the theme when zen or gradient preference changes
  const theme = React.useMemo(() => createAppTheme(zenMode, themeGradientId), [zenMode, themeGradientId]);

  return (
    <CacheProvider value={props.emotionCache || clientSideEmotionCache}>
      <CssVarsProvider defaultMode='light' theme={theme}>
        <CssBaseline />
        <ThemeBodySync />
        <ThemeMinimalMessageSync />
        {/* Inject sprites to be referenced by SVG rendering */}
        <VendorIconSpriteMemo />
        {/* Disabled for now, we don't use those */}
        {/*<_GlobalSVGFiltersMemo />*/}
        {props.children}
      </CssVarsProvider>
    </CacheProvider>
  );
};