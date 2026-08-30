import { useMemo, useState } from 'react';
import { Film, Search } from 'lucide-react';
import { Input, useMediaQuery } from '@librechat/client';
import type { HelpStep, HelpTopic } from './content';
import { helpTopics } from './content';
import OpenSidebar from '~/components/Chat/Menus/OpenSidebar';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';

function StepMedia({ step }: { step: HelpStep }) {
  const localize = useLocalize();

  if (step.media?.type === 'video') {
    return (
      <video
        controls
        preload="metadata"
        poster={step.media.poster}
        className="aspect-video w-full rounded-lg border border-border-light bg-surface-secondary object-cover"
      >
        <source src={step.media.src} />
        {step.media.captions && <track kind="captions" src={step.media.captions} srcLang="en" />}
      </video>
    );
  }

  if (step.media?.type === 'image') {
    return (
      <img
        src={step.media.src}
        alt={localize(step.title)}
        className="aspect-video w-full rounded-lg border border-border-light bg-surface-secondary object-cover"
      />
    );
  }

  return (
    <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-border-light bg-surface-secondary">
      <div className="flex flex-col items-center gap-3 px-6 text-center text-text-secondary">
        <Film className="size-8" aria-hidden="true" />
        <span className="text-sm font-medium">{localize('com_help_demo_pending')}</span>
      </div>
    </div>
  );
}

function TopicButton({
  topic,
  active,
  onSelect,
}: {
  topic: HelpTopic;
  active: boolean;
  onSelect: () => void;
}) {
  const localize = useLocalize();

  return (
    <button
      type="button"
      aria-current={active ? 'page' : undefined}
      aria-label={localize(topic.title)}
      className={cn(
        'flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors',
        active ? 'bg-surface-active-alt text-text-primary' : 'hover:bg-surface-hover',
      )}
      onClick={onSelect}
    >
      <topic.icon className="mt-0.5 size-5 flex-shrink-0" aria-hidden="true" />
      <span className="min-w-0">
        <span className="block text-sm font-medium">{localize(topic.title)}</span>
        <span className="mt-1 block text-xs leading-5 text-text-secondary">
          {localize(topic.description)}
        </span>
      </span>
    </button>
  );
}

export default function HelpView() {
  const localize = useLocalize();
  const isSmallScreen = useMediaQuery('(max-width: 768px)');
  const [query, setQuery] = useState('');
  const [activeTopicId, setActiveTopicId] = useState(helpTopics[0].id);

  const filteredTopics = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) {
      return helpTopics;
    }

    return helpTopics.filter((topic) =>
      `${localize(topic.title)} ${localize(topic.description)}`
        .toLocaleLowerCase()
        .includes(normalizedQuery),
    );
  }, [localize, query]);

  const activeTopic =
    filteredTopics.find((topic) => topic.id === activeTopicId) ?? filteredTopics[0];

  return (
    <main className="h-full overflow-y-auto bg-surface-primary text-text-primary">
      <header className="sticky top-0 z-10 border-b border-border-light bg-surface-primary">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-start gap-3">
            {isSmallScreen && <OpenSidebar className="mt-0.5 size-9 shrink-0" />}
            <div>
              <h1 className="text-2xl font-semibold">{localize('com_help_title')}</h1>
              <p className="mt-1 text-sm text-text-secondary">{localize('com_help_description')}</p>
            </div>
          </div>
          <label className="relative block w-full lg:max-w-sm">
            <span className="sr-only">{localize('com_help_search_placeholder')}</span>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={query}
              aria-label={localize('com_help_search_placeholder')}
              placeholder={localize('com_help_search_placeholder')}
              className="h-10 pl-9"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-12 lg:px-8 lg:py-12">
        <aside aria-label={localize('com_help_topics_label')}>
          <label className="block lg:hidden">
            <span className="mb-2 block text-sm font-medium">
              {localize('com_help_topics_label')}
            </span>
            <select
              value={activeTopic?.id ?? ''}
              className="h-10 w-full rounded-lg border border-border-medium bg-surface-primary px-3 text-sm text-text-primary"
              onChange={(event) => setActiveTopicId(event.target.value)}
            >
              {filteredTopics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {localize(topic.title)}
                </option>
              ))}
            </select>
          </label>
          <nav className="hidden space-y-1 lg:block">
            {filteredTopics.map((topic) => (
              <TopicButton
                key={topic.id}
                topic={topic}
                active={topic.id === activeTopic?.id}
                onSelect={() => setActiveTopicId(topic.id)}
              />
            ))}
          </nav>
        </aside>

        {activeTopic ? (
          <article className="min-w-0 pb-16">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold leading-tight">
                {localize(activeTopic.title)}
              </h2>
              <p className="mt-3 text-base leading-7 text-text-secondary">
                {localize(activeTopic.description)}
              </p>
            </div>

            <ol className="mt-10 space-y-14">
              {activeTopic.steps.map((step, index) => (
                <li key={step.title} className="space-y-5">
                  <div className="flex max-w-3xl items-start gap-4">
                    <span className="flex size-7 flex-shrink-0 items-center justify-center rounded-full bg-surface-active-alt text-xs font-semibold text-text-primary">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold">{localize(step.title)}</h3>
                      <p className="mt-2 text-sm leading-6 text-text-secondary">
                        {localize(step.description)}
                      </p>
                    </div>
                  </div>
                  <StepMedia step={step} />
                </li>
              ))}
            </ol>
          </article>
        ) : (
          <div className="flex min-h-64 items-center justify-center text-sm text-text-secondary">
            {localize('com_help_no_results')}
          </div>
        )}
      </div>
    </main>
  );
}
