/**
 * @jest-environment @happy-dom/jest-environment
 */
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { LandingGate } from '../LandingRoute';

let mockAuthState = { isAuthenticated: false, isAuthReady: false };

jest.mock('~/hooks/AuthContext', () => ({
  AuthContextProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuthContext: () => mockAuthState,
}));

jest.mock('~/components/Landing', () => () => <main>Public landing</main>);

describe('LandingGate', () => {
  it('keeps the landing visible while optional auth is resolving', () => {
    mockAuthState = { isAuthenticated: false, isAuthReady: false };

    render(
      <MemoryRouter initialEntries={['/']}>
        <LandingGate />
      </MemoryRouter>,
    );

    expect(screen.getByText('Public landing')).toBeInTheDocument();
  });

  it('keeps the landing visible for an authenticated visitor', () => {
    mockAuthState = { isAuthenticated: true, isAuthReady: true };

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<LandingGate />} />
          <Route path="/c/new" element={<main>New conversation</main>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Public landing')).toBeInTheDocument();
    expect(screen.queryByText('New conversation')).not.toBeInTheDocument();
  });
});
