import * as React from 'react';
import { useShallow } from 'zustand/react/shallow';

import { Box, FormControl, Tooltip, Typography } from '@mui/joy';

import type { ThemeGradientId } from '~/common/app.theme';
import { THEME_GRADIENTS } from '~/common/app.theme';
import { FormLabelStart } from '~/common/components/forms/FormLabelStart';
import { useUIPreferencesStore } from '~/common/stores/store-ui';

/** First = base/original theme; rest = variants by family (no duplicate gradient combos). */
const GRADIENT_IDS: ThemeGradientId[] = [
  'purple-pink',   // base/original
  'fuchsia-pink',
  'violet-rose',
  'lavender-plum',
  'blue-cyan',
  'sky-blue',
  'ice-blue',
  'slate-cyan',
  'emerald-teal',
  'lime-green',
  'forest-moss',
  'ocean-mint',
  'mint-emerald',
  'amber-orange',
  'rose-coral',
  'sunset-red',
  'coral-peach',
  'gold-amber',
  'indigo-violet',
  'berry-wine',
  'cotton-candy',
  'aurora',
  'peach-blossom',
  'tropical',
  'neon-dream',
  'sunset-glow',
  'mint-lemon',
  'lavender-haze',
  'ocean-depths',
  'berry-sorbet',
];

export function SettingUITheme() {
  const [themeGradientId, setThemeGradientId] = useUIPreferencesStore(
    useShallow((state) => [state.themeGradientId, state.setThemeGradientId])
  );

  const handleSelect = React.useCallback(
    (id: ThemeGradientId) => () => setThemeGradientId(id),
    [setThemeGradientId]
  );

  return (
    <FormControl>
      <FormLabelStart
        title="Theme"
        description="Choose a gradient for buttons and accents"
      />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(10, 1fr)',
          gap: 0.75,
          mt: 0.5,
        }}
      >
        {GRADIENT_IDS.map((id) => {
          const g = THEME_GRADIENTS[id];
          const selected = themeGradientId === id;
          return (
            <Tooltip key={id} title={g.label} placement="top">
              <Box
                component="button"
                type="button"
                aria-label={`Theme: ${g.label}`}
                aria-pressed={selected}
                onClick={handleSelect(id)}
                sx={{
                  position: 'relative',
                  border: 'none',
                  borderRadius: 'sm',
                  height: 28,
                  minWidth: 0,
                  cursor: 'pointer',
                  p: 0,
                  overflow: 'hidden',
                  background: `linear-gradient(135deg, ${g.start} 0%, ${g.end} 100%)`,
                  boxShadow: selected ? '0 0 0 2px var(--joy-palette-primary-outlinedBorder)' : 'none',
                  outline: 'none',
                  '&:focus-visible': {
                    boxShadow: '0 0 0 2px var(--joy-palette-primary-solidBg)',
                  },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 'inherit',
                    border: selected ? '2px solid rgba(255,255,255,0.9)' : '2px solid transparent',
                    transition: 'border-color 0.15s ease',
                  },
                }}
              />
            </Tooltip>
          );
        })}
      </Box>
      <Typography level="body-xs" sx={{ mt: 0.5, color: 'text.tertiary' }}>
        {THEME_GRADIENTS[themeGradientId]?.label ?? themeGradientId}
      </Typography>
    </FormControl>
  );
}
