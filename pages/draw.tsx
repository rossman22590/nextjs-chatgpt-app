import * as React from 'react';
import { AppDraw } from '../src/apps/draw/AppDraw'; // Corrected import statement
import { withLayout } from '~/common/layout/withLayout';

export default function DrawPage() {
  return withLayout({ type: 'optima' }, <AppDraw />);
}
