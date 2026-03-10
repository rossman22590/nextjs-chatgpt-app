import * as React from 'react';

import type { SxProps } from '@mui/joy/styles/types';
import { Box, Button, ButtonGroup, FormControl, Typography } from '@mui/joy';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import PlusOneRoundedIcon from '@mui/icons-material/PlusOneRounded';
import StopRoundedIcon from '@mui/icons-material/StopRounded';

import { FormLabelStart } from '~/common/components/forms/FormLabelStart';
import { TooltipOutlined } from '~/common/components/TooltipOutlined';

import type { BeamStoreApi } from '../store-beam.hooks';
import { BEAM_BTN_SX, SCATTER_RAY_PRESETS } from '../beam.config';
import { BeamScatterDropdown } from './BeamScatterPaneDropdown';
import { beamPaneSx } from '../BeamCard';


const scatterPaneSx: SxProps = {
  ...beamPaneSx,
  backgroundColor: 'background.surface',
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 'lg',
  boxShadow: 'sm',
  rowGap: 'var(--Pad)',
};

const mobileScatterPaneSx: SxProps = scatterPaneSx;

const desktopScatterPaneSx: SxProps = {
  ...scatterPaneSx,

  // the fact that this works, means we got the CSS and layout right
  position: 'sticky',
  top: 0,
};

const _styles = {

  icon: {
    fontSize: '1rem',
    mr: 0.625,
  } as const,

  iconActive: {
    fontSize: '1rem',
    mr: 0.625,
    // NOTE: no reason to animate the color here, it's just a waste of power...
    // animation: `${animationColorBeamScatter} 2s linear infinite`,
    // ...and so we just fallback to the first color of the animation
    color: 'rgb(85, 140, 47)',
  } as const,

} as const;


export function BeamScatterPane(props: {
  beamStore: BeamStoreApi,
  isMobile: boolean,
  rayCount: number,
  setRayCount: (n: number) => void,
  showRayAdd: boolean
  startEnabled: boolean,
  startBusy: boolean,
  startRestart: boolean,
  onStart: (restart: boolean) => void,
  onStop: () => void,
  onExplainerShow: () => any,
}) {

  const dropdownMemo = React.useMemo(() => (
    <BeamScatterDropdown
      beamStore={props.beamStore}
      onExplainerShow={props.onExplainerShow}
    />
  ), [props.beamStore, props.onExplainerShow]);

  const { onStart, startRestart } = props;

  const handleStartClicked = React.useCallback((event: React.MouseEvent) => {
    onStart(!startRestart ? false : event.shiftKey);
  }, [onStart, startRestart]);

  return (
    <Box sx={props.isMobile ? mobileScatterPaneSx : desktopScatterPaneSx}>

      {/* Title */}
      <Box>
        <Typography level='h4' component='h3' endDecorator={dropdownMemo} fontWeight='lg'>
          {props.startBusy
            ? <AutoAwesomeIcon sx={_styles.iconActive} />
            : <AutoAwesomeOutlinedIcon sx={_styles.icon} />}
          Beam
        </Typography>
        <Typography level='body-sm' color='neutral' sx={{ whiteSpace: 'nowrap', mt: 0.25 }}>
          Explore different replies
        </Typography>
      </Box>

      {/* Ray presets */}
      <FormControl sx={{ my: '-0.25rem' }}>
        <FormLabelStart title='Beam count' />
        <ButtonGroup variant='outlined' size='sm' sx={{ borderRadius: 'md' }}>
          {SCATTER_RAY_PRESETS.map((n) => {
            const isActive = n === props.rayCount;
            return (
              <Button
                key={n}
                color={isActive ? 'primary' : 'neutral'}
                size='sm'
                onClick={() => props.setRayCount(n)}
                sx={{
                  backgroundColor: isActive ? 'primary.softBg' : 'background.level1',
                  fontWeight: isActive ? 600 : 400,
                  width: '3rem',
                  borderRadius: 'md',
                }}
              >
                {n}
              </Button>
            );
          })}
          {props.showRayAdd && (
            <Button
              color='neutral'
              size='sm'
              variant='outlined'
              onClick={() => props.setRayCount(props.rayCount + 1)}
              sx={{ width: '3rem', borderRadius: 'md' }}
            >
              <PlusOneRoundedIcon />
            </Button>
          )}
        </ButtonGroup>
      </FormControl>

      {/* Start / Stop buttons */}
      {!props.startBusy ? (
        <TooltipOutlined slowEnter title={startRestart ? 'Shift + Click to re-run active Beams' : null} placement='top-end'>
          <Button
            variant='solid'
            color='primary'
            disabled={!props.startEnabled || props.startBusy}
            loading={props.startBusy}
            endDecorator={<PlayArrowRoundedIcon />}
            onClick={handleStartClicked}
            sx={BEAM_BTN_SX}
          >
            Start
          </Button>
        </TooltipOutlined>
      ) : (
        <Button
          // key='scatter-stop'
          variant='solid' color='danger'
          endDecorator={<StopRoundedIcon />}
          onClick={props.onStop}
          sx={BEAM_BTN_SX}
        >
          Stop
          {/*{props.rayCount > props.raysReady && ` (${props.rayCount - props.raysReady})`}*/}
        </Button>
      )}

    </Box>
  );
}