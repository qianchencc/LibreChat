import React from 'react';
import { RecoilRoot } from 'recoil';
import { render, screen } from '@testing-library/react';
import ImageGen from '../Parts/OpenAIImageGen/OpenAIImageGen';

jest.mock('~/hooks', () => ({
  useLocalize: () => (key: string) => {
    const translations: Record<string, string> = {
      com_ui_generating_image: 'Generating image...',
      com_ui_image_created: 'Image created',
      com_ui_image_gen_failed: 'Image generation failed',
      com_ui_image_edited: 'Image edited',
      com_ui_cancelled: 'Cancelled',
      com_ui_getting_started: 'Getting started',
      com_ui_creating_image: 'Creating image',
      com_ui_adding_details: 'Adding details',
      com_ui_final_touch: 'Final touch',
      com_ui_error: 'Error',
    };
    return translations[key] || key;
  },
  useProgress: (initialProgress: number) => (initialProgress >= 1 ? 1 : initialProgress),
}));

jest.mock('@librechat/client', () => ({
  PixelCard: (props: Record<string, unknown>) => (
    <div data-testid="pixel-card" data-progress={props.progress} />
  ),
}));

jest.mock('~/components/Chat/Messages/Content/Image', () => ({
  __esModule: true,
  default: () => <div data-testid="image" />,
}));

jest.mock('../ToolOutput', () => ({
  ToolIcon: ({ type, isAnimating }: { type: string; isAnimating?: boolean }) => (
    <span data-testid="tool-icon" data-type={type} data-animating={isAnimating} />
  ),
  isError: jest.requireActual('../ToolOutput/OutputRenderer').isError,
}));

jest.mock('~/utils', () => ({
  scaleImage: () => ({ width: '512px', height: '512px' }),
  logger: { error: jest.fn(), debug: jest.fn() },
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' '),
}));

const defaultProps = {
  initialProgress: 1,
  isSubmitting: false,
  toolName: 'image_gen_oai',
  args: '{}',
  output: '',
};

const renderImageGen = (props: Partial<React.ComponentProps<typeof ImageGen>> = {}) =>
  render(
    <RecoilRoot>
      <ImageGen {...defaultProps} {...props} />
    </RecoilRoot>,
  );

describe('ImageGen - LGCY-01: Modern visual patterns', () => {
  it('renders ToolIcon with type="image_gen" for agent-style tools', () => {
    renderImageGen({
      toolName: 'image_gen_oai',
      isSubmitting: false,
      initialProgress: 1,
      args: '{}',
      output: '',
    });

    const icon = screen.queryByTestId('tool-icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('data-type', 'image_gen');
  });

  it('renders ToolIcon with type="image_gen" for legacy tools', () => {
    renderImageGen({
      initialProgress: 1,
      args: '{"prompt":"test"}',
    });

    const icon = screen.queryByTestId('tool-icon');
    expect(icon).toBeInTheDocument();
  });

  it('does not render ProgressCircle', () => {
    renderImageGen();

    expect(screen.queryByTestId('progress-circle')).not.toBeInTheDocument();
    expect(document.querySelector('.progress-circle')).toBeNull();
  });

  it('renders PixelCard during agent-style image generation', () => {
    renderImageGen({
      isSubmitting: true,
      initialProgress: 0.5,
      toolName: 'image_gen_oai',
      args: '{"size":"1024x1024"}',
    });

    expect(screen.getByTestId('pixel-card')).toBeInTheDocument();
  });
});

describe('ImageGen - LGCY-01: Legacy and agent-style unification', () => {
  it('accepts legacy props (initialProgress + args only)', () => {
    const { container } = render(
      <RecoilRoot>
        <ImageGen
          initialProgress={1}
          isSubmitting={false}
          toolName=""
          args='{"prompt":"a cat"}'
          output=""
        />
      </RecoilRoot>,
    );

    expect(container).toBeTruthy();
  });

  it('accepts agent-style props (full set)', () => {
    const { container } = renderImageGen({
      initialProgress: 1,
      isSubmitting: false,
      toolName: 'image_gen_oai',
      args: '{"prompt":"a cat","size":"1024x1024"}',
      output: 'https://example.com/image.png',
    });

    expect(container).toBeTruthy();
  });

  it('reports failure when a completed historical tool has no image attachment', () => {
    renderImageGen({
      initialProgress: 1,
      isSubmitting: false,
    });

    expect(screen.queryByText('Image created')).not.toBeInTheDocument();
    expect(screen.getAllByText('Image generation failed')).toHaveLength(2);
  });
});

describe('OpenAI image persistence feedback', () => {
  const attachment = {
    filepath: '/images/generated.png',
    filename: 'generated.png',
    messageId: 'message-1',
    conversationId: 'conversation-1',
    toolCallId: 'image-call',
  };

  it.each(['image_gen_oai', 'image_edit_oai'])(
    '%s waits for its attachment after the step closes',
    (toolName) => {
      const props = {
        ...defaultProps,
        toolName,
        isSubmitting: true,
        runStepStatus: 'completed' as const,
      };
      const { rerender } = render(<ImageGen {...props} />);

      expect(screen.queryByText('Image created')).not.toBeInTheDocument();
      expect(screen.queryByText('Image edited')).not.toBeInTheDocument();
      expect(screen.queryByText('Image generation failed')).not.toBeInTheDocument();

      rerender(<ImageGen {...props} attachments={[attachment]} />);

      expect(screen.getByTestId('image')).toBeInTheDocument();
      expect(
        screen.getAllByText(toolName === 'image_gen_oai' ? 'Image created' : 'Image edited').length,
      ).toBeGreaterThan(0);
      expect(screen.queryByText('Image generation failed')).not.toBeInTheDocument();
    },
  );

  it('reports a storage Error immediately while the model is still responding', () => {
    renderImageGen({
      isSubmitting: true,
      output: 'Error: tool call failed: The generated image could not be saved.',
    });
    expect(screen.getAllByText('Image generation failed')).toHaveLength(2);
    expect(screen.queryByText('Image created')).not.toBeInTheDocument();
  });

  it('reports failure when the finished turn has only an unusable attachment', () => {
    renderImageGen({
      runStepStatus: 'completed',
      attachments: [{ ...attachment, filepath: '' }],
    });
    expect(screen.getAllByText('Image generation failed')).toHaveLength(2);
    expect(screen.queryByTestId('image')).not.toBeInTheDocument();
  });

  it('keeps cancellation authoritative even when no image was delivered', () => {
    renderImageGen({ runStepStatus: 'cancelled' });
    expect(screen.getAllByText('Cancelled')).toHaveLength(2);
    expect(screen.queryByText('Image generation failed')).not.toBeInTheDocument();
  });

  it('preserves completion behavior for other image providers', () => {
    renderImageGen({ toolName: 'gemini_image_gen' });
    expect(screen.getAllByText('Image created')).toHaveLength(2);
  });
});

describe('ImageGen - LGCY-03: Localization', () => {
  it('does not contain hardcoded "Creating Image" text', () => {
    const { container } = renderImageGen({
      isSubmitting: true,
      initialProgress: 0.5,
      args: '{}',
    });

    expect(container.textContent).not.toContain('Creating Image');
  });

  it('does not contain hardcoded "Finished." text', () => {
    const { container } = renderImageGen({
      initialProgress: 1,
      isSubmitting: false,
    });

    expect(container.textContent).not.toContain('Finished.');
  });
});

describe('ImageGen - A11Y-04: screen reader status announcements', () => {
  it('includes sr-only aria-live region for status announcements', () => {
    renderImageGen({
      initialProgress: 1,
      isSubmitting: false,
      args: '{"prompt":"test"}',
      output: '',
    });

    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
    expect(liveRegion!.className).toContain('sr-only');
  });
});
