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
    Common: (process.env.NODE_ENV === 'development' ? '[DEV] ' : '') + 'AI Tutor Ultra',
  },
  Meta: {
    Description: 'Launch our app to unlock the full potential of AI, with precise control over your data and models. Voice interface, AI personas, advanced features, and fun UX.',
    SiteName: 'AI Tutor  | Muliti LLM AI for You',
    ThemeColor: '#030712',
    TwitterSite: '@tsi_org',
  },
  URIs: {
    Home: 'https://myapps.ai',
    // App: 'https://get.big-agi.com',
    CardImage: 'https://img.mytsi.org/i/2wWp518.png',
    OpenRepo: 'https://support.myapps.ai',
    OpenProject: 'https://docs.myapps.ai',
    SupportInvite: 'https://discord.gg/XZ8XDQQT6K',
    // Twitter: 'https://www.twitter.com/enricoros',
    PrivacyPolicy: 'https://support.myapps.ai',
    TermsOfService: 'https://support.myapps.ai',
  },
  Docs: {
    Public: (docPage: string) => `https://support.myapps.ai`,
  }
} as const;
