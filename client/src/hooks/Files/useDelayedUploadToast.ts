import { useRef } from 'react';
import { useToastContext } from '@librechat/client';
import { useLocalize } from '~/hooks';

export const useDelayedUploadToast = () => {
  const localize = useLocalize();
  const { showToast } = useToastContext();
  const uploadTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const determineDelay = (fileSize: number): number => {
    const baseDelay = 5000;
    const additionalDelay = Math.floor(fileSize / 1000000) * 2000;
    return baseDelay + additionalDelay;
  };

  const startUploadTimer = (fileId: string, fileName: string, fileSize: number) => {
    const delay = determineDelay(fileSize);

    const existingTimer = uploadTimers.current[fileId];
    if (existingTimer !== undefined) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      delete uploadTimers.current[fileId];
      const message = localize('com_ui_upload_delay', { 0: fileName });
      showToast({
        message,
        status: 'warning',
        duration: 10000,
      });
    }, delay);

    uploadTimers.current[fileId] = timer;
  };

  const clearUploadTimer = (fileId: string) => {
    const timer = uploadTimers.current[fileId];
    if (timer !== undefined) {
      clearTimeout(timer);
      delete uploadTimers.current[fileId];
    }
  };

  return { startUploadTimer, clearUploadTimer };
};
