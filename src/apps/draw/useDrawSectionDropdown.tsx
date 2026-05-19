import * as React from 'react';
import Image from 'next/image';

import { Box, Button } from '@mui/joy';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

import { Brand } from '~/common/app.config';
import { OptimaBarDropdownMemo, OptimaDropdownItems } from '~/common/layout/optima/bar/OptimaBarDropdown';
import { Link } from '~/common/components/Link';
import { ROUTE_INDEX } from '~/common/app.routes';


export type DrawSection = 'create' | 'browse' | 'media';

const drawDropdownItems: OptimaDropdownItems = {
  create: {
    title: 'Create Images',
  },
  browse: {
    title: 'View Gallery',
  },
  media: {
    title: 'App Media',
  },
};


function DrawSectionDropdown(props: {
  drawSection: DrawSection | null,
  setDrawSection: (drawSection: DrawSection | null) => void,
}) {

  const { setDrawSection } = props;

  const handleSystemPurposeChange = React.useCallback((value: string | null) => {
    setDrawSection(value as (DrawSection | null));
  }, [setDrawSection]);

  return (
    <OptimaBarDropdownMemo
      items={drawDropdownItems}
      value={props.drawSection}
      onChange={handleSystemPurposeChange}
    />
  );

}

export function useDrawSectionDropdown(remainingJobs: number, cancelAllJobs: () => void) {
  // state
  const [drawSection, setDrawSection] = React.useState<DrawSection | null>('create');

  const drawSectionDropdown = React.useMemo(() => (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1,
    }}>
      <Link href={ROUTE_INDEX}>
        <Image src="/apple-touch-icon.png" alt={Brand.Title.Base} width={32} height={32} />
      </Link>

      <DrawSectionDropdown
        drawSection={drawSection}
        setDrawSection={setDrawSection}
      />

      {/* Button to cancel pending Jobs from the UI (running and queued) */}
      {!!remainingJobs && (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button size='sm' color='danger' variant='soft' onClick={cancelAllJobs} sx={{ my: 0 }}>
            {remainingJobs} · <CloseRoundedIcon />
          </Button>
        </Box>
      )}

    </Box>
  ), [cancelAllJobs, drawSection, remainingJobs]);

  return { drawSection, drawSectionDropdown };
}
