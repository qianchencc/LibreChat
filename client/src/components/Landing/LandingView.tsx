import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, IconButton, ThemeSelector } from '@librechat/client';
import Lenis from 'lenis';
import { cancelFrame, frame, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Menu, Pause, Play, X } from 'lucide-react';
import type { LandingStory } from '~/components/Help/content';
import { landingCapabilities, landingStories } from '~/components/Help/content';
import { BrandWordmark } from '~/components/ui';
import { useGetStartupConfig } from '~/data-provider';
import { useLocalize } from '~/hooks';
import { cn, DEFAULT_APP_TITLE } from '~/utils';
import 'lenis/dist/lenis.css';
import './landing.css';

function useLandingSmoothScroll(reduceMotion: boolean | null) {
  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    const lenis = new Lenis({
      anchors: true,
      autoRaf: false,
      lerp: 0.075,
      smoothWheel: true,
      syncTouch: false,
    });
    const update = ({ timestamp }: { timestamp: number }) => lenis.raf(timestamp);

    frame.update(update, true);
    return () => {
      cancelFrame(update);
      lenis.destroy();
    };
  }, [reduceMotion]);
}

function ProductVideo({
  src,
  poster,
  label,
  preload = 'none',
  className,
  active,
  restartOnActivate = false,
  onRequestActivate,
}: {
  src: string;
  poster?: string;
  label: string;
  preload?: 'none' | 'metadata';
  className?: string;
  active?: boolean;
  restartOnActivate?: boolean;
  onRequestActivate?: () => void;
}) {
  const localize = useLocalize();
  const reduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const userPausedRef = useRef(false);
  const wasActiveRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (reduceMotion) {
      video.pause();
      return;
    }

    if (active !== undefined) {
      if (!active) {
        wasActiveRef.current = false;
        video.pause();
        return;
      }

      if (!userPausedRef.current) {
        if (!wasActiveRef.current && restartOnActivate) {
          video.currentTime = 0;
        }
        void video.play().catch(() => undefined);
      }
      wasActiveRef.current = true;
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
          if (!userPausedRef.current) {
            void video.play().catch(() => undefined);
          }
          return;
        }
        video.pause();
      },
      { threshold: [0, 0.55] },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [active, reduceMotion, restartOnActivate]);

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    if (video.paused) {
      userPausedRef.current = false;
      if (active === false && onRequestActivate) {
        onRequestActivate();
        return;
      }
      void video.play().catch(() => undefined);
      return;
    }
    userPausedRef.current = true;
    video.pause();
  };

  const controlLabel = localize(isPlaying ? 'com_landing_pause_demo' : 'com_landing_play_demo');

  return (
    <div
      className={cn(
        'group relative aspect-video w-full overflow-hidden rounded-theme-surface-lg bg-surface-secondary',
        className,
      )}
    >
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload={preload}
        poster={poster}
        aria-label={label}
        className="size-full object-cover"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        <source src={src} type="video/mp4" />
      </video>
      <IconButton
        label={controlLabel}
        title={controlLabel}
        variant="secondary"
        size="lg"
        className="absolute bottom-3 right-3 bg-surface-primary/90 shadow-theme-surface backdrop-blur-sm active:scale-[0.98] motion-reduce:transform-none"
        onClick={togglePlayback}
      >
        {isPlaying ? (
          <Pause className="size-4" aria-hidden="true" />
        ) : (
          <Play className="size-4" aria-hidden="true" />
        )}
      </IconButton>
    </div>
  );
}

function LandingHeader({ appTitle }: { appTitle: string }) {
  const localize = useLocalize();
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = [
    { href: '#workflow', label: localize('com_landing_nav_workflow') },
    { href: '#capabilities', label: localize('com_landing_nav_capabilities') },
  ];

  return (
    <header className="landing-nav fixed inset-x-0 top-0 z-30 bg-surface-primary/85 backdrop-blur-xl">
      <nav
        aria-label={localize('com_landing_menu_open')}
        className="mx-auto flex h-16 max-w-[1280px] items-center gap-3 px-4 sm:px-6 lg:px-8"
      >
        <a href="#top" className="min-w-0 truncate">
          <BrandWordmark
            appTitle={appTitle}
            className="h-8 text-base font-semibold text-text-primary"
          />
        </a>

        <div className="ml-auto hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Button key={item.href} asChild variant="ghost" size="sm" shape="theme">
              <a href={item.href}>{item.label}</a>
            </Button>
          ))}
          <Button asChild variant="ghost" size="sm" shape="theme">
            <Link to="/help">{localize('com_landing_nav_help')}</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" shape="theme">
            <a href="https://proxy.qianc.ltd" target="_blank" rel="noreferrer">
              {localize('com_landing_nav_proxy')}
            </a>
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-1 md:ml-3">
          <ThemeSelector returnThemeOnly={true} />
          <Button
            asChild
            size="sm"
            shape="theme"
            className="hidden transition-transform active:scale-[0.98] motion-reduce:transform-none sm:inline-flex"
          >
            <Link to="/login">{localize('com_landing_login')}</Link>
          </Button>
          <IconButton
            label={localize(menuOpen ? 'com_landing_menu_close' : 'com_landing_menu_open')}
            title={localize(menuOpen ? 'com_landing_menu_close' : 'com_landing_menu_open')}
            className="md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <Menu className="size-5" aria-hidden="true" />
            )}
          </IconButton>
        </div>
      </nav>

      {menuOpen && (
        <nav
          aria-label={localize('com_landing_menu_open')}
          className="border-t border-border-light bg-surface-primary px-4 py-3 md:hidden"
        >
          <div className="mx-auto flex max-w-[1280px] flex-col gap-1">
            {navItems.map((item) => (
              <Button
                key={item.href}
                asChild
                variant="ghost"
                shape="theme"
                className="justify-start"
                onClick={() => setMenuOpen(false)}
              >
                <a href={item.href}>{item.label}</a>
              </Button>
            ))}
            <Button
              asChild
              variant="ghost"
              shape="theme"
              className="justify-start"
              onClick={() => setMenuOpen(false)}
            >
              <Link to="/help">{localize('com_landing_nav_help')}</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              shape="theme"
              className="justify-start"
              onClick={() => setMenuOpen(false)}
            >
              <a href="https://proxy.qianc.ltd" target="_blank" rel="noreferrer">
                {localize('com_landing_nav_proxy')}
              </a>
            </Button>
            <Button asChild shape="theme" className="mt-2 sm:hidden">
              <Link to="/login">{localize('com_landing_login')}</Link>
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}

function StoryPanel({
  story,
  index,
  active,
  receded,
  onActivate,
  setRef,
}: {
  story: LandingStory;
  index: number;
  active: boolean;
  receded: boolean;
  onActivate: () => void;
  setRef: (element: HTMLElement | null) => void;
}) {
  const localize = useLocalize();
  const textFirst = story.layout === 'text-first';
  const backgroundPosition = [
    'object-left-top',
    'object-center-top',
    'object-right-top',
    'object-center',
  ][index];

  return (
    <article
      ref={setRef}
      data-story-index={index}
      style={{ zIndex: index + 1 }}
      className={cn(
        'relative mb-6 grid min-h-0 overflow-hidden rounded-theme-surface-lg border border-border-light bg-surface-secondary p-3 shadow-theme-surface after:pointer-events-none after:absolute after:inset-0 after:z-20 after:bg-surface-secondary after:opacity-0 after:transition-opacity after:duration-300 after:ease-out md:sticky md:top-24 md:h-[min(58dvh,520px)] md:grid-cols-[minmax(0,1.5fr)_minmax(18rem,1fr)] md:p-4',
        textFirst && 'md:grid-cols-[minmax(18rem,1fr)_minmax(0,1.5fr)]',
        receded && 'md:after:opacity-100',
      )}
    >
      <img
        src="/assets/email/auth-hero.jpg"
        alt=""
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0 z-0 size-full scale-110 object-cover opacity-[0.16] blur-[16px] md:opacity-25',
          backgroundPosition,
        )}
      />
      <div className="pointer-events-none absolute inset-0 z-0 bg-surface-secondary/55" />
      <div className={cn('relative z-10 flex min-w-0 items-center', textFirst && 'md:order-2')}>
        <ProductVideo
          {...story.media}
          active={active}
          restartOnActivate={true}
          onRequestActivate={onActivate}
          preload="metadata"
          label={localize('com_landing_video_label', { 0: localize(story.title) })}
        />
      </div>
      <div
        className={cn(
          'relative z-10 flex flex-col justify-center px-2 py-7 sm:px-6 md:px-10 md:py-10',
          textFirst && 'md:order-1',
        )}
      >
        <h3 className="text-2xl font-semibold leading-tight text-text-primary md:text-[2rem]">
          {localize(story.title)}
        </h3>
        <p className="mt-3 max-w-[38ch] text-[0.9375rem] leading-6 text-text-secondary">
          {localize(story.description)}
        </p>
      </div>
    </article>
  );
}

function WorkflowSection() {
  const localize = useLocalize();
  const storyRefs = useRef<Array<HTMLElement | null>>([]);
  const [activeStory, setActiveStory] = useState<number | null>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    const visibleStories = new Set<number>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number((entry.target as HTMLElement).dataset.storyIndex);
          if (entry.isIntersecting) {
            visibleStories.add(index);
          } else {
            visibleStories.delete(index);
          }
        });
        setActiveStory(visibleStories.size > 0 ? Math.max(...visibleStories) : null);
      },
      { rootMargin: '-35% 0px -59% 0px', threshold: 0 },
    );

    storyRefs.current.forEach((story) => story && observer.observe(story));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="workflow" className="scroll-mt-20 px-4 pb-20 pt-8 sm:px-6 md:pb-28 lg:px-8">
      <div className="mx-auto max-w-[1280px]">
        <h2 className="max-w-3xl text-3xl font-semibold leading-tight text-text-primary md:text-5xl">
          {localize('com_landing_workflow_title')}
        </h2>
        <div className="mt-10 md:mt-16">
          {landingStories.map((story, index) => (
            <StoryPanel
              key={story.id}
              story={story}
              index={index}
              active={activeStory === index}
              receded={activeStory !== null && index < activeStory}
              onActivate={() => setActiveStory(index)}
              setRef={(element) => {
                storyRefs.current[index] = element;
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function CapabilitiesSection() {
  const localize = useLocalize();
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="capabilities"
      className="scroll-mt-20 border-y border-border-light bg-surface-primary-alt px-4 py-20 sm:px-6 md:py-28 lg:px-8"
    >
      <div className="mx-auto max-w-[1280px]">
        <h2 className="text-3xl font-semibold leading-tight text-text-primary md:text-5xl">
          {localize('com_landing_capabilities_title')}
        </h2>
        <div className="mt-10 grid grid-cols-1 border-t border-border-light md:mt-14 md:grid-cols-2">
          {landingCapabilities.map((capability, index) => (
            <motion.div
              key={capability.title}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{
                duration: 0.45,
                delay: reduceMotion ? 0 : (index % 2) * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={cn(
                'flex min-h-48 gap-5 border-b border-border-light py-8 md:p-10',
                index % 2 === 0 && 'md:border-r',
              )}
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-theme-control bg-surface-secondary text-text-primary">
                <capability.icon className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-text-primary">
                  {localize(capability.title)}
                </h3>
                <p className="mt-2 max-w-[44ch] text-sm leading-6 text-text-secondary">
                  {localize(capability.description)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function LandingView() {
  const localize = useLocalize();
  const reduceMotion = useReducedMotion();
  const { data: startupConfig } = useGetStartupConfig();
  const appTitle = startupConfig?.appTitle || DEFAULT_APP_TITLE;

  useLandingSmoothScroll(reduceMotion);

  useEffect(() => {
    document.title = appTitle;
  }, [appTitle]);

  return (
    <div id="top" className="min-h-[100dvh] bg-surface-primary text-text-primary">
      <LandingHeader appTitle={appTitle} />
      <main>
        <section className="flex min-h-[calc(100dvh-10rem)] flex-col justify-center px-4 pb-4 pt-20 sm:px-6 md:pt-24 lg:px-8">
          <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center text-center">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <BrandWordmark
                appTitle={appTitle}
                className="h-10 text-lg font-semibold text-text-primary md:text-xl"
              />
              <h1 className="mx-auto mt-4 max-w-5xl text-4xl font-semibold leading-[1.08] text-text-primary md:text-5xl">
                {localize('com_landing_tagline')}
              </h1>
              <p className="mx-auto mt-5 max-w-[50rem] text-base leading-7 text-text-secondary md:text-lg">
                {localize('com_landing_description')}
              </p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  shape="theme"
                  className="transition-transform active:scale-[0.98] motion-reduce:transform-none"
                >
                  <Link to="/login">
                    {localize('com_landing_cta_primary')}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  shape="theme"
                  className="transition-transform active:scale-[0.98] motion-reduce:transform-none"
                >
                  <a href="#workflow">{localize('com_landing_cta_secondary')}</a>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: reduceMotion ? 0 : 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="mt-8 w-full max-w-5xl"
            >
              <img
                src="/assets/landing/hero-chat.png"
                alt={`${appTitle}: ${localize('com_landing_capability_chat_title')}`}
                className="mx-auto max-h-[40dvh] w-auto max-w-full rounded-theme-surface-lg object-contain shadow-theme-surface"
              />
            </motion.div>
          </div>
        </section>

        <WorkflowSection />
        <CapabilitiesSection />

        <section className="px-4 py-24 sm:px-6 md:py-32 lg:px-8">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <h2 className="text-3xl font-semibold leading-tight text-text-primary md:text-5xl">
              {localize('com_landing_help_title')}
            </h2>
            <p className="mt-4 max-w-[52ch] text-base leading-7 text-text-secondary">
              {localize('com_landing_help_description')}
            </p>
            <Button
              asChild
              size="lg"
              shape="theme"
              className="mt-8 transition-transform active:scale-[0.98] motion-reduce:transform-none"
            >
              <Link to="/help">
                {localize('com_landing_cta_help')}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border-light bg-surface-primary-alt px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <BrandWordmark appTitle={appTitle} className="h-7 font-semibold text-text-primary" />
            <p className="mt-2 text-sm text-text-secondary">
              {localize('com_landing_footer_description')}
            </p>
          </div>
          <div className="flex gap-4 text-sm">
            <Link className="text-text-secondary hover:text-text-primary" to="/login">
              {localize('com_landing_login')}
            </Link>
            <Link className="text-text-secondary hover:text-text-primary" to="/help">
              {localize('com_landing_nav_help')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
