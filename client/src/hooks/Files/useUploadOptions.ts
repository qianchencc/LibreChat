import { useCallback } from 'react';
import { mergeFileConfig, getEndpointFileConfig } from 'librechat-data-provider';
import type { EToolResources } from 'librechat-data-provider';
import useAgentToolPermissions from '~/hooks/Agents/useAgentToolPermissions';
import { useGetFileConfig } from '~/data-provider';
import { getViableUploadOptions } from '~/utils';
import { useDragDropContext } from '~/Providers';

/**
 * Resolves which upload destinations a file set can be routed to, plus whether uploads are
 * disabled for the endpoint. Shared by the paste, drag, and modal flows so they decide
 * consistently from one source.
 */
export default function useUploadOptions() {
  const { agentId, endpoint, endpointType, useResponsesApi } = useDragDropContext();
  const { provider } = useAgentToolPermissions(agentId);
  const {
    data: fileConfig = null,
    isError: isFileConfigError,
    isPaused: isFileConfigPaused,
    isSuccess: isFileConfigLoaded,
  } = useGetFileConfig({
    select: (data) => mergeFileConfig(data),
  });
  /** Destination checks read this config, so callers can tell "not viable" from "not known yet". */
  const isConfigPending = !isFileConfigLoaded && !isFileConfigError && !isFileConfigPaused;

  const endpointFileConfig = getEndpointFileConfig({
    fileConfig,
    endpoint: provider || endpoint,
    endpointType,
  });
  const uploadsDisabled = endpointFileConfig.disabled === true;
  const endpointSupportedMimeTypes = endpointFileConfig.supportedMimeTypes;

  const getOptions = useCallback(
    (files: File[]): (EToolResources | undefined)[] =>
      getViableUploadOptions(files, {
        provider,
        endpoint,
        endpointType,
        useResponsesApi,
        fileSearchEnabled: false,
        codeEnabled: false,
        contextEnabled: false,
        fileSearchAllowedByAgent: false,
        codeAllowedByAgent: false,
        fileConfig,
        endpointSupportedMimeTypes,
      }),
    [provider, endpoint, endpointType, useResponsesApi, fileConfig, endpointSupportedMimeTypes],
  );

  return { getOptions, uploadsDisabled, isConfigPending };
}
