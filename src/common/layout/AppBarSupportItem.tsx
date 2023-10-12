import * as React from 'react';

import { Button, SvgIcon, Tooltip } from '@mui/joy';
import { SxProps } from '@mui/joy/styles/types';
// import GitHubIcon from '@mui/icons-material/GitHub';

// import { Brand } from '../brand';
import { Link } from '../components/Link';
import { cssRainbowColorKeyframes } from '../theme';


// missing from MUI, using Tabler for Discord
export function DiscordIcon(props: { sx?: SxProps }) {
  return <SvgIcon viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path d="M4 13h6a1 1 0 001-1V4a1 1 0 00-1-1H4a1 1 0 00-1 1v8a1 1 0 001 1zm-1 7a1 1 0 001 1h6a1 1 0 001-1v-4a1 1 0 00-1-1H4a1 1 0 00-1 1v4zm10 0a1 1 0 001 1h6a1 1 0 001-1v-7a1 1 0 00-1-1h-6a1 1 0 00-1 1v7zm1-10h6a1 1 0 001-1V4a1 1 0 00-1-1h-6a1 1 0 00-1 1v5a1 1 0 001 1z" fill="currentColor" />
    </SvgIcon>;
}


export function BringTheLove(props: { text: string, link: string, icon?: React.JSX.Element, sx?: SxProps }) {
  const [loved, setLoved] = React.useState(false);
  const icon = loved ? '❤️' : props.icon ?? null; // '❤️' : '🤍';
  return <Tooltip title={props.text}><Button
    variant='solid' color='neutral' size='md'
    component={Link} noLinkStyle href={props.link} target='_blank'
    onClick={() => setLoved(true)}
    // endDecorator={icon}
    sx={{
      background: 'transparent',
      // '&:hover': { background: props.theme.palette.neutral.solidBg },
      '&:hover': { animation: `${cssRainbowColorKeyframes} 5s linear infinite` },
      ...(props.sx ? props.sx : {}),
    }}>
    {/*{props.text || icon}*/}
    {icon}
  </Button></Tooltip>;
}

/*
export function AppBarSupportItem() {
  const theme = useTheme();
  const fadedColor = theme.palette.neutral.plainDisabledColor;
  const iconColor = '';
  return (
    <ListItem
      variant='solid' color='neutral'
      sx={{
        // background: theme.palette.neutral.solidActiveBg,
        display: 'flex', flexDirection: 'row', gap: 1,
        justifyContent: 'space-between',
      }}>
      <BringTheLove text={Brand.Title.Base} link={Brand.URIs.Home} sx={{ color: fadedColor }} />
      <BringTheLove text='Discord' icon={<DiscordIcon sx={{ color: iconColor }} />} link={Brand.URIs.SupportInvite} />
      <BringTheLove text='GitHub' icon={<GitHubIcon sx={{ color: iconColor }} />} link={Brand.URIs.OpenRepo} />
    </ListItem>
  );
}
*/