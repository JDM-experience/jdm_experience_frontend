import type { ReactNode } from 'react';

/** One entry maps to one `<Route>`. Omit `path` and set `index: true` for the layout's index route. */
export interface AppRoute {
  path?: string;
  index?: boolean;
  element: ReactNode;
}
