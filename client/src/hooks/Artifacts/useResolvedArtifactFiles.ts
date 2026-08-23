import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QueryKeys, dataService } from 'librechat-data-provider';
import type { ArtifactFiles } from '~/common';
import { getAttachmentFileIds, resolveAttachmentReferences } from '~/utils/artifacts';
import { useAuthContext } from '~/hooks/AuthContext';

const URL_REFRESH_INTERVAL = 30 * 60_000;

export default function useResolvedArtifactFiles({
  files,
  fileKey,
  currentCode,
}: {
  files: ArtifactFiles;
  fileKey: string;
  currentCode?: string;
}): ArtifactFiles {
  const { user } = useAuthContext();
  const hasFiles = Object.keys(files).length > 0;
  const source = currentCode ?? files[fileKey] ?? '';
  const fileIds = useMemo(() => getAttachmentFileIds(source), [source]);
  const { data: urls } = useQuery<Record<string, string>>(
    [QueryKeys.fileDownload, 'artifact', user?.id ?? '', ...fileIds],
    async () => {
      const entries = await Promise.all(
        fileIds.map(async (fileId): Promise<[string, string] | null> => {
          try {
            const result = await dataService.getFileDownloadURL(user?.id ?? '', fileId, true);
            return result.url ? [fileId, result.url] : null;
          } catch {
            return null;
          }
        }),
      );
      return entries.reduce<Record<string, string>>((result, entry) => {
        if (entry) {
          result[entry[0]] = entry[1];
        }
        return result;
      }, {});
    },
    {
      enabled: Boolean(user?.id && fileIds.length),
      retry: false,
      refetchOnMount: 'always',
      refetchInterval: fileIds.length ? URL_REFRESH_INTERVAL : false,
    },
  );
  const isResolving = fileIds.length > 0 && urls == null;

  return useMemo(() => {
    if (isResolving) {
      return {};
    }
    if (!hasFiles) {
      return files;
    }
    return { ...files, [fileKey]: resolveAttachmentReferences(source, urls ?? {}) };
  }, [fileKey, files, hasFiles, isResolving, source, urls]);
}
