export type CaptureStatus = 'requesting_permission' | 'connecting' | 'listening' | 'stopped' | 'error';

export interface CaptureDiagnostics {
  streamActive: boolean;
  audioTrackState: MediaStreamTrackState | 'unavailable';
  sampleRate?: number;
}

export interface CaptureInterruption {
  tabId: number;
  reason: 'track_ended' | 'tab_closed' | 'tab_navigated';
}

export interface CaptureDependencies {
  getActiveTabId: () => Promise<number>;
  getMediaStreamId: (tabId: number) => Promise<string>;
  getUserMedia: (streamId: string) => Promise<MediaStream>;
  getDisplayMedia?: () => Promise<MediaStream>;
  createAudioContext: () => AudioContext;
}

export interface ActiveCapture {
  tabId?: number;
  diagnostics: CaptureDiagnostics;
}

export interface PcmTap {
  sampleRate: number;
  stop: () => void;
}

export type CaptureStatusListener = (status: Exclude<CaptureStatus, 'listening' | 'stopped' | 'error'>) => void;

function browserDependencies(): CaptureDependencies {
  return {
    async getActiveTabId(): Promise<number> {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (tab?.id === undefined) throw new Error('No active browser tab is available for capture.');
      return tab.id;
    },
    getMediaStreamId: (tabId) => new Promise<string>((resolve, reject) => {
      chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (streamId) => {
        const message = chrome.runtime.lastError?.message;
        if (message) reject(new Error(message));
        else resolve(streamId);
      });
    }),
    getUserMedia: (streamId) => navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId
        }
      } as unknown as MediaTrackConstraints,
      video: false
    }),
    getDisplayMedia: () => navigator.mediaDevices.getDisplayMedia({ audio: true, video: true }),
    createAudioContext: () => new AudioContext()
  };
}

export class TabAudioCapture {
  private stream?: MediaStream;
  private audioContext?: AudioContext;
  private sourceNode?: MediaStreamAudioSourceNode;
  private analyserNode?: AnalyserNode;
  private pcmProcessor?: AudioWorkletNode;
  private pcmSilenceGain?: GainNode;
  private tabId?: number;
  private track?: MediaStreamTrack;
  private onTrackEnded?: () => void;

  constructor(
    private readonly onInterrupted: (interruption: CaptureInterruption) => void,
    private readonly dependencies: CaptureDependencies = browserDependencies(),
    private readonly onStatus: CaptureStatusListener = () => undefined
  ) {}

  async start(): Promise<ActiveCapture> {
    if (this.stream || this.audioContext) await this.stop();
    try {
      this.onStatus('requesting_permission');
      const tabId = await this.dependencies.getActiveTabId();
      const streamId = await this.dependencies.getMediaStreamId(tabId);
      this.onStatus('connecting');
      const stream = await this.dependencies.getUserMedia(streamId);
      return await this.activateStream(stream, tabId);
    } catch (error) {
      await this.stop();
      throw error;
    }
  }

  async startWithPicker(): Promise<ActiveCapture> {
    if (this.stream || this.audioContext) await this.stop();
    try {
      this.onStatus('requesting_permission');
      if (!this.dependencies.getDisplayMedia) throw new Error('This Chrome version cannot open the tab audio picker.');
      const stream = await this.dependencies.getDisplayMedia();
      this.onStatus('connecting');
      // getDisplayMedia requires requesting a display track. Stop it immediately:
      // the extension never reads, renders, or retains video.
      stream.getVideoTracks().forEach((videoTrack) => videoTrack.stop());
      return await this.activateStream(stream);
    } catch (error) {
      await this.stop();
      throw error;
    }
  }

  private async activateStream(stream: MediaStream, tabId?: number): Promise<ActiveCapture> {
    const track = stream.getAudioTracks()[0];
    if (!track || track.readyState === 'ended') {
      stream.getTracks().forEach((mediaTrack) => mediaTrack.stop());
      throw new Error('No tab audio was shared. In the Chrome picker, choose the Google Meet tab and enable Share tab audio.');
    }

    this.stream = stream;
    this.tabId = tabId;
    this.track = track;
    this.audioContext = this.dependencies.createAudioContext();
    this.sourceNode = this.audioContext.createMediaStreamSource(stream);
    this.sourceNode.connect(this.audioContext.destination);
    this.onTrackEnded = () => {
      const interruptedTabId = this.tabId;
      void this.stop().finally(() => {
        if (interruptedTabId !== undefined) this.onInterrupted({ tabId: interruptedTabId, reason: 'track_ended' });
      });
    };
    track.addEventListener('ended', this.onTrackEnded, { once: true });
    if (this.audioContext.state === 'suspended') await this.audioContext.resume();

    return { ...(tabId === undefined ? {} : { tabId }), diagnostics: this.diagnostics() };
  }

  async stop(): Promise<void> {
    const track = this.track;
    const onTrackEnded = this.onTrackEnded;
    this.track = undefined;
    this.onTrackEnded = undefined;
    if (track && onTrackEnded) track.removeEventListener('ended', onTrackEnded);

    const sourceNode = this.sourceNode;
    const analyserNode = this.analyserNode;
    const pcmProcessor = this.pcmProcessor;
    const pcmSilenceGain = this.pcmSilenceGain;
    const stream = this.stream;
    const audioContext = this.audioContext;
    this.sourceNode = undefined;
    this.analyserNode = undefined;
    this.pcmProcessor = undefined;
    this.pcmSilenceGain = undefined;
    this.stream = undefined;
    this.audioContext = undefined;
    this.tabId = undefined;

    sourceNode?.disconnect();
    analyserNode?.disconnect();
    if (pcmProcessor) pcmProcessor.port.onmessage = null;
    pcmProcessor?.disconnect();
    pcmSilenceGain?.disconnect();
    stream?.getTracks().forEach((mediaTrack) => mediaTrack.stop());
    if (audioContext && audioContext.state !== 'closed') await audioContext.close();
  }

  async interrupt(interruption: CaptureInterruption): Promise<void> {
    if (this.tabId !== interruption.tabId) return;
    await this.stop();
    this.onInterrupted(interruption);
  }

  createAnalyser(): AnalyserNode {
    if (!this.audioContext || !this.sourceNode) throw new Error('Start tab capture before starting voice detection.');
    this.analyserNode?.disconnect();
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 2048;
    this.sourceNode.connect(this.analyserNode);
    return this.analyserNode;
  }

  async createPcmTap(onSamples: (samples: Float32Array) => void): Promise<PcmTap> {
    if (!this.audioContext || !this.sourceNode) throw new Error('Start tab capture before recording audio.');
    const audioContext = this.audioContext;
    const sourceNode = this.sourceNode;
    this.pcmProcessor?.disconnect();
    this.pcmSilenceGain?.disconnect();
    await audioContext.audioWorklet.addModule(chrome.runtime.getURL('pcm-capture-worklet.js'));
    if (this.audioContext !== audioContext || this.sourceNode !== sourceNode) {
      throw new Error('Tab capture stopped while the audio processor was loading.');
    }
    const processor = new AudioWorkletNode(audioContext, 'pcm-capture-processor', {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      channelCount: 1,
      channelCountMode: 'explicit'
    });
    const silenceGain = audioContext.createGain();
    silenceGain.gain.value = 0;
    processor.port.onmessage = (event: MessageEvent<unknown>) => {
      if (event.data instanceof Float32Array) onSamples(event.data);
    };
    sourceNode.connect(processor);
    processor.connect(silenceGain);
    silenceGain.connect(audioContext.destination);
    this.pcmProcessor = processor;
    this.pcmSilenceGain = silenceGain;
    return {
      sampleRate: audioContext.sampleRate,
      stop: () => {
        if (this.pcmProcessor !== processor) return;
        processor.port.onmessage = null;
        processor.disconnect();
        silenceGain.disconnect();
        this.pcmProcessor = undefined;
        this.pcmSilenceGain = undefined;
      }
    };
  }

  activeStream(): MediaStream | undefined {
    return this.stream;
  }

  diagnostics(): CaptureDiagnostics {
    return {
      streamActive: this.stream?.active ?? false,
      audioTrackState: this.track?.readyState ?? 'unavailable',
      sampleRate: this.audioContext?.sampleRate
    };
  }
}
