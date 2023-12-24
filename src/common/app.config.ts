/**
 * Application Identity (Brand)
 *
 * Also note that the 'Brand' is used in the following places:
 *  - README.md               all over
 *  - package.json            app-slug and version
 *  - [public/manifest.json]  name, short_name, description, theme_color, background_color
 */
export const Brand = {
  Title: {
    Base: 'Plus',
    Common: (process.env.NODE_ENV === 'development' ? '[DEV] ' : '') + 'Plus',
  },
  Meta: {
    Description: 'Launch our app to unlock the full potential of AI, with precise control over your data and models. Voice interface, AI personas, advanced features, and fun UX.',
    SiteName: 'Ai Tutor Plus | Precision AI for You',
    ThemeColor: '#32383E',
    TwitterSite: '@tsi_org',
  },
  URIs: {
    Home: 'https://myapps.ai',
    // App: 'https://get.big-agi.com',
    CardImage: 'https://big-agi.com/icons/card-dark-1200.png',
    OpenRepo: 'https://myapps.ai',
    OpenProject: 'https://github.com/users/enricoros/projects/4',
    SupportInvite: 'https://discord.gg/kgp43BEX',
    // Twitter: 'https://www.twitter.com/enricoros',
    PrivacyPolicy: 'https://big-agi.com/privacy',
  },
};
