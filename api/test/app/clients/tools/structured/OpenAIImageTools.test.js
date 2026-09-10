const OpenAI = require('openai');
const axios = require('axios');
const { saveBase64Image } = require('~/server/services/Files/process');
const createOpenAIImageTools = require('~/app/clients/tools/structured/OpenAIImageTools');

jest.mock('openai');
jest.mock('axios');
jest.mock('~/server/services/Files/process', () => ({
  saveBase64Image: jest.fn(),
}));
jest.mock('@librechat/data-schemas', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('@librechat/api', () => ({
  persistGeneratedImage: jest.requireActual('@librechat/api').persistGeneratedImage,
  logAxiosError: jest.fn(),
  oaiToolkit: jest.requireActual('@librechat/api').oaiToolkit,
  extractBaseURL: jest.fn((url) => url),
  getProxyDispatcher: jest.fn(() => undefined),
  applyAxiosProxyConfig: jest.fn(),
}));

jest.mock('~/server/services/Files/strategies', () => ({
  getStrategyFunctions: jest.fn(),
}));

jest.mock('~/models', () => ({
  getFiles: jest.fn().mockResolvedValue([]),
}));

describe('OpenAIImageTools - IMAGE_GEN_OAI_MODEL environment variable', () => {
  let originalEnv;

  beforeEach(() => {
    jest.clearAllMocks();
    originalEnv = { ...process.env };

    process.env.IMAGE_GEN_OAI_API_KEY = 'test-api-key';
    saveBase64Image.mockReset().mockImplementation(async (_url, options) => ({
      file_id: options.file_id,
      filepath: '/images/generated.png',
    }));

    OpenAI.mockImplementation(() => ({
      images: {
        generate: jest.fn().mockResolvedValue({
          data: [
            {
              b64_json: 'base64-encoded-image-data',
            },
          ],
        }),
      },
    }));
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it.each([0, 1])('reports a storage failure to the model for image tool %i', async (index) => {
    const generate = jest.fn().mockResolvedValue({ data: [{ b64_json: 'image-data' }] });
    OpenAI.mockImplementation(() => ({ images: { generate } }));
    axios.post.mockResolvedValue({ data: { data: [{ b64_json: 'image-data' }] } });
    saveBase64Image.mockRejectedValueOnce(new Error('S3 write unavailable'));
    const tools = createOpenAIImageTools({
      isAgent: true,
      req: { user: { id: 'test-user' } },
    });

    const result = await tools[index].invoke({
      id: 'image-call',
      type: 'tool_call',
      name: tools[index].name,
      args: { prompt: 'a cat', image_ids: ['source-image'] },
    });

    expect(result.content).toMatch(/^Error:.*could not be saved/);
    expect(result.artifact).toEqual({});
    expect(index === 0 ? generate : axios.post).toHaveBeenCalledTimes(1);
  });

  it.each([0, 1])(
    'waits for durable storage before succeeding for image tool %i',
    async (index) => {
      axios.post.mockResolvedValue({ data: { data: [{ b64_json: 'image-data' }] } });
      let finishSave;
      let savedId;
      let beginSave;
      const saveStarted = new Promise((resolve) => {
        beginSave = resolve;
      });
      saveBase64Image.mockImplementation(
        (_url, options) =>
          new Promise((resolve) => {
            savedId = options.file_id;
            finishSave = () => resolve({ file_id: savedId, filepath: '/images/saved.png' });
            beginSave();
          }),
      );
      const tools = createOpenAIImageTools({ isAgent: true, req: { user: { id: 'test-user' } } });
      const complete = jest.fn();
      const result = tools[index].func({ prompt: 'a cat', image_ids: [] }).then(complete);
      await saveStarted;

      expect(complete).not.toHaveBeenCalled();
      finishSave();
      await result;

      const [message, artifact] = complete.mock.calls[0][0];
      expect(message[0].text).toContain(`generated_image_id: "${savedId}"`);
      expect(artifact).toEqual({
        content: [{ type: 'image_url', image_url: { url: expect.stringContaining('base64,') } }],
        file_ids: [savedId],
      });
      expect(saveBase64Image).toHaveBeenCalledTimes(1);
    },
  );

  it.each([0, 1])('returns Error when provider %i returns no image', async (index) => {
    OpenAI.mockImplementation(() => ({
      images: { generate: jest.fn().mockResolvedValue({ data: [] }) },
    }));
    axios.post.mockResolvedValue({ data: { data: [] } });
    const tools = createOpenAIImageTools({ isAgent: true, req: { user: { id: 'test-user' } } });

    const [message, artifact] = await tools[index].func({ prompt: 'a cat', image_ids: [] });

    expect(message).toMatch(/^Error: tool call failed:/);
    expect(artifact).toEqual({});
    expect(saveBase64Image).not.toHaveBeenCalled();
  });

  it.each([0, 1])('delivers a persisted file reference in tool %i output', async (index) => {
    axios.post.mockResolvedValue({ data: { data: [{ b64_json: 'image-data' }] } });
    const tools = createOpenAIImageTools({ isAgent: true, req: { user: { id: 'test-user' } } });

    const result = await tools[index].invoke({
      id: 'image-call',
      type: 'tool_call',
      name: tools[index].name,
      args: { prompt: 'a cat', image_ids: ['source-image'] },
    });

    const fileId = result.artifact.file_ids[0];
    expect(result.content[0].text).toContain(`generated_image_id: "${fileId}"`);
    expect(result.tool_call_id).toBe('image-call');
    expect(result.artifact.content[0]).toEqual({
      type: 'image_url',
      image_url: { url: expect.stringContaining('base64,') },
    });
    expect(JSON.stringify(result.content)).not.toContain('base64');
    expect(JSON.stringify(result.content)).not.toContain('image-data');
  });

  it.each([0, 1])('does not publish an image after tool %i is cancelled', async (index) => {
    const controller = new AbortController();
    const generate = jest.fn().mockImplementation(async () => {
      controller.abort();
      return { data: [{ b64_json: 'image-data' }] };
    });
    OpenAI.mockImplementation(() => ({ images: { generate } }));
    axios.post.mockImplementation(async () => ({ data: await generate() }));
    const tools = createOpenAIImageTools({ isAgent: true, req: { user: { id: 'test-user' } } });

    await expect(
      tools[index].func({ prompt: 'a cat', image_ids: [] }, undefined, {
        signal: controller.signal,
      }),
    ).rejects.toThrow('Aborted');
    expect(saveBase64Image).not.toHaveBeenCalled();
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it('should use default model "gpt-image-1" when IMAGE_GEN_OAI_MODEL is not set', async () => {
    delete process.env.IMAGE_GEN_OAI_MODEL;

    const [imageGenTool] = createOpenAIImageTools({
      isAgent: true,
      override: false,
      req: { user: { id: 'test-user' } },
    });

    const mockGenerate = jest.fn().mockResolvedValue({
      data: [
        {
          b64_json: 'base64-encoded-image-data',
        },
      ],
    });

    OpenAI.mockImplementation(() => ({
      images: {
        generate: mockGenerate,
      },
    }));

    await imageGenTool.func({ prompt: 'test prompt' });

    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-image-1',
      }),
      expect.any(Object),
    );
  });

  it('should use "gpt-image-1.5" when IMAGE_GEN_OAI_MODEL is set to "gpt-image-1.5"', async () => {
    process.env.IMAGE_GEN_OAI_MODEL = 'gpt-image-1.5';

    const mockGenerate = jest.fn().mockResolvedValue({
      data: [
        {
          b64_json: 'base64-encoded-image-data',
        },
      ],
    });

    OpenAI.mockImplementation(() => ({
      images: {
        generate: mockGenerate,
      },
    }));

    const [imageGenTool] = createOpenAIImageTools({
      isAgent: true,
      override: false,
      req: { user: { id: 'test-user' } },
    });

    await imageGenTool.func({ prompt: 'test prompt' });

    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-image-1.5',
      }),
      expect.any(Object),
    );
  });

  it('should use custom model name from IMAGE_GEN_OAI_MODEL environment variable', async () => {
    process.env.IMAGE_GEN_OAI_MODEL = 'custom-image-model';

    const mockGenerate = jest.fn().mockResolvedValue({
      data: [
        {
          b64_json: 'base64-encoded-image-data',
        },
      ],
    });

    OpenAI.mockImplementation(() => ({
      images: {
        generate: mockGenerate,
      },
    }));

    const [imageGenTool] = createOpenAIImageTools({
      isAgent: true,
      override: false,
      req: { user: { id: 'test-user' } },
    });

    await imageGenTool.func({ prompt: 'test prompt' });

    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'custom-image-model',
      }),
      expect.any(Object),
    );
  });

  it('should prefer injected provider credentials and model over environment variables', async () => {
    process.env.IMAGE_GEN_OAI_API_KEY = 'env-api-key';
    process.env.IMAGE_GEN_OAI_BASEURL = 'https://env.example/v1';
    process.env.IMAGE_GEN_OAI_MODEL = 'env-image-model';

    const mockGenerate = jest.fn().mockResolvedValue({
      data: [
        {
          b64_json: 'base64-encoded-image-data',
        },
      ],
    });

    OpenAI.mockImplementation(() => ({
      images: {
        generate: mockGenerate,
      },
    }));

    const [imageGenTool] = createOpenAIImageTools({
      isAgent: true,
      override: false,
      req: { user: { id: 'test-user' } },
      IMAGE_GEN_OAI_API_KEY: 'provider-api-key',
      IMAGE_GEN_OAI_BASEURL: 'http://provider.example/v1',
      IMAGE_GEN_OAI_MODEL: 'gpt-image-2.5',
    });

    await imageGenTool.func({ prompt: 'test prompt' });

    expect(OpenAI).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: 'provider-api-key',
        baseURL: 'http://provider.example/v1',
      }),
    );
    expect(mockGenerate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-image-2.5',
      }),
      expect.any(Object),
    );
  });
});
