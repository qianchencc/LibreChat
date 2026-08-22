import { createFetch } from './generators';
import { normalizeOpenAIResponsesPayload } from './openaiResponses';

describe('OpenAI Responses compatibility', () => {
  it('adds annotations to output text parts without changing existing annotations', () => {
    const payload = {
      id: 'resp_1',
      output: [
        {
          type: 'message',
          content: [
            { type: 'output_text', text: 'plain text' },
            { type: 'output_text', text: 'cited', annotations: [{ type: 'url_citation' }] },
          ],
        },
      ],
    };

    expect(normalizeOpenAIResponsesPayload(payload)).toEqual({
      ...payload,
      output: [
        {
          ...payload.output[0],
          content: [
            { type: 'output_text', text: 'plain text', annotations: [] },
            { type: 'output_text', text: 'cited', annotations: [{ type: 'url_citation' }] },
          ],
        },
      ],
    });
  });

  it('normalizes a Responses API SSE completion while preserving the stream', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(
          [
            'data: {"type":"response.completed","response":{"output":[{"type":"message","content":[{"type":"output_text","text":"done"}]}]}}',
            '',
            'data: [DONE]',
            '',
          ].join('\n'),
          { headers: { 'content-type': 'text/event-stream' } },
        ),
      );

    try {
      const response = await createFetch({ normalizeResponses: true })(
        'https://gateway.example/v1/responses',
        {},
      );
      const body = await response.text();

      expect(body).toContain('"annotations":[]');
      expect(body).toContain('data: [DONE]');
    } finally {
      fetchMock.mockRestore();
    }
  });

  it('normalizes a non-streaming Responses API response', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          output: [
            {
              type: 'message',
              content: [{ type: 'output_text', text: 'done' }],
            },
          ],
        }),
        { headers: { 'content-type': 'application/json' } },
      ),
    );

    try {
      const response = await createFetch({ normalizeResponses: true })(
        'https://gateway.example/v1/responses',
        {},
      );

      expect(await response.json()).toEqual({
        output: [
          {
            type: 'message',
            content: [{ type: 'output_text', text: 'done', annotations: [] }],
          },
        ],
      });
    } finally {
      fetchMock.mockRestore();
    }
  });

  it('does not normalize non-Responses endpoints', async () => {
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ output: [{ type: 'message' }] }), {
        headers: { 'content-type': 'application/json' },
      }),
    );

    try {
      const response = await createFetch({ normalizeResponses: true })(
        'https://gateway.example/v1/chat/completions',
        {},
      );

      expect(await response.json()).toEqual({ output: [{ type: 'message' }] });
    } finally {
      fetchMock.mockRestore();
    }
  });
});
