import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { SandpackPreviewRef } from '@codesandbox/sandpack-react/unstyled';
import { ShareContext } from '~/Providers/ShareContext';
import { ArtifactPreview } from '../ArtifactPreview';

jest.mock('@codesandbox/sandpack-react/unstyled', () => {
  const React = jest.requireActual('react');
  return {
    SandpackProvider: ({
      files,
      children,
    }: {
      files: Record<string, string | { code: string }>;
      children: React.ReactNode;
    }) => (
      <div data-testid="sandpack-provider" data-files={JSON.stringify(files)}>
        {children}
      </div>
    ),
    SandpackPreview: React.forwardRef(function SandpackPreview() {
      return <div data-testid="sandpack-preview" />;
    }),
  };
});

const renderSharedPreview = (files: Record<string, string>) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const previewRef: React.MutableRefObject<SandpackPreviewRef> = {
    current: Object.create(null),
  };

  return render(
    <QueryClientProvider client={queryClient}>
      <ShareContext.Provider value={{ isSharedConvo: true, shareId: 'share-1' }}>
        <ArtifactPreview
          files={files}
          fileKey="index.html"
          template="static"
          sharedProps={{}}
          previewRef={previewRef}
        />
      </ShareContext.Provider>
    </QueryClientProvider>,
  );
};

describe('ArtifactPreview in a shared conversation', () => {
  it('renders outside AuthProvider when the Artifact has no attachments', () => {
    renderSharedPreview({ 'index.html': '<h1>Shared Artifact</h1>' });

    expect(screen.getByTestId('sandpack-preview')).toBeInTheDocument();
  });

  it('resolves image and download references through the shared file snapshot', () => {
    renderSharedPreview({
      'index.html': [
        '<img src="attachment://image-1">',
        '<a href="attachment://document-1">Download</a>',
      ].join(''),
    });

    const serializedFiles = screen.getByTestId('sandpack-provider').getAttribute('data-files');
    const files = JSON.parse(serializedFiles ?? '{}') as Record<string, string>;
    expect(files['index.html']).toContain(
      `${window.location.origin}/api/share/share-1/files/image-1`,
    );
    expect(files['index.html']).toContain(
      `${window.location.origin}/api/share/share-1/files/document-1`,
    );
  });
});
