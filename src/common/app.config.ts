*/
export const Brand = {
  Title: {
    Base: 'AI Tutor Plus',
    Common: (process.env.NODE_ENV === 'development' ? '[DEV] ' : '') + 'big-AGI',
  },
  Meta: {
    Description: 'AI web interface to help you learn, think, and do. AI personas, superior privacy, advanced features, and fun UX.',
    SiteName: 'AI Tutor | Unlock AI Tools',
    ThemeColor: '#6a0083',
    TwitterSite: '@tsi_org',
  },
  URIs: {
    Home: 'https://myapps.ai',
    // App: 'https://get.big-agi.com',
    CardImage: 'https://big-agi.com/icons/card-dark-1200.png',
    OpenRepo: 'https://github.com/enricoros/big-agi',
	@@ -27,4 +27,4 @@ export const Brand = {
    // Twitter: 'https://www.twitter.com/enricoros',
    PrivacyPolicy: 'https://big-agi.com/privacy',
  },
};
