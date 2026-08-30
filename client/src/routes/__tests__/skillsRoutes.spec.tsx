import React from 'react';
import { matchRoutes } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';

jest.mock('~/components/Auth', () => ({
  Login: () => null,
  VerifyEmail: () => null,
  Registration: () => null,
  ResetPassword: () => null,
  ApiErrorWatcher: () => null,
  TwoFactorScreen: () => null,
  RequestPasswordReset: () => null,
}));

jest.mock('~/components/Agents/MarketplaceContext', () => ({
  MarketplaceProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('~/components/Agents/Marketplace', () => () => null);
jest.mock('~/components/OAuth', () => ({
  OAuthSuccess: () => null,
  OAuthError: () => null,
}));
jest.mock('~/hooks/AuthContext', () => ({
  AuthContextProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../RouteErrorBoundary', () => () => null);
jest.mock('../Layouts/Startup', () => () => null);
jest.mock('../Layouts/Login', () => () => null);
jest.mock('../Dashboard', () => ({
  __esModule: true,
  default: { path: 'dashboard', element: null },
}));
jest.mock('../ShareRoute', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('../ChatRoute', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('../Search', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('../Root', () => ({
  __esModule: true,
  default: () => null,
}));

import { router } from '../index';

function flattenPaths(routes: RouteObject[]): string[] {
  return routes.flatMap((route) => [
    ...(route.path ? [route.path] : []),
    ...(route.children ? flattenPaths(route.children) : []),
  ]);
}

describe('skills routes', () => {
  it('resolves the public root to the landing route', () => {
    const routes = router.routes as RouteObject[];
    const matches = matchRoutes(routes, '/');

    expect(matches?.at(-1)?.route.id).toBe('landing');
  });

  it('registers the explicit /skills/new route', () => {
    const paths = flattenPaths(router.routes as RouteObject[]);

    expect(paths).toContain('skills/new');
  });

  it('registers the authenticated help route', () => {
    const paths = flattenPaths(router.routes as RouteObject[]);

    expect(paths).toContain('help');
  });
});
