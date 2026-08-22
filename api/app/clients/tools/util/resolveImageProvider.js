const { getCustomEndpointConfig, isUserProvided } = require('@librechat/api');
const { extractEnvVariable } = require('librechat-data-provider');
const models = require('~/models');

const IMAGE_MODEL = 'gpt-image-2';

/**
 * Resolves image tool credentials from the custom endpoint used by an agent.
 * Environment-backed image tool credentials remain the fallback when the agent
 * does not use a custom endpoint.
 *
 * @param {Object} params
 * @param {Object} params.agent
 * @param {Object} params.req
 * @param {string} params.userId
 * @returns {Promise<Object>}
 */
async function resolveImageProviderConfig({ agent, req, userId }) {
  const appConfig = req?.config;
  if (!appConfig) {
    return {};
  }

  const providerCandidates = [...new Set([agent?.endpoint, agent?.provider].filter(Boolean))];
  for (const provider of providerCandidates) {
    const endpointConfig = getCustomEndpointConfig({ endpoint: provider, appConfig });
    if (!endpointConfig) {
      continue;
    }

    const configuredApiKey = extractEnvVariable(endpointConfig.apiKey ?? '');
    const configuredBaseURL = extractEnvVariable(endpointConfig.baseURL ?? '');
    const userProvidesKey = isUserProvided(configuredApiKey);
    const userProvidesURL = isUserProvided(configuredBaseURL);
    const userValues =
      userProvidesKey || userProvidesURL
        ? await models.getUserKeyValues({
            userId,
            name: endpointConfig.name ?? provider,
          })
        : {};
    const apiKey = userProvidesKey ? userValues?.apiKey : configuredApiKey;
    const baseURL = userProvidesURL ? userValues?.baseURL : configuredBaseURL;
    const imageModel = endpointConfig.models?.default?.some((model) =>
      typeof model === 'string' ? model === IMAGE_MODEL : model?.name === IMAGE_MODEL,
    )
      ? IMAGE_MODEL
      : undefined;

    return {
      ...(apiKey ? { IMAGE_GEN_OAI_API_KEY: apiKey } : {}),
      ...(baseURL ? { IMAGE_GEN_OAI_BASEURL: baseURL } : {}),
      ...(imageModel ? { IMAGE_GEN_OAI_MODEL: imageModel } : {}),
    };
  }

  return {};
}

module.exports = {
  resolveImageProviderConfig,
};
