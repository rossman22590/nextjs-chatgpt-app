import * as React from 'react';

import { AppAdmin } from '../src/apps/admin/AppAdmin';

import { withNextJSPerPageLayout } from '~/common/layout/withLayout';


export default withNextJSPerPageLayout({ type: 'optima' }, () => {
  return <AppAdmin />;
});
