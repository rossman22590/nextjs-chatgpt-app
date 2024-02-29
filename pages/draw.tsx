import * as React from 'react';

import { App } from '../src/apps/draw/AppDraw';

import { withLayout } from '~/common/layout/withLayout';


export default function DrawPage() {
  return withLayout({ type: 'optima' }, <AppDraw />);
}