import { EModelEndpoint } from 'librechat-data-provider';
import type { TConfig, TModelsConfig } from 'librechat-data-provider';

export const IMAGE_PROVIDER_MODEL = 'gpt-image-2';

interface ImageProviderReadinessInput {
  provider?: string;
  endpointConfig?: Pick<TConfig, 'type' | 'userProvideKey'> | null;
  models?: TModelsConfig;
  hasUserKey: boolean;
}

export function isImageProviderReady({
  provider,
  endpointConfig,
  models,
  hasUserKey,
}: ImageProviderReadinessInput): boolean {
  if (!provider || endpointConfig?.type !== EModelEndpoint.custom) {
    return false;
  }

  if (!models?.[provider]?.includes(IMAGE_PROVIDER_MODEL)) {
    return false;
  }

  return endpointConfig.userProvideKey !== true || hasUserKey;
}
