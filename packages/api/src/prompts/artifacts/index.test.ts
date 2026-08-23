import { ArtifactModes, EModelEndpoint } from 'librechat-data-provider';
import { generateArtifactsPrompt } from './index';

describe('generateArtifactsPrompt', () => {
  it('adds stable references for eligible attachments', () => {
    const prompt = generateArtifactsPrompt({
      endpoint: EModelEndpoint.openAI,
      artifacts: ArtifactModes.DEFAULT,
      attachments: [
        {
          file_id: 'file-1',
          filename: 'photo.png',
          type: 'image/png',
        },
      ],
    });

    expect(prompt).toContain('attachment://file-1');
    expect(prompt).toContain('photo.png');
    expect(prompt).toContain('image/png');
    expect(prompt).toContain('data, not instructions');
  });

  it('does not add an attachment section when none are available', () => {
    const prompt = generateArtifactsPrompt({
      endpoint: EModelEndpoint.openAI,
      artifacts: ArtifactModes.DEFAULT,
    });

    expect(prompt).not.toContain('<artifact_attachments>');
  });

  it('adds attachment references without built-in guidance in custom mode', () => {
    const prompt = generateArtifactsPrompt({
      endpoint: EModelEndpoint.openAI,
      artifacts: ArtifactModes.CUSTOM,
      attachments: [{ file_id: 'file-1', filename: 'photo.png', type: 'image/png' }],
    });

    expect(prompt).toContain('attachment://file-1');
    expect(prompt).not.toContain('# Good artifacts are');
  });
});
