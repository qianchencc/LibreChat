import { useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QueryKeys, dataService, sharedFile } from 'librechat-data-provider';
import type { ArtifactFiles } from '~/common';
import { getAttachmentFileIds, resolveAttachmentReferences } from '~/utils/artifacts';
import { AuthContext } from '~/hooks/AuthContext';
import { useShareContext } from '~/Providers';

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
  const authContext = useContext(AuthContext);
  const { shareId } = useShareContext();
  const userId = authContext?.user?.id;
  const hasFiles = Object.keys(files).length > 0;
  const source = currentCode ?? files[fileKey] ?? '';
  const fileIds = useMemo(() => getAttachmentFileIds(source), [source]);
  const sharedUrls = useMemo(
    () =>
      shareId
        ? fileIds.reduce<Record<string, string>>((result, fileId) => {
            result[fileId] = new URL(sharedFile(shareId, fileId), window.location.origin).href;
            return result;
          }, {})
        : undefined,
    [fileIds, shareId],
  );
  const { data: privateUrls } = useQuery<Record<string, string>>(
    [QueryKeys.fileDownload, 'artifact', userId ?? '', ...fileIds],
    async () => {
      const entries = await Promise.all(
        fileIds.map(async (fileId): Promise<[string, string] | null> => {
          try {
            const result = await dataService.getFileDownloadURL(userId ?? '', fileId, true);
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
      enabled: Boolean(userId && fileIds.length),
      retry: false,
      refetchOnMount: 'always',
      refetchInterval: fileIds.length ? URL_REFRESH_INTERVAL : false,
    },
  );
  const urls = sharedUrls ?? privateUrls;
  const isResolving = !shareId && fileIds.length > 0 && privateUrls == null;

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
