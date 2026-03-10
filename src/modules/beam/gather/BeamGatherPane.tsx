import * as React from 'react';
import { useShallow } from 'zustand/react/shallow';

import type { ColorPaletteProp, SxProps } from '@mui/joy/styles/types';
import { Box, Button, ButtonGroup, FormControl, Typography } from '@mui/joy';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';

import { LLM_IF_OAI_Reasoning } from '~/common/stores/llms/llms.types';
import { animationColorBeamGather } from '~/common/util/animUtils';
import { useLLMSelect } from '~/common/components/forms/useLLMSelect';

import { BeamStoreApi, useBeamStore } from '../store-beam.hooks';
import { CUSTOM_FACTORY_ID, FFactoryId, FUSION_FACTORIES } from './instructions/beam.gather.factories';
import { BEAM_SHOW_REASONING_ICON, GATHER_COLOR } from '../beam.config';
import { beamPaneSx } from '../BeamCard';
import { useModuleBeamStore } from '../store-module-beam';


const gatherPaneClasses = {
  busy: 'gatherPane-Busy',
  ready: 'gatherPane-Ready',
};

const gatherPaneSx: SxProps = {
  ...beamPaneSx,
  border: '1px solid',
  borderColor: 'divider',
  borderRadius: 'lg',
  backgroundColor: 'background.surface',
  boxShadow: 'sm',
  [`&.${gatherPaneClasses.ready}`]: {
    backgroundColor: 'background.surface',
    borderColor: 'divider',
  },
};

const mobileGatherPaneSx: SxProps = {
  ...gatherPaneSx,

  // [mobile] larger gap in between rows, as on mobile we have a smaller gap
  rowGap: 'var(--Pad)',
};

const desktopGatherPaneSx: SxProps = {
  ...gatherPaneSx,

  // [desktop] keep visible at the bottom
  position: 'sticky',
  bottom: 0,
  top: 0,
};


export function BeamGatherPane(props: {
  beamStore: BeamStoreApi,
  canGather: boolean,
  isMobile: boolean,
  // onAddFusion: () => void,
  raysReady: number,
}) {


  // external state
  // const { setStickToBottom } = useScrollToBottom();
  const {
    currentFactoryId, currentGatherLlmId, isGatheringAny, hasFusions,
    setCurrentFactoryId, setCurrentGatherLlmId,
  } = useBeamStore(props.beamStore, useShallow(state => ({
    // state
    // currentFactory: findFusionFactory(state.currentFactoryId),
    currentFactoryId: state.currentFactoryId,
    currentGatherLlmId: state.currentGatherLlmId,
    isGatheringAny: state.isGatheringAny,
    hasFusions: state.fusions.length > 0,

    // actions
    setCurrentFactoryId: state.setCurrentFactoryId,
    setCurrentGatherLlmId: state.setCurrentGatherLlmId,
  })));
  const gatherAutoStartAfterScatter = useModuleBeamStore(state => state.gatherAutoStartAfterScatter);
  const disableUnlessAutoStart = !props.canGather && !gatherAutoStartAfterScatter;
  const [llmOrNull, gatherLlmComponent] = useLLMSelect(currentGatherLlmId, setCurrentGatherLlmId, {
    label: props.isMobile ? '' : 'Merge Model',
    disabled: disableUnlessAutoStart,
    showStarFilter: true,
  });

  // derived state
  const llmShowReasoning = !BEAM_SHOW_REASONING_ICON ? false : llmOrNull?.interfaces?.includes(LLM_IF_OAI_Reasoning) ?? false;
  // const isNoFactorySelected = currentFactoryId === null;

  // const CurrentFactoryIcon = currentFactory?.Icon ?? null;
  // const currentFactoryDescription = currentFactory?.description ?? '';

  const handleFactoryActivate = React.useCallback((factoryId: FFactoryId, shiftPressed: boolean) => {
    // setStickToBottom(true);
    setCurrentFactoryId((factoryId !== currentFactoryId || !shiftPressed) ? factoryId : null);
  }, [currentFactoryId, setCurrentFactoryId]);


  const MainLlmIcon = /*gatherLlmIcon ||*/ (isGatheringAny ? AutoAwesomeIcon : AutoAwesomeOutlinedIcon);

  return (
    <Box
      className={`${props.canGather ? gatherPaneClasses.ready : ''} ${isGatheringAny ? gatherPaneClasses.busy : ''}`}
      sx={props.isMobile ? mobileGatherPaneSx : desktopGatherPaneSx}
    >

      {/* Title */}
      <Box>
        <Typography
          level='h4'
          component='h3'
          fontWeight='lg'
          sx={(props.canGather || hasFusions || isGatheringAny) ? undefined : { color: 'text.tertiary', ['& > svg']: { color: 'text.tertiary' } }}
        >
          <MainLlmIcon sx={{ fontSize: '1rem', mr: 0.625, animation: isGatheringAny ? `${animationColorBeamGather} 2s linear infinite` : undefined }} />
          Merge
        </Typography>
        <Typography level='body-sm' color='neutral' sx={{ whiteSpace: 'nowrap', mt: 0.25 }}>
          {props.canGather ? `Combine the ${props.raysReady} replies` : ''}
        </Typography>
      </Box>

      {/* Method */}
      <FormControl sx={{ my: '-0.25rem' }}>
        <ButtonGroup variant='outlined' size='sm' disabled={disableUnlessAutoStart} sx={{ borderRadius: 'md' }}>
          {FUSION_FACTORIES.map(factory => {
            const { factoryId, shortLabel } = factory;
            const isActive = factoryId === currentFactoryId;
            const buttonColor: ColorPaletteProp = isActive ? GATHER_COLOR : 'neutral';
            return (
              <Button
                key={'factory-' + factoryId}
                color={buttonColor}
                onClick={event => handleFactoryActivate(factoryId, !!event?.shiftKey)}
                sx={{
                  backgroundColor: isActive ? `${buttonColor}.softBg` : 'background.level1',
                  borderRadius: 'md',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {shortLabel}
              </Button>
            );
          })}
        </ButtonGroup>
      </FormControl>

      {/* Display a Reasoning LLM */}
      {(BEAM_SHOW_REASONING_ICON && llmShowReasoning) ? '🧠' : null}

      {/* LLM - hidden for Custom since each fusion has its own LLM selector */}
      {currentFactoryId !== CUSTOM_FACTORY_ID && (
        <Box sx={{ my: '-0.25rem', minWidth: 190, maxWidth: 300 }}>
          {gatherLlmComponent}
        </Box>
      )}

      {/* Add Fusion */}
      {/*<FusionAddButton*/}
      {/*  textOverride='Add'*/}
      {/*  canGather={props.canGather}*/}
      {/*  currentFactory={currentFactory}*/}
      {/*  onAddFusion={props.onAddFusion}*/}
      {/*  sx={BEAM_BTN_SX}*/}
      {/*/>*/}

      {/* pad */}
      <Box />

    </Box>
  );
}