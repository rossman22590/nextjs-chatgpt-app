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
    Base: 'AI Tutor',
    Common: (process.env.NODE_ENV === 'development' ? '[DEV] ' : '') + 'AI Tutor',
  },
  Meta: {
    Description: 'Leading AI web interface to help you learn, think, and do. AI personas, superior privacy, advanced features, and fun UX.',
    SiteName: 'AI Tutor Plus',
    ThemeColor: '#d923b4',
    TwitterSite: '@tsi_org',
  },
  URIs: {
    Home: 'https://myapps.ai',
    // App: 'https://get.big-agi.com',
    CardImage: 'https://myapps.ai/images/gfx/feature/tutorai_screenshot1.png',
    OpenRepo: 'https://account.myapps.ai/dashboard',
    SupportInvite: 'https://account.myapps.ai/dashboard',
    // Twitter: 'https://www.twitter.com/enricoros',
  },
};
