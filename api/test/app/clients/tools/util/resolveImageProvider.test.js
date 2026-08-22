const mockGetCustomEndpointConfig = jest.fn();
const mockIsUserProvided = jest.fn((value) => value === 'user_provided');
const mockGetUserKeyValues = jest.fn();

jest.mock('@librechat/api', () => ({
  getCustomEndpointConfig: (...args) => mockGetCustomEndpointConfig(...args),
  isUserProvided: (...args) => mockIsUserProvided(...args),
}));

jest.mock('librechat-data-provider', () => ({
  extractEnvVariable: (value) => value,
}));

jest.mock('~/models', () => ({
  getUserKeyValues: (...args) => mockGetUserKeyValues(...args),
}));

const { resolveImageProviderConfig } = require('~/app/clients/tools/util/resolveImageProvider');

describe('resolveImageProviderConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolves the saved custom provider credentials and gpt-image-2', async () => {
    mockGetCustomEndpointConfig.mockReturnValue({
      name: 'Image Provider',
      apiKey: 'user_provided',
      baseURL: 'user_provided',
      models: {
        default: [{ name: 'gpt-image-2' }],
      },
    });
    mockGetUserKeyValues.mockResolvedValue({
      apiKey: 'provider-api-key',
      baseURL: 'http://provider.example/v1',
    });

    await expect(
      resolveImageProviderConfig({
        agent: { endpoint: 'Image Provider', provider: 'openAI' },
        req: { config: { endpoints: { custom: [] } } },
        userId: 'user-id',
      }),
    ).resolves.toEqual({
      IMAGE_GEN_OAI_API_KEY: 'provider-api-key',
      IMAGE_GEN_OAI_BASEURL: 'http://provider.example/v1',
      IMAGE_GEN_OAI_MODEL: 'gpt-image-2',
    });

    expect(mockGetUserKeyValues).toHaveBeenCalledWith({
      userId: 'user-id',
      name: 'Image Provider',
    });
  });

  it('returns no provider override when the agent is not using a custom endpoint', async () => {
    mockGetCustomEndpointConfig.mockReturnValue(undefined);

    await expect(
      resolveImageProviderConfig({
        agent: { provider: 'openAI' },
        req: { config: { endpoints: { custom: [] } } },
        userId: 'user-id',
      }),
    ).resolves.toEqual({});

    expect(mockGetUserKeyValues).not.toHaveBeenCalled();
  });
});
