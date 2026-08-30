import { fireEvent, render, screen } from '@testing-library/react';
import * as Menu from '@ariakit/react/menu';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { HelpSubmenu } from '../AccountSettings';

jest.mock('~/hooks', () => ({
  useLocalize: () => (key: string) =>
    ({
      com_nav_help: 'Help',
      com_nav_help_faq: 'Help & FAQ',
      com_shortcut_keyboard_shortcuts: 'Keyboard shortcuts',
    })[key] ?? key,
}));

function Location() {
  const location = useLocation();
  return <span>{location.pathname}</span>;
}

describe('HelpSubmenu', () => {
  it('opens the in-app help route', () => {
    render(
      <MemoryRouter initialEntries={['/c/new']}>
        <Menu.MenuProvider>
          <Menu.Menu>
            <HelpSubmenu onShowShortcuts={jest.fn()} />
          </Menu.Menu>
        </Menu.MenuProvider>
        <Routes>
          <Route path="*" element={<Location />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText('Help'));
    fireEvent.click(screen.getByText('Help & FAQ'));

    expect(screen.getByText('/help')).toBeInTheDocument();
  });
});
