import * as React from 'react';
import { useShallow } from 'zustand/react/shallow';

import { Box, Button, FormControl, Tooltip, Typography } from '@mui/joy';

import type { ThemeGradientId } from '~/common/app.theme';
import { THEME_GRADIENT_MORE, THEME_GRADIENT_RECOMMENDED, THEME_GRADIENTS } from '~/common/app.theme';
import { FormLabelStart } from '~/common/components/forms/FormLabelStart';
import { useUIPreferencesStore } from '~/common/stores/store-ui';

const SWATCH_GRID_SX = {
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: 0.75,
} as const;

function ThemeSwatchGrid(props: {
  ids: ThemeGradientId[];
  themeGradientId: ThemeGradientId;
  onSelect: (id: ThemeGradientId) => () => void;
}) {
  return (
    <Box sx={SWATCH_GRID_SX}>
      {props.ids.map((id) => {
        const g = THEME_GRADIENTS[id];
        const selected = props.themeGradientId === id;
        return (
          <Tooltip key={id} title={g.label} placement="top">
            <Box
              component="button"
              type="button"
              aria-label={`Theme: ${g.label}`}
              aria-pressed={selected}
              onClick={props.onSelect(id)}
              sx={{
                position: 'relative',
                border: 'none',
                borderRadius: 'sm',
                height: 32,
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
  );
}

export function SettingUITheme() {
  const [themeGradientId, setThemeGradientId] = useUIPreferencesStore(
    useShallow((state) => [state.themeGradientId, state.setThemeGradientId])
  );
  const [showMore, setShowMore] = React.useState(() => THEME_GRADIENT_MORE.includes(themeGradientId));

  const handleSelect = React.useCallback(
    (id: ThemeGradientId) => () => setThemeGradientId(id),
    [setThemeGradientId]
  );

  return (
    <FormControl>
      <FormLabelStart
        title="Theme"
        description="Accent color for buttons and highlights"
      />
      <Typography level="body-xs" sx={{ mt: 0.5, mb: 0.5, color: 'text.tertiary', fontWeight: 600 }}>
        Recommended
      </Typography>
      <ThemeSwatchGrid
        ids={THEME_GRADIENT_RECOMMENDED}
        themeGradientId={themeGradientId}
        onSelect={handleSelect}
      />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.5, mb: 0.5 }}>
        <Typography level="body-xs" sx={{ color: 'text.tertiary', fontWeight: 600 }}>
          More themes
        </Typography>
        <Button
          variant="plain"
          color="neutral"
          size="sm"
          onClick={() => setShowMore((v) => !v)}
          sx={{ minHeight: 0, py: 0.25, px: 1, fontSize: 'xs' }}
        >
          {showMore ? 'Hide' : 'Show'}
        </Button>
      </Box>
      {showMore && (
        <ThemeSwatchGrid
          ids={THEME_GRADIENT_MORE}
          themeGradientId={themeGradientId}
          onSelect={handleSelect}
        />
      )}
      <Typography level="body-xs" sx={{ mt: 1, color: 'text.tertiary' }}>
        {THEME_GRADIENTS[themeGradientId]?.label ?? themeGradientId}
      </Typography>
    </FormControl>
  );
}
