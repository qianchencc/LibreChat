import { MemoryRouter } from 'react-router-dom';
import { render, waitFor } from '@testing-library/react';
import VerifyEmail from '~/components/Auth/VerifyEmail';

const mockVerifyEmail = jest.fn();
const mockResendEmail = jest.fn();

jest.mock('@librechat/client', () => ({
  Button: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  Spinner: () => <div />,
  ThemeSelector: () => <div />,
}));

jest.mock('~/data-provider', () => ({
  useVerifyEmailMutation: () => ({ isLoading: false, mutate: mockVerifyEmail }),
  useResendVerificationEmail: () => ({ isLoading: false, mutate: mockResendEmail }),
}));

const mockLocalize = jest.fn((key: string) => key);

jest.mock('~/hooks', () => ({
  useLocalize: () => mockLocalize,
}));

test('submits each verification link only once across rerenders', async () => {
  const view = render(
    <MemoryRouter initialEntries={['/verify?token=valid-token&email=user%40example.com']}>
      <VerifyEmail />
    </MemoryRouter>,
  );

  await waitFor(() => expect(mockVerifyEmail).toHaveBeenCalledTimes(1));

  view.rerender(
    <MemoryRouter initialEntries={['/verify?token=valid-token&email=user%40example.com']}>
      <VerifyEmail />
    </MemoryRouter>,
  );

  await waitFor(() => expect(mockVerifyEmail).toHaveBeenCalledTimes(1));
});
