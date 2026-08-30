/**
 * @jest-environment @happy-dom/jest-environment
 */
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import LandingView from '../LandingView';

jest.mock('lenis', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    destroy: jest.fn(),
    raf: jest.fn(),
  })),
}));

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  readonly targets: Element[] = [];

  constructor(private readonly callback: IntersectionObserverCallback) {
    MockIntersectionObserver.instances.push(this);
  }

  observe = (target: Element) => {
    this.targets.push(target);
  };

  disconnect = jest.fn();
  unobserve = jest.fn();
  takeRecords = jest.fn(() => []);

  trigger(target: Element, isIntersecting: boolean) {
    this.callback(
      [{ target, isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

const originalIntersectionObserver = global.IntersectionObserver;

jest.mock('~/data-provider', () => ({
  useGetStartupConfig: () => ({ data: { appTitle: '尘Chat' } }),
}));

jest.mock('~/hooks', () => {
  const translations = jest.requireActual('~/locales/en/translation.json') as Record<
    string,
    string
  >;
  return {
    useLocalize: () => (key: string, options?: { 0?: string }) => {
      const value = translations[key] ?? key;
      return options?.[0] ? value.replace('{{0}}', options[0]) : value;
    },
  };
});

jest.mock('@librechat/client', () => {
  const actual = jest.requireActual('@librechat/client');
  return {
    ...actual,
    ThemeSelector: () => <button type="button">Theme</button>,
  };
});

describe('LandingView', () => {
  beforeEach(() => {
    MockIntersectionObserver.instances = [];
    global.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  afterAll(() => {
    global.IntersectionObserver = originalIntersectionObserver;
  });

  it('presents the public product story and navigation', () => {
    render(
      <MemoryRouter>
        <LandingView />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Turn tasks into usable results' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Get started/i })).toHaveAttribute('href', '/login');
    expect(screen.getAllByRole('link', { name: 'Help' })[0]).toHaveAttribute('href', '/help');
    expect(screen.getAllByRole('link', { name: 'Gateway' })[0]).toHaveAttribute(
      'href',
      'https://proxy.qianc.ltd',
    );
    expect(screen.getAllByRole('link', { name: 'Gateway' })[0]).toHaveAttribute('target', '_blank');
    expect(screen.getByText('From one task to a result you can use')).toBeInTheDocument();
  });

  it('uses a static hero and all four original recordings at natural speed', () => {
    const { container } = render(
      <MemoryRouter>
        <LandingView />
      </MemoryRouter>,
    );

    const videos = Array.from(container.querySelectorAll('video'));
    const sources = videos.map((video) => video.querySelector('source')?.getAttribute('src'));

    expect(screen.getByRole('img', { name: '尘Chat: Talk directly' })).toHaveAttribute(
      'src',
      '/assets/landing/hero-chat.png',
    );
    expect(videos).toHaveLength(4);
    expect(videos.every((video) => video.getAttribute('poster')?.endsWith('.webp'))).toBe(true);
    expect(videos.every((video) => video.playbackRate === 1)).toBe(true);
    expect(sources).toEqual([
      '/assets/landing/temporary-api-key.mp4',
      '/assets/landing/agent-marketplace.mp4',
      '/assets/landing/web-research.mp4',
      '/assets/landing/artifact-report.mp4',
    ]);
    expect(screen.getAllByRole('button', { name: 'Play demonstration' })).toHaveLength(4);
  });

  it('hands playback to the latest story entering the activation band', async () => {
    const play = jest
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockImplementation(() => Promise.resolve());
    const pause = jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    const { container } = render(
      <MemoryRouter>
        <LandingView />
      </MemoryRouter>,
    );
    const videos = Array.from(container.querySelectorAll('video'));
    const storyObserver = MockIntersectionObserver.instances.find(
      (observer) => observer.targets.length === 4,
    );

    expect(storyObserver).toBeDefined();
    play.mockClear();
    pause.mockClear();
    videos[0].currentTime = 5;

    act(() => storyObserver?.trigger(storyObserver.targets[0], true));
    await waitFor(() => expect(play.mock.instances.at(-1)).toBe(videos[0]));
    expect(videos[0].currentTime).toBe(0);

    videos[1].currentTime = 5;
    act(() => storyObserver?.trigger(storyObserver.targets[1], true));
    await waitFor(() => expect(play.mock.instances.at(-1)).toBe(videos[1]));
    expect(pause.mock.instances).toContain(videos[0]);
    expect(videos[1].currentTime).toBe(0);

    fireEvent.click(screen.getAllByRole('button', { name: 'Play demonstration' })[3]);
    await waitFor(() => expect(play.mock.instances.at(-1)).toBe(videos[3]));
    expect(pause.mock.instances).toContain(videos[1]);

    play.mockRestore();
    pause.mockRestore();
  });
});
