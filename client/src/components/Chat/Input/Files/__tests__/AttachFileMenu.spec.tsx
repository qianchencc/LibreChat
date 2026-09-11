import React from 'react';
import { RecoilRoot } from 'recoil';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EModelEndpoint } from 'librechat-data-provider';
import AttachFileMenu from '../AttachFileMenu';

jest.mock('~/hooks', () => ({
  useAgentToolPermissions: jest.fn(),
  useFileHandlingNoChatContext: jest.fn(),
  useLocalize: jest.fn(),
}));

jest.mock('~/hooks/Files/useSharePointFileHandling', () => ({
  useSharePointFileHandlingNoChatContext: jest.fn(),
}));

jest.mock('~/data-provider', () => ({
  useGetStartupConfig: jest.fn(),
}));

jest.mock('~/components/SharePoint', () => ({
  SharePointPickerDialog: () => null,
}));

jest.mock('@ariakit/react', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react');
  return {
    MenuButton: ({ render }) => R.cloneElement(render),
  };
});

jest.mock('@librechat/client', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const R = require('react');
  return {
    FileUpload: R.forwardRef((props, ref) =>
      R.createElement(
        'div',
        { 'data-testid': 'file-upload' },
        props.children,
        R.createElement('input', {
          ref,
          multiple: true,
          type: 'file',
          'data-testid': 'file-input',
          onChange: props.handleFileChange,
        }),
      ),
    ),
    TooltipAnchor: (props) => props.render,
    DropdownPopup: (props) =>
      R.createElement(
        'div',
        { 'data-testid': 'source-popup' },
        R.createElement('div', { onClick: () => props.setIsOpen(!props.isOpen) }, props.trigger),
        props.isOpen &&
          props.items.map((item, index) =>
            R.createElement('button', { key: index, onClick: item.onClick }, item.label),
          ),
      ),
    AttachmentIcon: () => R.createElement('span'),
    SharePointIcon: () => R.createElement('span'),
  };
});

const hooks = jest.requireMock('~/hooks');
const mockUseGetStartupConfig = jest.requireMock('~/data-provider').useGetStartupConfig;
const mockUseSharePoint = jest.requireMock(
  '~/hooks/Files/useSharePointFileHandling',
).useSharePointFileHandlingNoChatContext;
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
let handleFileChange: jest.Mock;

const setup = ({
  provider = EModelEndpoint.openAI,
  sharePoint = false,
}: { provider?: string; sharePoint?: boolean } = {}) => {
  hooks.useAgentToolPermissions.mockReturnValue({ provider });
  hooks.useLocalize.mockReturnValue((key: string) => {
    const values: Record<string, string> = {
      com_files_upload_local_machine: 'Local machine',
      com_files_upload_sharepoint: 'SharePoint',
      com_sidepanel_attach_files: 'Attach Files',
    };
    return values[key] ?? key;
  });
  handleFileChange = jest.fn();
  hooks.useFileHandlingNoChatContext.mockReturnValue({ handleFileChange });
  mockUseSharePoint.mockReturnValue({
    handleSharePointFiles: jest.fn(),
    isProcessing: false,
    downloadProgress: 0,
  });
  mockUseGetStartupConfig.mockReturnValue({
    data: { sharePointFilePickerEnabled: sharePoint },
  });
};

const renderMenu = (props: Record<string, unknown> = {}) =>
  render(
    <QueryClientProvider client={queryClient}>
      <RecoilRoot>
        <AttachFileMenu
          conversationId="new"
          endpointType={EModelEndpoint.openAI}
          files={new Map()}
          setFiles={() => {}}
          setFilesLoading={() => {}}
          conversation={null}
          {...props}
        />
      </RecoilRoot>
    </QueryClientProvider>,
  );

describe('AttachFileMenu provider-only upload', () => {
  beforeEach(() => jest.clearAllMocks());

  it('opens the provider picker directly without destination choices', () => {
    setup();
    const inputClick = jest.spyOn(HTMLInputElement.prototype, 'click').mockImplementation();
    renderMenu();

    fireEvent.click(screen.getByRole('button', { name: 'Attach Files' }));

    expect(inputClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Upload as Text')).not.toBeInTheDocument();
    expect(screen.queryByText('Upload for File Search')).not.toBeInTheDocument();
    expect(screen.queryByText('Upload to Code Environment')).not.toBeInTheDocument();
    inputClick.mockRestore();
  });

  it('passes no tool resource when uploading', () => {
    setup();
    renderMenu();
    const file = new File(['data'], 'document.pdf', { type: 'application/pdf' });

    fireEvent.change(screen.getByTestId('file-input'), { target: { files: [file] } });

    expect(handleFileChange).toHaveBeenCalledWith(expect.any(Object), undefined);
  });

  it('limits an unsupported provider to images', () => {
    setup({ provider: 'unsupported' });
    let accept = '';
    const inputClick = jest
      .spyOn(HTMLInputElement.prototype, 'click')
      .mockImplementation(function capture(this: HTMLInputElement) {
        accept = this.accept;
      });
    renderMenu({ endpointType: 'unsupported' });

    fireEvent.click(screen.getByRole('button', { name: 'Attach Files' }));

    expect(accept).toBe('image/*,.heif,.heic');
    inputClick.mockRestore();
  });

  it('keeps SharePoint as a source choice without exposing destinations', () => {
    setup({ sharePoint: true });
    renderMenu();

    fireEvent.click(screen.getByRole('button', { name: 'Attach Files' }));

    expect(screen.getByRole('button', { name: 'Local machine' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'SharePoint' })).toBeInTheDocument();
    expect(screen.queryByText('Upload for File Search')).not.toBeInTheDocument();
  });

  it('honors the disabled state', () => {
    setup();
    renderMenu({ disabled: true });
    expect(screen.getByRole('button', { name: 'Attach Files' })).toBeDisabled();
  });
});
