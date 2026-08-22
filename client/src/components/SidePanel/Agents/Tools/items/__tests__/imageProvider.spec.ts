import { EModelEndpoint } from 'librechat-data-provider';
import { isImageProviderReady } from '../imageProvider';

const models = { 'Image Provider': ['gpt-5.6-luna', 'gpt-image-2'] };

describe('isImageProviderReady', () => {
  it('accepts a custom provider with gpt-image-2 and a saved user key', () => {
    expect(
      isImageProviderReady({
        provider: 'Image Provider',
        endpointConfig: {
          type: EModelEndpoint.custom,
          userProvideKey: true,
        },
        models,
        hasUserKey: true,
      }),
    ).toBe(true);
  });

  it('rejects a user-key provider when the user key is not saved', () => {
    expect(
      isImageProviderReady({
        provider: 'Image Provider',
        endpointConfig: {
          type: EModelEndpoint.custom,
          userProvideKey: true,
        },
        models,
        hasUserKey: false,
      }),
    ).toBe(false);
  });

  it('rejects providers without gpt-image-2 or without custom endpoint type', () => {
    expect(
      isImageProviderReady({
        provider: 'Image Provider',
        endpointConfig: { type: EModelEndpoint.custom },
        models: { 'Image Provider': ['gpt-5.6-luna'] },
        hasUserKey: false,
      }),
    ).toBe(false);

    expect(
      isImageProviderReady({
        provider: 'openAI',
        endpointConfig: { type: EModelEndpoint.openAI },
        models: { openAI: ['gpt-image-2'] },
        hasUserKey: false,
      }),
    ).toBe(false);
  });

  it('accepts a custom provider with server-managed credentials', () => {
    expect(
      isImageProviderReady({
        provider: 'Image Provider',
        endpointConfig: { type: EModelEndpoint.custom },
        models,
        hasUserKey: false,
      }),
    ).toBe(true);
  });
});
