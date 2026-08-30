import { fireEvent, render, screen } from '@testing-library/react';
import HelpView from '../HelpView';

const translations: Record<string, string> = {
  com_help_title: 'Help center',
  com_help_search_placeholder: 'Search guides',
  com_help_no_results: 'No guides found',
  com_help_topic_chat_title: 'Start a conversation',
  com_help_topic_chat_description: 'Choose a model and send a useful first message.',
  com_help_topic_files_title: 'Upload and reference a file',
  com_help_topic_files_description: 'Add source material and tell the assistant how to use it.',
  com_help_topic_tools_title: 'Use a tool or Skill',
  com_help_topic_tools_description: 'Give an agent the capabilities it needs for a task.',
  com_help_topic_artifacts_title: 'Create and share an Artifact',
  com_help_topic_artifacts_description: 'Build, refine, and share interactive results.',
};

jest.mock('~/hooks', () => ({
  useLocalize: () => (key: string) => translations[key] ?? key,
}));

describe('HelpView', () => {
  it('changes the displayed guide when a topic is selected', () => {
    render(<HelpView />);

    fireEvent.click(screen.getByRole('button', { name: 'Upload and reference a file' }));

    expect(screen.getByRole('button', { name: 'Upload and reference a file' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.getByRole('heading', { name: 'Upload and reference a file', level: 2 }),
    ).toBeInTheDocument();
  });

  it('filters the topic directory by localized content', () => {
    render(<HelpView />);

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search guides' }), {
      target: { value: 'Artifact' },
    });

    expect(screen.getByRole('button', { name: 'Create and share an Artifact' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Start a conversation' })).not.toBeInTheDocument();
  });
});
