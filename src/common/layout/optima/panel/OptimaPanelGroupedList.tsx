import * as React from 'react';

import type { SxProps } from '@mui/joy/styles/types';
import { Box, Checkbox, MenuList } from '@mui/joy';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';

import { ExpanderControlledBox } from '~/common/components/ExpanderControlledBox';
import { adjustContentScaling, themeScalingMap } from '~/common/app.theme';
import { useIsMobile } from '~/common/components/useMatchMedia';
import { useUIContentScaling, useUIPanelGroupCollapsed, uiSetPanelGroupCollapsed } from '~/common/stores/store-ui';


const gutterSx: SxProps = {
  px: 'var(--ListItem-paddingX)',
  py: 'var(--ListItem-paddingY)',
  display: 'flex',
  flexDirection: 'column',
  gap: 1.5,
};

export function OptimaPanelGroupGutter(props: { children?: React.ReactNode }) {
  return (
    <Box sx={gutterSx}>
      {props.children}
    </Box>
  );
}


const _styles = {
  boxMTAuto: {
    mt: 'auto',
  },
  boxCollapsed: {
    mb: -2.5,
  },
  unfoldIcon: {
    mr: 0,
    color: 'neutral.softColor',
    fontSize: 'md',
  },
} as const satisfies Record<string, SxProps>;


const headerSx: SxProps = {
  background: 'var(--agi-shell-soft)',
  border: '1px solid var(--agi-shell-border)',
  borderRadius: '20px',
  boxShadow: '0 12px 30px rgba(99 56 150 / 0.06)',
  px: 'var(--ListItem-paddingX, 0.75rem)',
  py: 'calc(var(--ListItem-paddingY, 0.25rem) + 0.15rem)',
  minBlockSize: 'var(--ListItem-minHeight, 2.25rem)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 1,
  '&[role="button"]': {
    cursor: 'pointer',
    transition: 'transform 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 16px 36px rgba(99 56 150 / 0.1)',
    },
  },
  '&[aria-expanded="false"]': {
    background: 'var(--agi-shell-bg)',
    borderColor: 'var(--agi-shell-border)',
  },
};

const headerTitleSx: SxProps = {
  flexGrow: 1,
  color: 'text.secondary',
  fontWeight: 'lg',
  fontFamily: 'display',
  letterSpacing: '-0.03em',
};

const groupListSx: SxProps = {
  border: 'none',
  borderRadius: 0,
  background: 'transparent',
  flexGrow: 0,
  py: 0.5,
} as const;


export function OptimaPanelGroupedList(props: {
  title?: React.ReactNode;
  startDecorator?: React.ReactNode;
  children?: React.ReactNode;
  marginTopAuto?: boolean;
  hideExpandedCheckbox?: boolean;
  expanded?: boolean;
  onToggleExpanded?: () => void;
  persistentCollapsibleId?: string;
  persistentStartCollapsed?: boolean;
}) {

  const [internalExpanded, setInternalExpanded] = React.useState(props.persistentStartCollapsed !== true);

  const isMobile = useIsMobile();
  const contentScaling = adjustContentScaling(useUIContentScaling(), isMobile ? 1 : 0);
  const smallerContentScaling = adjustContentScaling(contentScaling, -1);

  const persistentCollapsed = useUIPanelGroupCollapsed(props.persistentCollapsibleId || null);

  const { onToggleExpanded } = props;
  const isControlled = props.expanded !== undefined;
  const isCollapsible = isControlled || !!props.persistentCollapsibleId;

  const isExpanded =
    isControlled ? props.expanded as boolean
      : !props.persistentCollapsibleId ? internalExpanded
        : persistentCollapsed !== undefined ? !persistentCollapsed
          : !props.persistentStartCollapsed;

  const handleToggle = React.useCallback(() => {
    if (isControlled)
      onToggleExpanded?.();
    else if (props.persistentCollapsibleId)
      uiSetPanelGroupCollapsed(props.persistentCollapsibleId, isExpanded);
    else
      setInternalExpanded(prev => !prev);
  }, [isControlled, onToggleExpanded, props.persistentCollapsibleId, isExpanded]);

  return (
    <Box sx={props.marginTopAuto ? _styles.boxMTAuto : isExpanded ? undefined : _styles.boxCollapsed}>

      {(!!props.title || isCollapsible) && (
        <Box
          aria-expanded={isExpanded}
          onClick={isCollapsible ? handleToggle : undefined}
          role={isCollapsible ? 'button' : undefined}
          sx={headerSx}
        >
          {props.startDecorator}
          <Box fontSize={smallerContentScaling} sx={headerTitleSx}>{props.title}</Box>
          {isCollapsible && props.hideExpandedCheckbox && !isExpanded && <UnfoldMoreIcon sx={_styles.unfoldIcon} />}
          {isCollapsible && !props.hideExpandedCheckbox && (
            <Checkbox
              size='md' variant='outlined' color='neutral'
              checked={isExpanded}
              readOnly
            />
          )}
        </Box>
      )}

      <ExpanderControlledBox expanded={isExpanded}>
        <MenuList size={themeScalingMap[contentScaling]?.optimaPanelGroupSize} sx={groupListSx}>
          {props.children}
        </MenuList>
      </ExpanderControlledBox>

    </Box>
  );
}
