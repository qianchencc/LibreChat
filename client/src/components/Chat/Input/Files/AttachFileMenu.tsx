import React, { useRef, useState, useMemo, useCallback } from 'react';
import * as Ariakit from '@ariakit/react';
import { FileImageIcon } from 'lucide-react';
import {
  FileUpload,
  TooltipAnchor,
  DropdownPopup,
  AttachmentIcon,
  SharePointIcon,
} from '@librechat/client';
import {
  Providers,
  EModelEndpoint,
  getConfiguredMimeAccept,
  bedrockDocumentMimeTypes,
  bedrockDocumentExtensions,
  isDocumentSupportedProvider,
} from 'librechat-data-provider';
import type {
  TConversation,
  EndpointFileConfig,
  MimeUploadCapability,
} from 'librechat-data-provider';
import type { ExtendedFile, FileSetter, MenuItemProps } from '~/common';
import { useAgentToolPermissions, useFileHandlingNoChatContext, useLocalize } from '~/hooks';
import { useSharePointFileHandlingNoChatContext } from '~/hooks/Files/useSharePointFileHandling';
import { useShortcutAriaKey, useShortcutHint } from '~/hooks/useKeyboardShortcuts';
import { SharePointPickerDialog } from '~/components/SharePoint';
import { useGetStartupConfig } from '~/data-provider';
import { cn } from '~/utils';

type FileUploadType =
  | 'image'
  | 'image_document'
  | 'image_document_extended'
  | 'image_document_video_audio';

const fileTypeCapabilities: Record<FileUploadType, MimeUploadCapability> = {
  image: { categories: ['image'] },
  image_document: { categories: ['image', 'document'] },
  image_document_extended: {
    categories: ['image', 'document'],
    documentMimeTypes: bedrockDocumentMimeTypes,
  },
  image_document_video_audio: {
    categories: ['image', 'document', 'audio', 'video'],
    documentMimeTypes: ['application/pdf'],
  },
};

interface AttachFileMenuProps {
  agentId?: string | null;
  endpoint?: string | null;
  disabled?: boolean | null;
  conversationId: string;
  endpointType?: EModelEndpoint | string;
  endpointFileConfig?: EndpointFileConfig;
  useResponsesApi?: boolean;
  files: Map<string, ExtendedFile>;
  setFiles: FileSetter;
  setFilesLoading: React.Dispatch<React.SetStateAction<boolean>>;
  conversation: TConversation | null;
}

const AttachFileMenu = ({
  agentId,
  endpoint,
  disabled,
  endpointType,
  endpointFileConfig,
  useResponsesApi,
  files,
  setFiles,
  setFilesLoading,
  conversation,
}: AttachFileMenuProps) => {
  const localize = useLocalize();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPopoverActive, setIsPopoverActive] = useState(false);
  const [isSharePointDialogOpen, setIsSharePointDialogOpen] = useState(false);
  const isUploadDisabled = disabled ?? false;
  const uploadFileTooltip = useShortcutHint('uploadFile', localize('com_sidepanel_attach_files'));
  const uploadFileAriaKey = useShortcutAriaKey('uploadFile');
  const { handleFileChange } = useFileHandlingNoChatContext(undefined, {
    files,
    setFiles,
    setFilesLoading,
    conversation,
  });
  const { handleSharePointFiles, isProcessing, downloadProgress } =
    useSharePointFileHandlingNoChatContext(
      { toolResource: undefined },
      { files, setFiles, setFilesLoading, conversation },
    );
  const { provider } = useAgentToolPermissions(agentId);
  const { data: startupConfig } = useGetStartupConfig();
  const sharePointEnabled = startupConfig?.sharePointFilePickerEnabled === true;

  const providerFileType = useMemo<FileUploadType>(() => {
    let currentProvider = provider || endpoint;
    if (currentProvider?.toLowerCase() === Providers.OPENROUTER) {
      currentProvider = Providers.OPENROUTER;
    }
    const supportsDocuments =
      isDocumentSupportedProvider(endpointType) ||
      isDocumentSupportedProvider(currentProvider) ||
      ((currentProvider === EModelEndpoint.azureOpenAI ||
        endpointType === EModelEndpoint.azureOpenAI) &&
        useResponsesApi === true);
    if (!supportsDocuments) {
      return 'image';
    }
    if (currentProvider === Providers.GOOGLE || currentProvider === Providers.OPENROUTER) {
      return 'image_document_video_audio';
    }
    if (currentProvider === Providers.BEDROCK || endpointType === EModelEndpoint.bedrock) {
      return 'image_document_extended';
    }
    return 'image_document';
  }, [endpoint, endpointType, provider, useResponsesApi]);

  const openProviderPicker = useCallback(() => {
    if (!inputRef.current) {
      return;
    }
    inputRef.current.value = '';
    const configuredAccept = getConfiguredMimeAccept(
      endpointFileConfig?.supportedMimeTypes,
      fileTypeCapabilities[providerFileType],
    );
    if (configuredAccept != null) {
      inputRef.current.accept = configuredAccept;
    } else if (providerFileType === 'image') {
      inputRef.current.accept = 'image/*,.heif,.heic';
    } else if (providerFileType === 'image_document') {
      inputRef.current.accept = 'image/*,.heif,.heic,.pdf,application/pdf';
    } else if (providerFileType === 'image_document_extended') {
      inputRef.current.accept = `image/*,.heif,.heic,${bedrockDocumentExtensions}`;
    } else {
      inputRef.current.accept = 'image/*,.heif,.heic,.pdf,application/pdf,video/*,audio/*';
    }
    inputRef.current.click();
    inputRef.current.accept = '';
  }, [endpointFileConfig?.supportedMimeTypes, providerFileType]);

  const sourceItems = useMemo<MenuItemProps[]>(
    () => [
      {
        label: localize('com_files_upload_local_machine'),
        onClick: openProviderPicker,
        icon: <FileImageIcon className="icon-md" />,
      },
      {
        label: localize('com_files_upload_sharepoint'),
        onClick: () => setIsSharePointDialogOpen(true),
        icon: <SharePointIcon className="icon-md" />,
      },
    ],
    [localize, openProviderPicker],
  );

  const trigger = (
    <TooltipAnchor
      render={
        <button
          type="button"
          disabled={isUploadDisabled}
          id="attach-file-menu-button"
          aria-label={localize('com_sidepanel_attach_files')}
          aria-keyshortcuts={uploadFileAriaKey}
          onClick={sharePointEnabled ? undefined : openProviderPicker}
          className={cn(
            'flex size-theme-control items-center justify-center rounded-theme-control-round p-1 transition-colors duration-theme-fast hover:bg-surface-composer-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary focus-visible:ring-opacity-50',
            isPopoverActive && 'bg-surface-composer-hover',
          )}
        >
          <AttachmentIcon />
        </button>
      }
      id="attach-file-menu-button"
      description={uploadFileTooltip}
      disabled={isUploadDisabled}
    />
  );

  return (
    <>
      <FileUpload ref={inputRef} handleFileChange={(event) => handleFileChange(event, undefined)}>
        {sharePointEnabled ? (
          <DropdownPopup
            menuId="attach-file-source-menu"
            className="overflow-visible"
            isOpen={isPopoverActive}
            setIsOpen={setIsPopoverActive}
            modal={false}
            portal={true}
            unmountOnHide={true}
            trigger={<Ariakit.MenuButton render={trigger} />}
            items={sourceItems}
            iconClassName="mr-0"
          />
        ) : (
          trigger
        )}
      </FileUpload>
      <SharePointPickerDialog
        isOpen={isSharePointDialogOpen}
        onOpenChange={setIsSharePointDialogOpen}
        onFilesSelected={async (sharePointFiles) => {
          await handleSharePointFiles(sharePointFiles);
          setIsSharePointDialogOpen(false);
        }}
        disabled={isUploadDisabled}
        isDownloading={isProcessing}
        downloadProgress={downloadProgress}
        maxSelectionCount={endpointFileConfig?.fileLimit}
      />
    </>
  );
};

export default React.memo(AttachFileMenu);
