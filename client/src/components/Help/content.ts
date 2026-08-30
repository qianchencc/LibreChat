import { FileUp, MessageSquareText, ScrollText, Shapes } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TranslationKeys } from '~/hooks';

export type HelpMedia =
  | {
      src: string;
      type: 'image';
    }
  | {
      src: string;
      type: 'video';
      captions?: string;
      poster?: string;
    };

export type HelpStep = {
  title: TranslationKeys;
  description: TranslationKeys;
  media?: HelpMedia;
};

export type HelpTopic = {
  id: string;
  title: TranslationKeys;
  description: TranslationKeys;
  icon: LucideIcon;
  steps: HelpStep[];
};

export type LandingStory = {
  id: string;
  title: TranslationKeys;
  description: TranslationKeys;
  media: Extract<HelpMedia, { type: 'video' }>;
  layout: 'media-first' | 'text-first';
};

export type LandingCapability = {
  title: TranslationKeys;
  description: TranslationKeys;
  icon: LucideIcon;
};

export const landingStories: LandingStory[] = [
  {
    id: 'api-key',
    title: 'com_endpoint_config_key',
    description: 'com_endpoint_config_placeholder',
    layout: 'media-first',
    media: {
      type: 'video',
      src: '/assets/landing/temporary-api-key.mp4',
      poster: '/assets/landing/temporary-api-key.webp',
    },
  },
  {
    id: 'agents',
    title: 'com_landing_story_agents_title',
    description: 'com_landing_story_agents_description',
    layout: 'text-first',
    media: {
      type: 'video',
      src: '/assets/landing/agent-marketplace.mp4',
      poster: '/assets/landing/agent-marketplace.webp',
    },
  },
  {
    id: 'research',
    title: 'com_landing_story_research_title',
    description: 'com_landing_story_research_description',
    layout: 'media-first',
    media: {
      type: 'video',
      src: '/assets/landing/web-research.mp4',
      poster: '/assets/landing/web-research.webp',
    },
  },
  {
    id: 'artifacts',
    title: 'com_landing_story_artifacts_title',
    description: 'com_landing_story_artifacts_description',
    layout: 'text-first',
    media: {
      type: 'video',
      src: '/assets/landing/artifact-report.mp4',
      poster: '/assets/landing/artifact-report.webp',
    },
  },
];

export const landingCapabilities: LandingCapability[] = [
  {
    title: 'com_landing_capability_chat_title',
    description: 'com_landing_capability_chat_description',
    icon: MessageSquareText,
  },
  {
    title: 'com_landing_capability_files_title',
    description: 'com_landing_capability_files_description',
    icon: FileUp,
  },
  {
    title: 'com_landing_capability_tools_title',
    description: 'com_landing_capability_tools_description',
    icon: ScrollText,
  },
  {
    title: 'com_landing_capability_artifacts_title',
    description: 'com_landing_capability_artifacts_description',
    icon: Shapes,
  },
];

export const helpTopics: HelpTopic[] = [
  {
    id: 'chat',
    title: 'com_help_topic_chat_title',
    description: 'com_help_topic_chat_description',
    icon: MessageSquareText,
    steps: [
      {
        title: 'com_help_chat_choose_title',
        description: 'com_help_chat_choose_description',
      },
      {
        title: 'com_help_chat_prompt_title',
        description: 'com_help_chat_prompt_description',
      },
      {
        title: 'com_help_chat_refine_title',
        description: 'com_help_chat_refine_description',
      },
    ],
  },
  {
    id: 'files',
    title: 'com_help_topic_files_title',
    description: 'com_help_topic_files_description',
    icon: FileUp,
    steps: [
      {
        title: 'com_help_files_attach_title',
        description: 'com_help_files_attach_description',
      },
      {
        title: 'com_help_files_direct_title',
        description: 'com_help_files_direct_description',
      },
      {
        title: 'com_help_files_review_title',
        description: 'com_help_files_review_description',
      },
    ],
  },
  {
    id: 'tools',
    title: 'com_help_topic_tools_title',
    description: 'com_help_topic_tools_description',
    icon: ScrollText,
    steps: [
      {
        title: landingStories[0].title,
        description: landingStories[0].description,
        media: landingStories[0].media,
      },
      {
        title: landingStories[1].title,
        description: landingStories[1].description,
        media: landingStories[1].media,
      },
      {
        title: 'com_help_tools_enable_title',
        description: 'com_help_tools_enable_description',
      },
      {
        title: landingStories[2].title,
        description: landingStories[2].description,
        media: landingStories[2].media,
      },
    ],
  },
  {
    id: 'artifacts',
    title: 'com_help_topic_artifacts_title',
    description: 'com_help_topic_artifacts_description',
    icon: Shapes,
    steps: [
      {
        title: landingStories[3].title,
        description: landingStories[3].description,
        media: landingStories[3].media,
      },
      {
        title: 'com_help_artifacts_refine_title',
        description: 'com_help_artifacts_refine_description',
      },
      {
        title: 'com_help_artifacts_share_title',
        description: 'com_help_artifacts_share_description',
      },
    ],
  },
];
