import { act, renderHook } from '@testing-library/react';
import { useDelayedUploadToast } from '../useDelayedUploadToast';

const mockShowToast = jest.fn();
const mockLocalize = jest.fn((key: string) => key);

jest.mock('@librechat/client', () => ({
  useToastContext: jest.fn(() => ({ showToast: mockShowToast })),
}));

jest.mock('~/hooks', () => ({
  useLocalize: jest.fn(() => mockLocalize),
}));

describe('useDelayedUploadToast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not warn after an upload finishes in the same render', () => {
    const { result } = renderHook(() => useDelayedUploadToast());

    act(() => {
      result.current.startUploadTimer('file-1', 'photo.png', 0);
      result.current.clearUploadTimer('file-1');
      jest.advanceTimersByTime(5000);
    });

    expect(mockShowToast).not.toHaveBeenCalled();
  });

  it('warns when an upload is still running after the delay', () => {
    const { result } = renderHook(() => useDelayedUploadToast());

    act(() => {
      result.current.startUploadTimer('file-1', 'photo.png', 0);
      jest.advanceTimersByTime(5000);
    });

    expect(mockShowToast).toHaveBeenCalledWith({
      message: 'com_ui_upload_delay',
      status: 'warning',
      duration: 10000,
    });
  });
});
