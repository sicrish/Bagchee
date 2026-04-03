import React, { Suspense, lazy } from 'react';

const JoditEditor = lazy(() => import('jodit-react'));

const LazyJoditEditor = React.forwardRef((props, ref) => (
  <Suspense fallback={<div className="w-full h-40 bg-gray-100 rounded animate-pulse" />}>
    <JoditEditor ref={ref} {...props} />
  </Suspense>
));

LazyJoditEditor.displayName = 'LazyJoditEditor';

export default LazyJoditEditor;
