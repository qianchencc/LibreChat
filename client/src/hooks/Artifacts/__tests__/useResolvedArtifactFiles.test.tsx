import React from 'react';
import { dataService } from 'librechat-data-provider';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useResolvedArtifactFiles from '../useResolvedArtifactFiles';
import { useAuthContext } from '~/hooks/AuthContext';

jest.mock('librechat-data-provider', () => {
  const actual = jest.requireActual('librechat-data-provider');
  return {
    ...actual,
    dataService: {
      ...actual.dataService,
      getFileDownloadURL: jest.fn(),
    },
  };
});

jest.mock('~/hooks/AuthContext', () => ({
  useAuthContext: jest.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useResolvedArtifactFiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthContext as jest.Mock).mockReturnValue({ user: { id: 'user-1' } });
  });

  it('resolves attachment references in the Sandpack working copy', async () => {
    (dataService.getFileDownloadURL as jest.Mock).mockResolvedValue({
      url: 'https://minio.example.com/file-1?signed=true',
      filename: 'photo.png',
      type: 'image/png',
      metadata: {},
    });

    const { result } = renderHook(
      () =>
        useResolvedArtifactFiles({
          files: { 'index.html': '<img src="attachment://file-1">' },
          fileKey: 'index.html',
        }),
      { wrapper: createWrapper() },
    );

    expect(result.current).toEqual({});
    await waitFor(() => {
      expect(result.current['index.html']).toContain(
        'https://minio.example.com/file-1?signed=true',
      );
    });
    expect(dataService.getFileDownloadURL).toHaveBeenCalledWith('user-1', 'file-1', true);
  });

  it('keeps unresolved references inert when URL resolution fails', async () => {
    (dataService.getFileDownloadURL as jest.Mock).mockRejectedValue(new Error('denied'));

    const { result } = renderHook(
      () =>
        useResolvedArtifactFiles({
          files: { 'App.tsx': 'export default () => <img src="attachment://missing" />' },
          fileKey: 'App.tsx',
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current['App.tsx']).toContain('attachment://missing');
    });
  });

  it('keeps an empty Artifact file set empty', () => {
    const files = {};
    const { result } = renderHook(
      () => useResolvedArtifactFiles({ files, fileKey: 'index.html' }),
      { wrapper: createWrapper() },
    );

    expect(result.current).toBe(files);
    expect(dataService.getFileDownloadURL).not.toHaveBeenCalled();
  });
});
