import { describe, expect, it, vi } from 'vitest';
import { TabAudioCapture } from './tab-capture';

function createCaptureFixture(): {
  capture: TabAudioCapture;
  track: MediaStreamTrack;
  stream: MediaStream;
  context: AudioContext;
  interrupted: ReturnType<typeof vi.fn>;
  getMediaStreamId: ReturnType<typeof vi.fn>;
  getDisplayMedia: ReturnType<typeof vi.fn>;
} {
  const track = {
    readyState: 'live',
    stop: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  } as unknown as MediaStreamTrack;
  const stream = {
    active: true,
    getAudioTracks: () => [track],
    getTracks: () => [track],
    getVideoTracks: () => []
  } as unknown as MediaStream;
  const source = { connect: vi.fn(), disconnect: vi.fn() } as unknown as MediaStreamAudioSourceNode;
  const context = {
    state: 'running',
    sampleRate: 48_000,
    createMediaStreamSource: vi.fn(() => source),
    destination: {},
    close: vi.fn(async () => undefined)
  } as unknown as AudioContext;
  const interrupted = vi.fn();
  const getMediaStreamId = vi.fn(async () => 'stream-id');
  const getDisplayMedia = vi.fn(async () => stream);
  const capture = new TabAudioCapture(interrupted, {
    getActiveTabId: vi.fn(async () => 42),
    getMediaStreamId,
    getUserMedia: vi.fn(async () => stream),
    getDisplayMedia,
    createAudioContext: vi.fn(() => context)
  });
  return { capture, track, stream, context, interrupted, getMediaStreamId, getDisplayMedia };
}

describe('TabAudioCapture', () => {
  it('captures only the active authorized tab audio and exposes diagnostics', async () => {
    const { capture, getMediaStreamId } = createCaptureFixture();
    await expect(capture.start()).resolves.toEqual({
      tabId: 42,
      diagnostics: { streamActive: true, audioTrackState: 'live', sampleRate: 48_000 }
    });
    expect(getMediaStreamId).toHaveBeenCalledWith(42);
  });

  it('releases tracks and AudioContext on stop', async () => {
    const { capture, track, context } = createCaptureFixture();
    await capture.start();
    await capture.stop();

    expect(track.stop).toHaveBeenCalledOnce();
    expect(context.close).toHaveBeenCalledOnce();
    expect(capture.diagnostics()).toEqual({ streamActive: false, audioTrackState: 'unavailable', sampleRate: undefined });
  });

  it('uses a user-selected tab audio stream without activeTab permission', async () => {
    const { capture, getDisplayMedia } = createCaptureFixture();

    await expect(capture.startWithPicker()).resolves.toEqual({
      diagnostics: { streamActive: true, audioTrackState: 'live', sampleRate: 48_000 }
    });
    expect(getDisplayMedia).toHaveBeenCalledOnce();
  });

  it('cleans up when the captured tab navigation interrupts the capture', async () => {
    const { capture, track, context, interrupted } = createCaptureFixture();
    await capture.start();
    await capture.interrupt({ tabId: 42, reason: 'tab_navigated' });

    expect(track.stop).toHaveBeenCalledOnce();
    expect(context.close).toHaveBeenCalledOnce();
    expect(interrupted).toHaveBeenCalledWith({ tabId: 42, reason: 'tab_navigated' });
  });
});
