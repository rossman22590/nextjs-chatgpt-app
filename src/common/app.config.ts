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
    Base: 'AI Tutor Plus',
    Common: (process.env.NODE_ENV === 'development' ? '[DEV] ' : '') + 'AI Tutor Plus',
  },
  Meta: {
    Description: 'Launch big-AGI to unlock the full potential of AI, with precise control over your data and models. Voice interface, AI personas, advanced features, and fun UX.',
    SiteName: 'big-AGI | Precision AI for You',
    ThemeColor: '#32383E',
    TwitterSite: '@enricoros',
  },
  URIs: {
    Home: 'https://myapps.ai',
    // App: 'https://get.big-agi.com',
    CardImage: 'https://big-agi.com/icons/card-dark-1200.png',
    OpenRepo: 'https://myapps.ai',
    OpenProject: 'https://myapps.ai4',
    SupportInvite: 'https://myapps.ai,
    // Twitter: 'https://www.twitter.com/tsi_org',
    PrivacyPolicy: 'https://big-agi.com/privacy',
  },
};

